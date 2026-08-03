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
import type { EditorState } from "@/features/editor/domains/editor-state";
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

/** スキーマが宣言している prop。既定はスキーマの `default`。 */
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
 * セクションの並びは `group` の初出順、セクション内は宣言順（docs/03「order フィールドは持たない」）。
 */
function sectionsOf(
  editables: readonly EditableProp[],
  props: Props,
  tokens: TokenSet,
): readonly PropControlSection[] {
  const effective = effectiveProps(editables, props);
  const enabled = editables.filter((editable) =>
    PropDefinition.isEnabled(editable.definition, effective),
  );
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

/** ノードが編集できる prop。参照ノードは公開 prop、プリミティブはスキーマから引く。 */
function nodeSections(
  document: DesignDocument,
  node: Node,
): readonly PropControlSection[] {
  if (Node.isRef(node)) {
    return sectionsOf(
      publicEditableProps(document.components, node),
      node.overrides ?? {},
      document.tokens,
    );
  }
  if (!PrimitiveSchema.isPrimitiveType(node.type)) {
    return [];
  }
  const schema: PrimitiveSchema = PrimitiveSchema.forType(node.type);
  return sectionsOf(
    declaredEditableProps(schema.props),
    node.props ?? {},
    document.tokens,
  );
}

export const PropControl = {
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

export const PropControlSection = {
  /**
   * 選択中のものを編集するセクションの並び（docs/06-ui.md「画面構成」）。
   * 選択が無い・スキーマの分からない type・解決できない部品では空になる。
   */
  forSelection(state: EditorState): readonly PropControlSection[] {
    if (!state.selectedName.some) {
      return [];
    }
    const name = state.selectedName.value;
    const artboard = DesignDocument.findArtboard(state.document, name);
    if (artboard.some) {
      return sectionsOf(
        declaredEditableProps(Artboard.propDefinitions()),
        artboard.value.props ?? {},
        state.document.tokens,
      );
    }
    const node = DesignDocument.findNode(state.document, name);
    return node.some ? nodeSections(state.document, node.value) : [];
  },
} as const;
