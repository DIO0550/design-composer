import { Artboard } from "@/domains/dcmp/artboard";
import { Component, ComponentSet } from "@/domains/dcmp/component";
import { DesignDocument } from "@/domains/dcmp/design-document";
import {
  Node,
  PropEdit,
  type Props,
  type PropValue,
  type RefNode,
} from "@/domains/dcmp/node";
import {
  PrimitiveSchema,
  PropDefinition,
  type PropDefinitionRecord,
  type ShorthandName,
} from "@/domains/dcmp/primitive-schema";
import {
  type ColorToken,
  type NumericTokenKind,
  TokenSet,
} from "@/domains/dcmp/token";
import { DocumentSelection } from "@/domains/session/document-selection";
import { type Side, SidePair, SidePairs, Sides } from "@/domains/unit/side";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/*
 * プロパティパネルはスキーマ定数の走査だけで組み立てる（docs/03-schema.md
 * 「スキーマからプロパティパネルを自動生成する」）。prop の追加がスキーマへの
 * 1エントリ追加で完結する状態を保つため、prop 名で分岐するコードをここにも
 * パネル側にも書かない。
 *
 * ここが持つのは props の編集規則（値域・既定・`enabledWhen`・`group`・`shorthand`）
 * で、いずれもスキーマの性質なので `src/domains/` に置く。カテゴリが `dcmp` ではなく
 * `session` なのは、**今の選択に対して**何を出すかを決める側で、`document-selection`
 * を引くため（`rules/architecture.md`「domains のカテゴリ」）。人が読む綴り（未設定の
 * ラベル・不揃いの綴り・単位）と、空欄をどう読むかは持たず、パネル側に残す
 * （`rules/architecture.md`「表示のための綴りをドメインへ持ち込まない」
 * 「入力欄の約束事をドメインへ持ち込まない」）。
 * Why not: 同じ形の `features/tokens/domains/token-control` は feature に残る。
 * あちらは `valueText` や `TokenPreview` の `widthPx` のように**綴りと見せ方そのもの**
 * を持つため。
 *
 * 今の消費側は `features/editor` の 1 つだけで、「2 つ以上の feature が必要としたら
 * 昇格」の引き金は引かれていない。それでもここに置くのは帰属を根拠にしたためで、
 * 判断は #174 の feature 分割の決定にある（#254 で分離）。
 */

/**
 * 入力欄の種類。値の決め方（`domain`）から決まる。
 *
 * enum とトークン参照はどちらも選択式だが、UI 案（docs/Design Composer.html）は
 * enum をセグメント、トークンを `▾` 付きの欄と描き分けているので枝を分ける。
 * 1 つに畳むと、パネル側が「選択肢がスキーマ由来かトークン由来か」を prop 名でしか
 * 判別できなくなる。
 *
 * 色のトークンだけ別の枝にするのは、`gap`（spacing）が色を持つ状態を型で作れなく
 * するため（`rules/coding.md`「正しい状態だけを列挙する」）。数値のトークンを
 * さらに分けるのも同じ理由で、`shadow` が解決値を持つ状態を作れなくする。
 */
export type PropControlInput =
  | Readonly<{ kind: "enum"; values: readonly string[] }>
  | Readonly<{ kind: "token"; names: readonly string[] }>
  | Readonly<{
      kind: "numericToken";
      names: readonly string[];
      resolvedValue: Option<number>;
    }>
  | Readonly<{
      kind: "colorToken";
      names: readonly string[];
      color: Option<ColorToken>;
    }>
  | Readonly<{ kind: "number" }>
  | Readonly<{ kind: "text" }>;

/**
 * 1 prop 分の編集欄。
 * `value`（明示的に設定されている値）と `defaultValue`（設定が無いときに効く値）を
 * 別々に持つのは、パネルが両者を区別して見せるため（docs/06-ui.md）。
 *
 * `enabledBy` は、その prop が編集できる条件を出している prop の名前
 * （スキーマの `enabledWhen.prop`）。真偽ではなく名前を持つのは、どの行にぶら下がる
 * 欄なのかがコントロールから読めるようにするため。
 */
export type PropControl = Readonly<{
  prop: string;
  input: PropControlInput;
  value: Option<PropValue>;
  defaultValue: Option<PropValue>;
  enabledBy: Option<string>;
}>;

/** 束ねた行の 1 辺。どの辺かはキーではなく値が持つ（並びのまま扱えるようにするため）。 */
export type PropSideControl = Readonly<{
  side: Side;
  control: PropControl;
}>;

/**
 * 4 辺を 1 行にまとめた編集欄（UI 案 docs/Design Composer.html の `padding` 行）。
 *
 * 辺で引ける対応として持つのは、4 辺が揃っていることを型で表すため
 * （`Record<Side, _>` は 4 キーすべてを要求する）。揃わない並びからは作れない
 * （`create` が `none`）ので、「3 辺しか無い束ね」が流通しない。
 */
export type PropShorthandControl = Readonly<{
  name: ShorthandName;
  bySide: Readonly<Record<Side, PropControl>>;
}>;

/**
 * 向かい合う 2 辺を畳んだ 1 欄（Figma と同じ垂直 / 水平）。
 *
 * 揃っているか不揃いかをフィールドで持たず `value` で導出するのは、
 * 「不揃いと書いてあるのに 2 辺の値が同じ」を作れなくするため。
 */
export type PropPairControl = Readonly<{
  pair: SidePair;
  sides: readonly [PropControl, PropControl];
}>;

/** 畳んだ欄が今出す値。2 辺が食い違っていれば値は決まらない。 */
export type PropPairValue =
  | Readonly<{ kind: "uniform"; value: Option<PropValue> }>
  | Readonly<{ kind: "mixed" }>;

/**
 * セクションに並ぶ 1 行。1 prop の行と、4 辺を束ねた行の 2 種。
 *
 * 直和にするのは、束ねた行が 1 prop 分の `PropControl` を持てないため
 * （持たせると「束ねているのに prop が 1 つ」が作れる）。
 */
export type PropControlRow =
  | Readonly<{ kind: "prop"; control: PropControl }>
  | Readonly<{ kind: "shorthand"; shorthand: PropShorthandControl }>;

/** `group` ごとのまとまり（docs/03「`group` プロパティパネルのセクション」）。 */
export type PropControlSection = Readonly<{
  group: string;
  rows: readonly PropControlRow[];
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
 * `isDetachable` を持つのは、参照先の部品が無い・循環している間は解除できず
 * （`DesignDocument.detach` が失敗する）、押しても何も起きないボタンになるため。
 * 不正なドキュメントも画面には残る（docs/03-schema.md「不正ファイル時の挙動」）ので、
 * この状態は実際に出る。凍結中（#155）をここで見ないのは、凍結中は解除のボタンごと
 * 出ないため（`PropertyPanel.Body`）。重ねると同じ判断が 2 層に散る。
 *
 * 複数選択（`multiple`）が件数だけを持つのは、編集欄を 1 つも出さず帯に件数を出す
 * ため（docs/06-ui.md「選択」）。件数をここに持たせるのは、帯と本文が同じ 1 つの値から
 * 出し分けるようにするため。別々に導くと「帯は `2 selected` なのに本文はインスタンスの
 * 編集欄」という食い違いが作れる。
 * `groups` の空セクションで表さず枝を分けるのは、「複数選んでいる」と
 * 「1 つ選んだが編集できる prop が無い」を混ぜないため。
 *
 * `sourceInstanceCount` を `instance` が持つのは、`Select all N instances` の N が
 * 「押したときに選ばれる件数」と同じ出どころで決まる必要があるため。
 */
export type SelectionControls =
  | Readonly<{ kind: "groups"; sections: readonly PropControlSection[] }>
  | Readonly<{
      kind: "instance";
      source: string;
      publicProps: readonly PropControl[];
      isDetachable: boolean;
      sourceInstanceCount: number;
    }>
  | Readonly<{ kind: "multiple"; count: number }>;

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
 * 今の値が選択肢に無ければ先頭へ足した並び。
 *
 * ファイル由来の不正な値（宣言に無い enum の値・存在しないトークン名）を落とすと
 * 未指定と見分けが付かず、検証エラーの原因が画面から消える（不正なドキュメントも
 * 描画は残る / docs/03-schema.md「不正ファイル時の挙動」）。
 *
 * @param options その prop が本来取れる値の並び
 * @param value 今その prop に設定されている値
 * @returns 今の値を含む選択肢の並び。設定が無い / 既に含まれるなら元のまま
 */
function withCurrentValue(
  options: readonly string[],
  value: Option<PropValue>,
): readonly string[] {
  return value.some
    ? ArrayEx.prependIfAbsent(options, String(value.value))
    : options;
}

/**
 * 効いているトークン名が指す色。
 *
 * @param effective 今その prop に効いているトークン名
 * @param tokens 色を引くトークン一式
 * @returns その名前の色。効いている名前が無いとき、および実在しない
 *   トークンを指しているときは `none`
 */
function colorOf(
  effective: Option<PropValue>,
  tokens: TokenSet,
): Option<ColorToken> {
  return Option.flatMap(effective, (name) =>
    TokenSet.findColor(tokens, String(name)),
  );
}

/**
 * 効いているトークン名が指す数値。
 *
 * @param effective 今その prop に効いているトークン名
 * @param tokens 数値を引くトークン一式
 * @param kind 引く種別
 * @returns そのトークンの数値。効いている名前が無いとき、および実在しない
 *   トークンを指しているときは `none`
 */
function numberOf(
  effective: Option<PropValue>,
  tokens: TokenSet,
  kind: NumericTokenKind,
): Option<number> {
  return Option.flatMap(effective, (name) =>
    TokenSet.findNumber(tokens, kind, String(name)),
  );
}

/**
 * 入力欄の形。値域（`domain`）と、今設定されている値から決まる。
 *
 * トークン参照を最後に置いて `switch` を関数の末尾にしているのは、種別を足して
 * `case` を足し忘れたときに「返さない経路がある」としてここがコンパイルエラーに
 * なるようにするため（`rules/coding.md`「列挙した状態の網羅を型で強制する」）。
 *
 * @param editable 入力の形を決める prop
 * @param value 今その prop に設定されている値
 * @param tokens トークン参照の選択肢と解決値の出どころ
 * @returns 値域に応じた入力欄の形。選択式には今の値も選択肢として含む
 */
function inputOf(
  editable: EditableProp,
  value: Option<PropValue>,
  tokens: TokenSet,
): PropControlInput {
  const definition = editable.definition;
  if (PropDefinition.isEnum(definition)) {
    return {
      kind: "enum",
      values: withCurrentValue(definition.values, value),
    };
  }
  if (PropDefinition.isLiteral(definition)) {
    return definition.literalType === "number"
      ? { kind: "number" }
      : { kind: "text" };
  }
  const names = withCurrentValue(
    TokenSet.names(tokens, definition.tokenKind),
    value,
  );
  /* 解決値も色も、明示値が無ければ既定値が効く（未設定でも既定の色は見える）。 */
  const effective = Option.or(value, editable.defaultValue);
  switch (definition.tokenKind) {
    case "colors":
      return { kind: "colorToken", names, color: colorOf(effective, tokens) };
    case "spacing":
    case "radius":
      return {
        kind: "numericToken",
        names,
        resolvedValue: numberOf(effective, tokens, definition.tokenKind),
      };
    case "shadows":
    case "typography":
      return { kind: "token", names };
  }
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
        defaultValue: Option.or(
          declared,
          Option.fromNullable(definition.default),
        ),
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
  const value = Option.fromNullable(props[editable.name]);
  return {
    prop: editable.name,
    input: inputOf(editable, value, tokens),
    value,
    defaultValue: editable.defaultValue,
    enabledBy: Option.fromNullable(editable.definition.enabledWhen?.prop),
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
 * 4 辺が揃っている shorthand の束ねた行。揃っていない shorthand は含まない。
 *
 * @param editables 束ねる候補になる、編集できる prop の並び
 * @param props 今の値の出どころ
 * @param tokens トークン参照の選択肢の出どころ
 * @returns 束ねられた行の並び。`enabledWhen` で辺が欠けた shorthand は入らない
 */
function shorthandControlsOf(
  editables: readonly EditableProp[],
  props: Props,
  tokens: TokenSet,
): readonly PropShorthandControl[] {
  const names = ArrayEx.distinct(
    editables.flatMap((editable) =>
      editable.definition.shorthand ? [editable.definition.shorthand.name] : [],
    ),
  );
  return names.flatMap((name) => {
    const sides = editables.flatMap((editable) => {
      const shorthand = editable.definition.shorthand;
      return shorthand?.name === name
        ? [
            {
              side: shorthand.side,
              control: controlOf(editable, props, tokens),
            },
          ]
        : [];
    });
    const control = PropShorthandControl.create(name, sides);
    return control.some ? [control.value] : [];
  });
}

/**
 * セクションに並ぶ行。束ねた行はその shorthand の最初の辺の位置に出る
 * （docs/03「パネルの表示順は定数の定義順」）。
 *
 * @param enabled 条件を満たす、編集できる prop の並び（`enabledWhen` の判定は済んでいる）
 * @param props 今の値の出どころ
 * @param tokens トークン参照の選択肢の出どころ
 * @returns 1 prop の行と束ねた行を宣言順に並べたもの
 */
function rowsOf(
  enabled: readonly EditableProp[],
  props: Props,
  tokens: TokenSet,
): readonly PropControlRow[] {
  const shorthands = shorthandControlsOf(enabled, props, tokens);
  return enabled.flatMap((editable, index): readonly PropControlRow[] => {
    const shorthand = editable.definition.shorthand;
    const clustered = shorthands.find(
      (candidate) => candidate.name === shorthand?.name,
    );
    if (shorthand === undefined || clustered === undefined) {
      return [{ kind: "prop", control: controlOf(editable, props, tokens) }];
    }
    /* 束ねた行は 1 度だけ出す。2 度目以降の辺は行を作らずに飛ばす。 */
    const isAlreadyPlaced = enabled
      .slice(0, index)
      .some(
        (candidate) => candidate.definition.shorthand?.name === shorthand.name,
      );
    return isAlreadyPlaced ? [] : [{ kind: "shorthand", shorthand: clustered }];
  });
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
    rows: rowsOf(
      enabled.filter((editable) => editable.definition.group === group),
      props,
      tokens,
    ),
  }));
}

/**
 * ノードが編集できる prop。参照ノードは公開 prop、プリミティブはスキーマから引く。
 *
 * @param document 公開 prop の引き先と、解除できるかの判定に使うドキュメント
 * @param node 編集欄を出したいノード
 * @returns 参照ノードなら出どころの部品つきの公開 prop、
 *   プリミティブなら `group` ごとにまとめた編集欄。
 *   スキーマの分からない `type` ではセクションが空になる
 */
function nodeControls(document: DesignDocument, node: Node): SelectionControls {
  if (Node.isRef(node)) {
    return {
      kind: "instance",
      source: node.ref,
      publicProps: controlsOf(
        publicEditableProps(document.components, node),
        node.overrides ?? {},
        document.tokens,
      ),
      isDetachable: DesignDocument.isDetachable(document, node.name),
      /*
       * `componentAssets` の使用数ではなく、まとめて選ぶときと同じ集め方で数える。
       * あちらは部品定義の中の参照も数えるので、押した結果選ばれる件数と食い違う。
       */
      sourceInstanceCount: DesignDocument.collectInstanceNames(
        document,
        node.ref,
      ).length,
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

/**
 * 入力欄に入った文字列から作る値。作り方は入力欄の種類だけで決まるので、
 * prop 名では分岐しない。
 *
 * @param input 値を受け取った入力欄の形
 * @param raw 入力欄が持っている生の文字列
 * @returns 数値を受ける欄なら数値、それ以外は文字列のまま
 */
function parseInputValue(input: PropControlInput, raw: string): PropValue {
  return input.kind === "number" ? Number(raw) : raw;
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
   * 入力された値を、その prop への編集にする。
   * 値の作り方は入力欄の種類だけで決まるので、prop 名では分岐しない。
   *
   * 受け取るのは**解釈済みの値**で、空欄を「値が無い」と読むのは
   * `<select>` / `<input>` の約束事なので呼び出し側が済ませておく
   * （文字列 prop にとって `""` はそれ自体が正当な値になりうるため、
   * ここで `""` を未設定と決めるとその値にとっての意味が固定される）。
   *
   * @param control 編集したい prop の編集欄
   * @param value 入力された値。入力欄が空なら `none`
   * @returns 値が無いなら未設定へ戻す編集、あれば設定する編集
   */
  editFrom(control: PropControl, value: Option<string>): PropEdit {
    return value.some
      ? PropEdit.set(
          [control.prop],
          parseInputValue(control.input, value.value),
        )
      : PropEdit.clear([control.prop]);
  },
} as const;

export const PropShorthandControl = {
  /**
   * 辺ごとの編集欄から束ねた行を作る。
   *
   * 4 辺が 1 つずつ揃っていなければ作らない。畳んだ欄は向かい合う 2 辺が
   * 揃って初めて決まるので、欠けた並びから作れてしまうと出し分けが破れる。
   *
   * @param name この行がまとめる shorthand の名前
   * @param sides 辺ごとの編集欄。順不同
   * @returns 4 辺が 1 つずつ揃っていれば束ねた行、欠け・重複があれば `none`
   */
  create(
    name: ShorthandName,
    sides: readonly PropSideControl[],
  ): Option<PropShorthandControl> {
    const controlOfSide = (side: Side) =>
      sides.find((candidate) => candidate.side === side)?.control;
    const top = controlOfSide(Sides.Top);
    const right = controlOfSide(Sides.Right);
    const bottom = controlOfSide(Sides.Bottom);
    const left = controlOfSide(Sides.Left);
    /* 同じ辺が 2 つ来ると `find` が後から来た側を捨てるので、件数でも見る。 */
    const isComplete =
      sides.length === Object.values(Sides).length &&
      top !== undefined &&
      right !== undefined &&
      bottom !== undefined &&
      left !== undefined;
    return isComplete
      ? Option.some({ name, bySide: { top, right, bottom, left } })
      : Option.none;
  },

  /**
   * 辺ごとの編集欄。並びは `Sides` の宣言順（上 右 下 左）で、
   * UI 案 docs/Design Composer.html の 4 セルの並びと同じ。
   *
   * @param shorthand 辺を取り出したい束ねた行
   * @returns 上 右 下 左の順に並べた辺ごとの編集欄
   */
  sides(shorthand: PropShorthandControl): readonly PropSideControl[] {
    return Object.values(Sides).map((side) => ({
      side,
      control: shorthand.bySide[side],
    }));
  },

  /**
   * 向かい合う 2 辺を畳んだ欄。並びは垂直・水平の順。
   *
   * フィールドではなくここで導くのは、4 辺と 2 欄の両方を持たせると
   * 片方だけ古い状態が作れるため。
   *
   * @param shorthand 畳みたい束ねた行
   * @returns 垂直・水平の順に並べた畳んだ欄
   */
  pairs(
    shorthand: PropShorthandControl,
  ): readonly [PropPairControl, PropPairControl] {
    const pairOf = (pair: SidePair): PropPairControl => {
      const [first, second] = SidePair.sides(pair);
      return {
        pair,
        sides: [shorthand.bySide[first], shorthand.bySide[second]],
      };
    };
    return [pairOf(SidePairs.Vertical), pairOf(SidePairs.Horizontal)];
  },
} as const;

export const PropPairControl = {
  /**
   * 畳んだ欄が今出す値。
   *
   * 2 辺とも未設定なら「不揃い」ではなく未設定（`uniform` の `none`）。
   * どちらも既定が効いている状態で、辺ごとに違う値が入っているわけではない。
   *
   * @param pair 値を知りたい畳んだ欄
   * @returns 2 辺が同じなら `uniform`、食い違っていれば `mixed`
   */
  value(pair: PropPairControl): PropPairValue {
    const [first, second] = pair.sides;
    const isBothSet = first.value.some && second.value.some;
    const isBothUnset = !first.value.some && !second.value.some;
    const isUniform =
      isBothUnset ||
      (isBothSet && String(first.value.value) === String(second.value.value));
    return isUniform
      ? { kind: "uniform", value: first.value }
      : { kind: "mixed" };
  },

  /**
   * 畳んだ欄の入力の形。2 辺が同じ形の定義を持つことを前提に、片方の形を使う
   * （`paddingTop` と `paddingBottom` は別々の定義だが、同じ `tokenKind` を宣言している）。
   *
   * 不揃いのときだけ解決値を落とすのは、欄が値を出していないのに
   * 片方の辺の数値だけが残ると、それがどちらの辺のものか読めないため。
   *
   * @param pair 入力の形を知りたい畳んだ欄
   * @returns 辺と同じ入力の形。不揃いなら解決値を持たない
   */
  input(pair: PropPairControl): PropControlInput {
    const [first] = pair.sides;
    const input = first.input;
    if (PropPairControl.value(pair).kind === "uniform") {
      return input;
    }
    return input.kind === "numericToken"
      ? { ...input, resolvedValue: Option.none }
      : input;
  },

  /**
   * 入力された値を、2 辺への 1 件の編集にする。
   *
   * 1 件にまとめるのは、辺ごとに分けて適用すると履歴も 2 段になり、
   * 1 回の undo で片側しか戻らないため。受け取るのが解釈済みの値なのは
   * `PropControl.editFrom` と同じ。
   *
   * @param pair 編集したい畳んだ欄
   * @param value 入力された値。入力欄が空なら `none`
   * @returns 値が無いなら 2 辺を未設定へ戻す編集、あれば 2 辺を同じ値にする編集
   */
  editFrom(pair: PropPairControl, value: Option<string>): PropEdit {
    const [first, second] = pair.sides;
    const names: readonly [string, ...string[]] = [first.prop, second.prop];
    return value.some
      ? PropEdit.set(names, parseInputValue(first.input, value.value))
      : PropEdit.clear(names);
  },
} as const;

export const SelectionControls = {
  /**
   * 選択中のものを編集する欄（docs/06-ui.md「画面構成」）。
   * 未選択を `none` で表すのは、同じ位置づけの `TokenControl.forSelection` に揃えるため。
   *
   * 解除できるかは `DesignDocument.isDetachable` に答えさせる。
   * Why not: 失敗の条件（参照先が無い・循環している）をここへ書き写す案は採らない。
   * 解除そのもの（`DesignDocument.detach`）と二重管理になり、片方だけ変わったときに
   * ボタンの出方と結果が食い違う。
   *
   * @param selection 選択とドキュメントの出どころ
   * @returns インスタンスを選んでいるなら出どころの部品つきの公開 prop、
   *   複数選んでいるなら編集欄を持たない `multiple`、
   *   それ以外は `group` ごとのセクション。何も選んでいないとき、および選んでいる
   *   名前がドキュメントに無いときは `none`。
   *   スキーマの分からない `type`・解決できない部品では、選択はあるので `some` だが
   *   セクションが空になる
   */
  forSelection(selection: DocumentSelection): Option<SelectionControls> {
    const count = DocumentSelection.count(selection);
    if (count > 1) {
      return Option.some({ kind: "multiple", count });
    }
    const selected = DocumentSelection.singleName(selection);
    if (!selected.some) {
      return Option.none;
    }
    const document = selection.document;
    const name = selected.value;
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
      nodeControls(document, node),
    );
  },
} as const;
