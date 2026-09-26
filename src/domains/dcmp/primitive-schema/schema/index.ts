import { Constraints } from "@/domains/dcmp/constraint";
import { Layout, Layouts } from "@/domains/dcmp/layout";
import { PaintTokenKinds } from "@/domains/dcmp/token";
import { Visibilities, Visibility } from "@/domains/dcmp/visibility";
import type { ValueOf } from "@/types/ValueOf";
import {
  type EnabledWhen,
  type PropDefinitionRecord,
  ShorthandNames,
} from "../prop-definition";

/**
 * 子を並べる Box でだけ効く、という条件（docs/03「Box」）。
 * `free` は子を並べないので、間隔・揃え・折り返しを指定しても意味を持たない。
 */
const FlexOnly = {
  kind: "notEquals",
  prop: "layout",
  notEquals: Layouts.Free,
} as const satisfies EnabledWhen;

/**
 * primitive の型を名前で指すための対応表。`PrimitiveType` はここから導出し、二重管理し
 * ない。
 *
 * 走査するときは `Object.values(PrimitiveTypes)` で並びにする（`token/` の 3 定数と違い、
 * 並びを返すコンパニオンの入口をここは持たないため）。
 */
export const PrimitiveTypes = {
  Box: "Box",
  Text: "Text",
} as const;

/** 組み込みで用意されているノードの型（docs/02「プリミティブ」）。 */
export type PrimitiveType = ValueOf<typeof PrimitiveTypes>;

/** 1つの primitive の仕様。子を持てるかと、受け付ける props を宣言する。 */
export type PrimitiveSchema = Readonly<{
  allowsChildren: boolean;
  props: PropDefinitionRecord;
}>;

/**
 * 親の中でのノードの置かれ方を決める props（docs/03「配置の指定」）。
 * Box と Text のどちらも親の中に置かれるので、同じ 5 prop を両方が持つ。
 *
 * 既定はファイルに書き出されない（docs/02「明示的に設定した props のみを保存する」）ので、
 * 書いていないノードの diff には現れない。
 *
 * 追従の既定を `min`（左上固定）にするのも同じで、書いていないノードは親をリサイズしても
 * 動かない。
 */
const PlacementProps = {
  placement: {
    domain: "enum",
    values: ["flow", "absolute"],
    default: "flow",
    group: "layout",
  },
  x: {
    domain: "literal",
    literalType: "number",
    default: 0,
    group: "layout",
    enabledWhen: { kind: "equals", prop: "placement", equals: "absolute" },
  },
  y: {
    domain: "literal",
    literalType: "number",
    default: 0,
    group: "layout",
    enabledWhen: { kind: "equals", prop: "placement", equals: "absolute" },
  },
  constraintX: {
    domain: "enum",
    values: Object.values(Constraints),
    default: Constraints.Min,
    group: "layout",
    enabledWhen: { kind: "equals", prop: "placement", equals: "absolute" },
  },
  constraintY: {
    domain: "enum",
    values: Object.values(Constraints),
    default: Constraints.Min,
    group: "layout",
    enabledWhen: { kind: "equals", prop: "placement", equals: "absolute" },
  },
} as const satisfies PropDefinitionRecord;

/**
 * ノード自身の回転の props（docs/03「回転」）。
 * Box と Text のどちらも回せるので、同じ 1 prop を両方が持つ。
 *
 * `enabledWhen` を付けないのは、回転が置かれ方に依らず効くため。フローの子に書いた座標は
 * 読み捨てられるが（docs/03「配置の指定」）、回転はフローの子でも効く。
 *
 * `range` を宣言しないのは、1 周を超える角度も「1 周と◯度」として意味が決まるため。
 *
 * `group` を `layout` にするのは、親の中での据わり方を集めた節がそこで、Text にも
 * `PlacementProps` で既にその節があるため。`appearance`（どう描かれるか）へ置くと
 * `opacity` と並んで見た目の値に見える。
 */
const RotationProps = {
  rotation: {
    domain: "literal",
    literalType: "number",
    default: 0,
    group: "layout",
  },
} as const satisfies PropDefinitionRecord;

/**
 * ノードを描くかどうかの props（docs/03「表示 / 非表示」）。
 * Box と Text のどちらも描かれる対象なので、同じ 1 prop を両方が持つ。
 *
 * `group` を `appearance` にするのは、この節が「どう描かれるか」を集めた場所で、0 にすると
 * 見えなくなる `opacity` も同じ節にあるため。節を 1 つ増やすと、UI 案
 * （docs/Design Composer.html）に無い見出しがパネルへ出る。
 *
 * spread する位置を各スキーマの末尾にするのは、パネルの節の並びが `group` の初出順で決まる
 * ため（先頭へ置くと Box / Text のどちらでも `appearance` が最初の節になる）。
 */
const VisibilityProps = {
  visibility: {
    domain: "enum",
    values: Object.values(Visibilities),
    default: Visibility.Default,
    group: "appearance",
  },
} as const satisfies PropDefinitionRecord;

/**
 * Box の仕様（docs/02「プリミティブ」の表）。
 */
export const BoxSchema = {
  allowsChildren: true,
  props: {
    ...PlacementProps,
    ...RotationProps,
    /*
     * `arrangement` などへ改名しない。この prop も `group: "layout"` に属し、パネルの節
     * 見出しは group の綴りから作られるので、見出しと行に同じ語が並ぶ（UI 案
     * docs/Design Composer.html はここを `direction` と描いている）。それでも prop 名を
     * docs/03 の綴りに揃えるのは、表示名を持たず prop 名の整形で出す決まりだから（docs/03
     * 「表示名フィールドは持たない」）。見出しの語を変えるなら group の綴りごと変える話
     * になり、この prop 単独の判断ではない。
     */
    layout: {
      domain: "enum",
      values: Object.values(Layouts),
      default: Layout.Default,
      group: "layout",
    },
    /*
     * 値は CSS の `flex-wrap` の綴りをそのまま採る。パネルは enum の値をそのままセグメント
     * へ出すので、別の語彙にすると CSS への対応表が要る。
     *
     * `layout` の直後へ置くのはパネルの行の並びが宣言順で決まるためで、UI 案
     * （docs/Design Composer.html）はこの行を描いていない。
     */
    wrap: {
      domain: "enum",
      values: ["nowrap", "wrap"],
      default: "nowrap",
      group: "layout",
      enabledWhen: FlexOnly,
    },
    gap: {
      domain: "token",
      tokenKind: ["spacing"],
      group: "layout",
      enabledWhen: FlexOnly,
    },
    paddingTop: {
      domain: "token",
      tokenKind: ["spacing"],
      group: "layout",
      shorthand: { name: ShorthandNames.Padding, side: "top" },
    },
    paddingRight: {
      domain: "token",
      tokenKind: ["spacing"],
      group: "layout",
      shorthand: { name: ShorthandNames.Padding, side: "right" },
    },
    paddingBottom: {
      domain: "token",
      tokenKind: ["spacing"],
      group: "layout",
      shorthand: { name: ShorthandNames.Padding, side: "bottom" },
    },
    paddingLeft: {
      domain: "token",
      tokenKind: ["spacing"],
      group: "layout",
      shorthand: { name: ShorthandNames.Padding, side: "left" },
    },
    align: {
      domain: "enum",
      values: ["start", "center", "end", "stretch"],
      default: "stretch",
      group: "layout",
      enabledWhen: FlexOnly,
    },
    justify: {
      domain: "enum",
      values: ["start", "center", "end", "space-between"],
      default: "start",
      group: "layout",
      enabledWhen: FlexOnly,
    },
    widthMode: {
      domain: "enum",
      values: ["hug", "fill", "fixed"],
      default: "hug",
      group: "size",
    },
    width: {
      domain: "literal",
      literalType: "number",
      group: "size",
      enabledWhen: { kind: "equals", prop: "widthMode", equals: "fixed" },
    },
    /*
     * 最小 / 最大が効くのは `fixed` 以外のモードのときなので、`width` の `enabledWhen` と
     * 向きが逆になる（docs/03「サイズ指定の原則」）。
     *
     * UI 案（docs/Design Composer.html）はこの 4 行を描いていない。パネルは UI 案の写し
     * ではなくスキーマ走査で組み立てる（docs/03）ので、Size 節は 4 行から 8 行になる。
     */
    minWidth: {
      domain: "literal",
      literalType: "number",
      group: "size",
      enabledWhen: {
        kind: "notEquals",
        prop: "widthMode",
        notEquals: "fixed",
      },
    },
    maxWidth: {
      domain: "literal",
      literalType: "number",
      group: "size",
      enabledWhen: {
        kind: "notEquals",
        prop: "widthMode",
        notEquals: "fixed",
      },
    },
    heightMode: {
      domain: "enum",
      values: ["hug", "fill", "fixed"],
      default: "hug",
      group: "size",
    },
    height: {
      domain: "literal",
      literalType: "number",
      group: "size",
      enabledWhen: { kind: "equals", prop: "heightMode", equals: "fixed" },
    },
    minHeight: {
      domain: "literal",
      literalType: "number",
      group: "size",
      enabledWhen: {
        kind: "notEquals",
        prop: "heightMode",
        notEquals: "fixed",
      },
    },
    maxHeight: {
      domain: "literal",
      literalType: "number",
      group: "size",
      enabledWhen: {
        kind: "notEquals",
        prop: "heightMode",
        notEquals: "fixed",
      },
    },
    background: {
      domain: "token",
      tokenKind: PaintTokenKinds,
      group: "appearance",
    },
    radiusTopLeft: {
      domain: "token",
      tokenKind: ["radius"],
      group: "appearance",
      shorthand: { name: ShorthandNames.Radius, corner: "topLeft" },
    },
    radiusTopRight: {
      domain: "token",
      tokenKind: ["radius"],
      group: "appearance",
      shorthand: { name: ShorthandNames.Radius, corner: "topRight" },
    },
    radiusBottomRight: {
      domain: "token",
      tokenKind: ["radius"],
      group: "appearance",
      shorthand: { name: ShorthandNames.Radius, corner: "bottomRight" },
    },
    radiusBottomLeft: {
      domain: "token",
      tokenKind: ["radius"],
      group: "appearance",
      shorthand: { name: ShorthandNames.Radius, corner: "bottomLeft" },
    },
    shadow: { domain: "token", tokenKind: ["shadows"], group: "appearance" },
    overflow: {
      domain: "enum",
      values: ["visible", "clip"],
      default: "visible",
      group: "appearance",
    },
    /*
     * 見た目の値だが対応するトークン種別が無いので生リテラルにする（docs/02「値のドメイン:
     * 3種類」/ docs/03「不透明度」）。トークンが持つ色の不透明度（0〜100 の %）とは別の値。
     */
    opacity: {
      domain: "literal",
      literalType: "number",
      range: { min: 0, max: 1 },
      default: 1,
      group: "appearance",
    },
    ...VisibilityProps,
  },
} as const satisfies PrimitiveSchema;

/** Text の仕様（docs/02 の表）。子は持たず、文言と見た目だけを持つ。 */
export const TextSchema = {
  allowsChildren: false,
  props: {
    ...PlacementProps,
    ...RotationProps,
    content: {
      domain: "literal",
      literalType: "string",
      default: "",
      group: "content",
    },
    typography: {
      domain: "token",
      tokenKind: ["typography"],
      default: "body",
      group: "appearance",
    },
    color: {
      domain: "token",
      tokenKind: ["colors"],
      default: "gray-900",
      group: "appearance",
    },
    align: {
      domain: "enum",
      values: ["left", "center", "right"],
      default: "left",
      group: "appearance",
    },
    ...VisibilityProps,
  },
} as const satisfies PrimitiveSchema;

/** primitive の型 → その仕様。型を取り違えた引き当てにならないよう対応で持つ。 */
export const PrimitiveSchemas = {
  Box: BoxSchema,
  Text: TextSchema,
} as const satisfies Readonly<Record<PrimitiveType, PrimitiveSchema>>;

export const PrimitiveSchema = {
  /**
   * その primitive のスキーマ。
   *
   * @param type スキーマを引く primitive の型
   * @returns その型のスキーマ。prop 名・`tokenKind` などの宣言がリテラル型のまま残る
   */
  forType<T extends PrimitiveType>(type: T): (typeof PrimitiveSchemas)[T] {
    return PrimitiveSchemas[type];
  },

  /**
   * その名前が primitive の型か（ファイル由来の未知の type を弾く境界）。
   *
   * @param type ノードの `type` に書かれている名前。ファイル由来の未知の名前でもよい
   * @returns `PrimitiveTypes` のどれかと綴りが完全に一致すれば `true`（大文字小文字も
   *   区別する）
   */
  isPrimitiveType(type: string): type is PrimitiveType {
    return (Object.values(PrimitiveTypes) as readonly string[]).includes(type);
  },

  /**
   * その type のノードが子を持てるか。
   * primitive でない type は子を持てない扱いにする（未知の type に子を挿せない）。
   *
   * @param type ノードの `type` に書かれている名前
   * @returns primitive で、そのスキーマが子を許していれば `true`
   */
  allowsChildren(type: string): boolean {
    return (
      PrimitiveSchema.isPrimitiveType(type) &&
      PrimitiveSchemas[type].allowsChildren
    );
  },
} as const;
