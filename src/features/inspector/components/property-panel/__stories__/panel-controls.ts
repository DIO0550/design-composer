import { ShorthandNames } from "@/domains/primitive-schema";
import type {
  PropControl,
  PropControlSection,
  PropShorthandControl,
  SelectionControls,
} from "@/domains/prop-control";
import type { Side } from "@/domains/side";
import { Option } from "@/utils/Option";

/*
 * 部品ごとのストーリーが使う編集欄の素材。
 *
 * ドキュメント（`DesignDocument`）から `SelectionControls.forSelection` で導かず、
 * 公開型の値として直に組むのは、欲しい 1 行を並びから取り出すのに不在の分岐が要り、
 * そのストーリーが何の状態を見せたいのかが読めなくなるため。パネル全体を通した絵は
 * `property-panel/index.stories.tsx` がドキュメントから作っている。
 */

/** 未指定の enum。セグメントと「未指定（既定: …）」の注記が出る。 */
export const DirectionControl: PropControl = {
  prop: "direction",
  input: { kind: "enum", values: ["row", "column"] },
  value: Option.none,
  defaultValue: Option.some("column"),
  enabledBy: Option.none,
};

/** 値の入った enum。注記は出ない。 */
export const WidthModeControl: PropControl = {
  prop: "widthMode",
  input: { kind: "enum", values: ["hug", "fill", "fixed"] },
  value: Option.some("fixed"),
  defaultValue: Option.some("hug"),
  enabledBy: Option.none,
};

/** 数値のトークンを選ぶ欄。解決後の値が添う。 */
export const GapControl: PropControl = {
  prop: "gap",
  input: {
    kind: "numericToken",
    names: ["sm", "md", "lg"],
    resolvedValue: Option.some(16),
  },
  value: Option.some("md"),
  defaultValue: Option.none,
  enabledBy: Option.none,
};

/** ファイル由来の不正な参照を指している欄。解決値が無いので値が添わない。 */
export const DanglingGapControl: PropControl = {
  prop: "gap",
  input: {
    kind: "numericToken",
    names: ["missing", "sm", "md", "lg"],
    resolvedValue: Option.none,
  },
  value: Option.some("missing"),
  defaultValue: Option.none,
  enabledBy: Option.none,
};

/** トークン名から選ぶ欄（数値にも色にもならない種別）。 */
export const TypographyControl: PropControl = {
  prop: "typography",
  input: { kind: "token", names: ["body", "heading"] },
  value: Option.some("heading"),
  defaultValue: Option.none,
  enabledBy: Option.none,
};

/** 色のトークンを選ぶ欄。見本が左に付く。 */
export const BackgroundControl: PropControl = {
  prop: "background",
  input: {
    kind: "colorToken",
    names: ["white", "primary"],
    color: Option.some("#7a34d6"),
  },
  value: Option.some("primary"),
  defaultValue: Option.none,
  enabledBy: Option.none,
};

/** 実在しない色のトークンを指している欄。見本が出ない。 */
export const MissingBackgroundControl: PropControl = {
  prop: "background",
  input: {
    kind: "colorToken",
    names: ["missing", "white"],
    color: Option.none,
  },
  value: Option.some("missing"),
  defaultValue: Option.none,
  enabledBy: Option.none,
};

/** 条件付きの欄（`widthMode` が `fixed` のときだけ出る）。ラベルを出さず字下げする。 */
export const WidthControl: PropControl = {
  prop: "width",
  input: { kind: "number" },
  value: Option.some(480),
  defaultValue: Option.none,
  enabledBy: Option.some("widthMode"),
};

/** 文字を打ち込む欄。インスタンスの公開 prop として既定値を持つ。 */
export const LabelControl: PropControl = {
  prop: "label",
  input: { kind: "text" },
  value: Option.some("ログイン"),
  defaultValue: Option.some("Button"),
  enabledBy: Option.none,
};

/** 既定を持たない公開 prop。上書きしていないので注記が出ない。 */
export const VariantControl: PropControl = {
  prop: "variant",
  input: { kind: "enum", values: ["primary", "ghost"] },
  value: Option.none,
  defaultValue: Option.none,
  enabledBy: Option.none,
};

/**
 * 1 辺分の padding の欄。
 *
 * @param side どの辺か
 * @param token その辺に設定されているトークン名。未設定なら `none`
 * @returns その辺の編集欄
 */
function paddingSide(side: Side, token: Option<string>): PropControl {
  return {
    prop: `padding${side.charAt(0).toUpperCase()}${side.slice(1)}`,
    input: {
      kind: "numericToken",
      names: ["sm", "md", "lg"],
      resolvedValue: Option.none,
    },
    value: token,
    defaultValue: Option.none,
    enabledBy: Option.none,
  };
}

/** 4 辺が揃っている padding。畳んだ 2 欄に同じ値が出る。 */
export const UniformPadding: PropShorthandControl = {
  name: ShorthandNames.Padding,
  bySide: {
    top: paddingSide("top", Option.some("md")),
    right: paddingSide("right", Option.some("md")),
    bottom: paddingSide("bottom", Option.some("md")),
    left: paddingSide("left", Option.some("md")),
  },
};

/** 4 辺が揃っていない padding。畳んだ欄は `不揃い` になる。 */
export const MixedPadding: PropShorthandControl = {
  name: ShorthandNames.Padding,
  bySide: {
    top: paddingSide("top", Option.some("sm")),
    right: paddingSide("right", Option.some("lg")),
    bottom: paddingSide("bottom", Option.some("md")),
    left: paddingSide("left", Option.some("lg")),
  },
};

/** Box を選んだときの並び。1 prop の行・束ねた行・条件付きの行が 1 つずつ入る。 */
export const BoxSections: readonly PropControlSection[] = [
  {
    group: "layout",
    rows: [
      { kind: "prop", control: DirectionControl },
      { kind: "prop", control: GapControl },
      { kind: "shorthand", shorthand: MixedPadding },
    ],
  },
  {
    group: "size",
    rows: [
      { kind: "prop", control: WidthModeControl },
      { kind: "prop", control: WidthControl },
    ],
  },
  {
    group: "appearance",
    rows: [{ kind: "prop", control: BackgroundControl }],
  },
];

/** インスタンスを選んだときの編集欄。解除でき、同じ部品のインスタンスが他にもある。 */
export const InstanceControls: Extract<
  SelectionControls,
  { kind: "instance" }
> = {
  kind: "instance",
  source: "primary-button",
  publicProps: [LabelControl, VariantControl],
  isDetachable: true,
  sourceInstanceCount: 3,
};
