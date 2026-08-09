import { Artboard } from "@/domains/artboard";
import { Component, ComponentSet } from "@/domains/component";
import { DesignDocument } from "@/domains/design-document";
import {
  Node,
  PropEdit,
  type Props,
  type PropValue,
  type RefNode,
} from "@/domains/node";
import {
  PrimitiveSchema,
  PropDefinition,
  type PropDefinitionRecord,
} from "@/domains/primitive-schema";
import { TokenSet } from "@/domains/token";
import { EditorState } from "@/features/editor/domains/editor-state";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/*
 * プロパティパネルはスキーマ定数の走査だけで組み立てる（docs/03-schema.md
 * 「スキーマからプロパティパネルを自動生成する」）。prop の追加がスキーマへの
 * 1エントリ追加で完結する状態を保つため、prop 名で分岐するコードをここにも
 * パネル側にも書かない。
 *
 * 「コントロール」はエディタ画面の語彙なので、この導出は `src/domains/` ではなく
 * feature 側に置く。`PropDefinition` に `controlInput()` を生やすと core が UI の
 * 表現を知ることになり、依存が domains → features へ逆流する。
 */

/** 入力欄の種類。値の決め方（`domain`）から決まる。 */
export type PropControlInput =
  | Readonly<{ kind: "choice"; options: readonly string[] }>
  | Readonly<{ kind: "number" }>
  | Readonly<{ kind: "text" }>;

/**
 * 1 prop 分の編集欄。
 * `value`（明示的に設定されている値）と `defaultValue`（設定が無いときに効く値）を
 * 別々に持つのは、パネルが両者を区別して見せるため（docs/06-ui.md）。
 */
export type PropControl = Readonly<{
  prop: string;
  input: PropControlInput;
  value: Option<PropValue>;
  defaultValue: Option<PropValue>;
}>;

/** `group` ごとのまとまり（docs/03「`group` プロパティパネルのセクション」）。 */
export type PropControlSection = Readonly<{
  group: string;
  controls: readonly PropControl[];
}>;

/**
 * 選択中のものに対して右ペインが出す編集欄。
 *
 * インスタンスだけ形が違う（UI 案 docs/Design Composer.html の `Assets · Instance` は
 * `group` ごとのセクションではなく `Public props` の 1 節と出どころの部品を出す）。
 * 直和にするのは、同じ型で表すと「インスタンスなのに出どころが無い」
 * 「プリミティブなのに出どころがある」が作れてしまうため
 * （`rules/coding.md`「正しい状態だけを列挙する」）。
 *
 * 公開 prop に `group` を持たせないのは、その `group` が binding 先のプリミティブの
 * ものだから。出すと部品の内部構造が見出しに漏れる。
 *
 * `isDetachEnabled` を持つのは、参照先の部品が無い・循環している間は解除できず
 * （`InstanceComposition.detach` が失敗する）、押しても何も起きないボタンになるため。
 * 不正なドキュメントも画面には残る（docs/03-schema.md「不正ファイル時の挙動」）ので、
 * この状態は実際に出る。
 */
export type SelectionControls =
  | Readonly<{ kind: "groups"; sections: readonly PropControlSection[] }>
  | Readonly<{
      kind: "instance";
      source: string;
      publicProps: readonly PropControl[];
      isDetachEnabled: boolean;
    }>;

/**
 * パネルに出す prop 1件の素材。定義と既定値を別々に持つのは、参照ノードでは
 * 既定がスキーマではなく部品定義側にあるため（`PublicPropTarget.declared`）。
 */
type EditableProp = Readonly<{
  name: string;
  definition: PropDefinition;
  defaultValue: Option<PropValue>;
}>;

/**
 * enum とトークン参照はどちらも選択式で、選択肢の出どころだけが違う
 * （`values` を読むか tokens 定義から引くか）ため 1 つの種類に畳む。
 *
 * @param definition 入力の形を決める prop の宣言
 * @param tokens トークン参照の選択肢の出どころ
 * @returns 選択式なら選択肢つきの `choice`、それ以外は `number` / `text`
 */
function inputOf(
  definition: PropDefinition,
  tokens: TokenSet,
): PropControlInput {
  if (PropDefinition.isEnum(definition)) {
    return { kind: "choice", options: definition.values };
  }
  if (PropDefinition.isToken(definition)) {
    return {
      kind: "choice",
      options: TokenSet.names(tokens, definition.tokenKind),
    };
  }
  return definition.literalType === "number"
    ? { kind: "number" }
    : { kind: "text" };
}

/**
 * スキーマが宣言している prop。既定はスキーマの `default`。
 *
 * @param schema 読み出し元のスキーマ
 * @returns 宣言順に並べた、編集できる prop の並び
 */
function declaredEditableProps(
  schema: PropDefinitionRecord,
): readonly EditableProp[] {
  return Object.entries(schema).map(([name, definition]) => ({
    name,
    definition,
    defaultValue: Option.fromNullable(definition.default),
  }));
}

/**
 * 部品が公開している prop（docs/06-ui.md「インスタンス」）。
 * binding 先が設定している値を既定にし、無ければスキーマの `default` に落とす。
 * 宣言が解決できない prop（部品が壊れている）はコントロールを出さない。
 *
 * @param components 参照先の部品を引くための部品一式
 * @param node 公開 prop を知りたいインスタンスのノード
 * @returns 編集できる公開 prop の並び。参照先や宣言が解決できなければ空
 */
function publicEditableProps(
  components: ComponentSet,
  node: RefNode,
): readonly EditableProp[] {
  const component = ComponentSet.get(components, node.ref);
  if (component === undefined) {
    return [];
  }
  return Component.publicPropNames(component).flatMap((name) => {
    const target = ComponentSet.publicPropTarget(components, {
      component: node.ref,
      prop: name,
    });
    if (!target.some) {
      return [];
    }
    const { definition, declared } = target.value;
    return [
      {
        name,
        definition,
        defaultValue: declared.some
          ? declared
          : Option.fromNullable(definition.default),
      },
    ];
  });
}

/**
 * `enabledWhen` の判定に使う props。
 * 設定されていない prop も既定値では効いているため、既定を敷いた上で判定する
 * （`widthMode` を書いていない Box でも既定の `hug` として扱われ、`width` は出ない）。
 *
 * @param editables 既定値の出どころになる、編集できる prop の並び
 * @param props 実際に設定されている props
 * @returns 既定値の上に設定値を重ねた props
 */
function effectiveProps(
  editables: readonly EditableProp[],
  props: Props,
): Props {
  const defaults = editables.flatMap((editable) =>
    editable.defaultValue.some
      ? [[editable.name, editable.defaultValue.value] as const]
      : [],
  );
  return { ...Object.fromEntries(defaults), ...props };
}

/**
 * 1 つの prop の編集欄。今の値と、値域から決まる入力の形を持つ。
 *
 * @param editable 編集欄にする prop
 * @param props 今の値の出どころ（未設定なら `none`）
 * @param tokens トークン参照の選択肢の出どころ
 * @returns 入力の形・今の値・既定値を持つ 1 件の編集欄
 */
function controlOf(
  editable: EditableProp,
  props: Props,
  tokens: TokenSet,
): PropControl {
  return {
    prop: editable.name,
    input: inputOf(editable.definition, tokens),
    value: Option.fromNullable(props[editable.name]),
    defaultValue: editable.defaultValue,
  };
}

/**
 * 条件を満たさない prop はコントロール自体を作らない
 * （docs/06-ui.md「`enabledWhen` により表示を出し分ける」）。
 *
 * @param editables 編集できる prop の並び
 * @param props `enabledWhen` の判定に使う props
 * @returns 条件を満たす prop だけを、渡された並び順のまま返す
 */
function enabledEditableProps(
  editables: readonly EditableProp[],
  props: Props,
): readonly EditableProp[] {
  const effective = effectiveProps(editables, props);
  return editables.filter((editable) =>
    PropDefinition.isEnabled(editable.definition, effective),
  );
}

/**
 * 見出しで分けない編集欄の並び（インスタンスの `Public props`）。
 * 並びは宣言順（docs/03「order フィールドは持たない」）。
 *
 * @param editables 編集できる prop の並び
 * @param props 今の値と `enabledWhen` の判定に使う props
 * @param tokens トークン参照の選択肢の出どころ
 * @returns 条件を満たす prop の編集欄の並び
 */
function controlsOf(
  editables: readonly EditableProp[],
  props: Props,
  tokens: TokenSet,
): readonly PropControl[] {
  return enabledEditableProps(editables, props).map((editable) =>
    controlOf(editable, props, tokens),
  );
}

/**
 * セクションの並びは `group` の初出順、セクション内は宣言順
 * （docs/03「order フィールドは持たない」）。
 *
 * @param editables 編集できる prop の並び
 * @param props 今の値と `enabledWhen` の判定に使う props
 * @param tokens トークン参照の選択肢の出どころ
 * @returns `group` ごとにまとめた編集欄の並び
 */
function sectionsOf(
  editables: readonly EditableProp[],
  props: Props,
  tokens: TokenSet,
): readonly PropControlSection[] {
  const enabled = enabledEditableProps(editables, props);
  const groups = ArrayEx.distinct(
    enabled.map((editable) => editable.definition.group),
  );
  return groups.map((group) => ({
    group,
    controls: enabled
      .filter((editable) => editable.definition.group === group)
      .map((editable) => controlOf(editable, props, tokens)),
  }));
}

/**
 * ノードが編集できる prop。参照ノードは公開 prop、プリミティブはスキーマから引く。
 *
 * @param state 解除できるかの判定に使うエディタの状態
 * @param node 編集欄を出したいノード
 * @returns 参照ノードなら出どころの部品つきの公開 prop、
 *   プリミティブなら `group` ごとにまとめた編集欄。
 *   スキーマの分からない `type` ではセクションが空になる
 */
function nodeControls(state: EditorState, node: Node): SelectionControls {
  const document = EditorState.document(state);
  if (Node.isRef(node)) {
    return {
      kind: "instance",
      source: node.ref,
      publicProps: controlsOf(
        publicEditableProps(document.components, node),
        node.overrides ?? {},
        document.tokens,
      ),
      /*
       * 解除できるかは、解除そのものに答えさせる。失敗の条件（参照先が無い・
       * 循環している）を書き写すと `InstanceComposition.detach` と二重管理になり、
       * 片方だけ変わったときにボタンの出方と結果が食い違う。
       */
      isDetachEnabled: EditorState.detachInstance(state).some,
    };
  }
  if (!PrimitiveSchema.isPrimitiveType(node.type)) {
    return { kind: "groups", sections: [] };
  }
  const schema: PrimitiveSchema = PrimitiveSchema.forType(node.type);
  return {
    kind: "groups",
    sections: sectionsOf(
      declaredEditableProps(schema.props),
      node.props ?? {},
      document.tokens,
    ),
  };
}

export const PropControl = {
  /**
   * その prop に値が明示的に設定されているか（既定のままではないか）。
   *
   * インスタンスの公開 prop ではこれが「上書き済み」に当たるが、`overridden` とは
   * 名付けない。artboard やプリミティブのコントロールにも同じ判定が要り、
   * そちらには上書きの相手がいないため（`rules/naming.md`「名前と実体を一致させる」）。
   *
   * @param control 見たい編集欄
   * @returns 明示的に値が設定されていれば `true`、既定のままなら `false`
   */
  hasValue(control: PropControl): boolean {
    return control.value.some;
  },

  /**
   * 入力欄に入った文字列を、その prop への編集にする。
   *
   * 空欄を「未設定へ戻す」と読むのは入力欄の約束事なので、`PropEdit` ではなく
   * コントロールを知っているここで解釈する（文字列 prop にとって `""` は
   * それ自体が正当な値になりうるため、ドメイン側に持たせると意味が固定される）。
   * 値の作り方は入力欄の種類だけで決まるので、prop 名では分岐しない。
   */
  editFrom(control: PropControl, raw: string): PropEdit {
    if (raw === "") {
      return PropEdit.clear(control.prop);
    }
    return PropEdit.set(
      control.prop,
      control.input.kind === "number" ? Number(raw) : raw,
    );
  },
} as const;

export const SelectionControls = {
  /**
   * 選択中のものを編集する欄（docs/06-ui.md「画面構成」）。
   * 未選択を `none` で表すのは、同じ位置づけの `TokenControl.forSelection` に揃えるため。
   *
   * @param state 選択とドキュメントの出どころ
   * @returns インスタンスを選んでいるなら出どころの部品つきの公開 prop、
   *   それ以外は `group` ごとのセクション。何も選んでいないときは `none`。
   *   スキーマの分からない `type`・解決できない部品では、選択はあるので `some` だが
   *   セクションが空になる
   */
  forSelection(state: EditorState): Option<SelectionControls> {
    if (!state.selectedName.some) {
      return Option.none;
    }
    const document = EditorState.document(state);
    const name = state.selectedName.value;
    const artboard = DesignDocument.findArtboard(document, name);
    if (artboard.some) {
      return Option.some({
        kind: "groups",
        sections: sectionsOf(
          declaredEditableProps(Artboard.propDefinitions()),
          artboard.value.props ?? {},
          document.tokens,
        ),
      });
    }
    return Option.map(DesignDocument.findNode(document, name), (node) =>
      nodeControls(state, node),
    );
  },

  /**
   * 選んでいるものがインスタンスなら、その元になっている部品の名前
   * （UI 案 docs/Design Composer.html の `from ◆ primary-button` と
   * `Assets` の `source of selection`）。
   *
   * 右ペインと `Assets` パネルが同じ答えを要るので、参照先を引く経路をここ 1 つにする。
   * 別々に導出すると「パネルはインスタンスなのに `Assets` はどこも光らない」が作れる。
   *
   * @param controls 選択中のものの編集欄
   * @returns インスタンスなら元の部品名。それ以外は `none`
   */
  sourceName(controls: SelectionControls): Option<string> {
    return controls.kind === "instance"
      ? Option.some(controls.source)
      : Option.none;
  },
} as const;
