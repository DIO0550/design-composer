import type { ReactElement, ReactNode } from "react";
import { FocusOutlineClass } from "@/components/focus-outline";
import type { ValueOf } from "@/types/ValueOf";

/** ボタンの種類。配色と形が決まる。 */
export const ButtonKinds = {
  /** その場の主な操作（青の枠と文字）。 */
  Primary: "Primary",
  /** 主な操作の脇に置く、控えめな操作（灰の枠と黒の文字）。 */
  Secondary: "Secondary",
  /** 消す・壊す向きの操作（赤の枠と文字）。 */
  Danger: "Danger",
  /** 文の中に置く、枠を持たない操作（青の文字）。 */
  Text: "Text",
  /**
   * その画面を代表する操作（青の地と白の文字）。画面に 1 つだけ置く。
   *
   * 1 つだけを型で縛らない。1 画面は複数の feature が描いた部品の合成で、1 つだけは合成後の木の性質なので props の型では表せない。
   */
  Emphasis: "Emphasis",
  /** 記号や数値だけを中身に持つ操作。26px の正方形に収まり、枠を持たない（灰の字）。 */
  Icon: "Icon",
  /** 記号や数値だけを中身に持つ操作のうち、見出しや帯の行の中に置くもの。枠も高さも持たない（灰の字）。字の大きさは置いた行から継ぐ。 */
  InlineIcon: "InlineIcon",
} as const;

/** ボタンの種類。 */
export type ButtonKind = ValueOf<typeof ButtonKinds>;

/** 枠と高さを持つ箱型のボタンの大きさ。 */
export const ButtonSizes = {
  /** 高さ 28px。 */
  Small: "Small",
  /** 高さ 30px。 */
  Regular: "Regular",
  /** 高さ 36px。 */
  Large: "Large",
} as const;

/** 箱型のボタンの大きさ。 */
export type ButtonSize = ValueOf<typeof ButtonSizes>;

/** どの種類のボタンも受け取るもの。 */
type ButtonCommonProps = Readonly<{
  /** 押したときに始める手続き。 */
  onClick?: () => void;
  /** 押させたくないか。 */
  disabled?: boolean;
  /** ボタンに添える 1 行（押せない理由など）。 */
  title?: string;
  /** ボタンの中身。 */
  children: ReactNode;
}>;

/** 枠と高さを持つ箱型の種類。 */
export type ButtonFramedKind =
  | typeof ButtonKinds.Primary
  | typeof ButtonKinds.Secondary
  | typeof ButtonKinds.Danger
  | typeof ButtonKinds.Emphasis;

/** ボタンの props。種類ごとに大きさと名前の要否が違う。 */
export type ButtonProps = ButtonCommonProps &
  (
    | Readonly<{
        kind: ButtonFramedKind;
        size: ButtonSize;
        /** 中身の綴りの代わりに読ませる名前。 */
        "aria-label"?: string;
      }>
    | Readonly<{
        kind: typeof ButtonKinds.Text;
        size?: never;
        /** 中身の綴りの代わりに読ませる名前。 */
        "aria-label"?: string;
      }>
    | Readonly<{
        kind: typeof ButtonKinds.Icon | typeof ButtonKinds.InlineIcon;
        size?: never;
        /** 中身の記号・数値は操作を言い表さないので、読ませる名前を必ず与える。 */
        "aria-label": string;
      }>
  );

/** 箱型の 4 種に共通の、押せないときの枠と文字の色。 */
const FramedDisabledFace = "disabled:border-[#ebebeb] disabled:text-[#c4c4c4]";

/**
 * アイコン 2 種に共通の配色。
 *
 * hover は UI 案に無いので、同じ灰の字で描くタブバーの非選択タブの hover の値をその時点で借りた（参照ではつないでいない）。
 */
const IconFace =
  "text-[#767676] enabled:hover:bg-[#f0f0f0] disabled:text-[#c4c4c4]";

/**
 * 種類ごとの、平常・hover・押せないときの配色を指定する Tailwind のクラス。
 *
 * 配色は UI 案（docs/Design Composer.html のボタンは黒の塗りと白地に灰の枠）から意図して離れ、青の枠と白地を基調にしている（#1061 で決めた）。アイコン 2 種は枠の無い灰の字で、UI 案どおりなのは倍率の −/+ と見出しの +。
 * 倍率の 55% は UI 案の Default / Context menu では色の指定が無く地の #1e1e1e を継いでいるが、灰に揃えた（#1066）。
 *
 * happy-dom は Tailwind を解決しないので配色はテストでは守れない。視覚差分（components/Button）が拾うのは地の塗りのような面積の大きい変化だけで、枠色・押せないときの文字色はしきい値（`--max-diff-ratio 0.002`）未満で通り、hover は撮られないので、それらは Storybook を目視で確かめる。
 */
const ButtonKindFaces = {
  [ButtonKinds.Primary]: `border-[#0a74c9] bg-[#ffffff] text-[#0a74c9] enabled:hover:bg-[#e7f1fa] enabled:hover:text-[#0866b2] ${FramedDisabledFace}`,
  [ButtonKinds.Secondary]: `border-[#d4d4d4] bg-[#ffffff] text-[#1e1e1e] enabled:hover:bg-[#f5f5f5] ${FramedDisabledFace}`,
  [ButtonKinds.Danger]: `border-[#c4262b] bg-[#ffffff] text-[#c4262b] enabled:hover:bg-[#fdecec] enabled:hover:text-[#a81f24] ${FramedDisabledFace}`,
  [ButtonKinds.Text]:
    "text-[#0a74c9] enabled:hover:bg-[#e7f1fa] disabled:text-[#c4c4c4]",
  // 枠を地と同じ色にして持たせるのは、押せないときの枠（UI 案 docs/Design Composer.html の押せない
  // `Create component` が持つ 1px の枠）と幅を揃えるため。押せないときの配色もそのボタンの値。
  [ButtonKinds.Emphasis]: `border-[#0a74c9] bg-[#0a74c9] text-[#ffffff] enabled:hover:border-[#0866b2] enabled:hover:bg-[#0866b2] ${FramedDisabledFace} disabled:bg-[#fafafa]`,
  [ButtonKinds.Icon]: IconFace,
  [ButtonKinds.InlineIcon]: IconFace,
} as const satisfies Readonly<Record<ButtonKind, string>>;

/** どの種類にも付ける、字の太さ・カーソル・フォーカス枠。 */
const ButtonCommonClass = `font-normal enabled:cursor-pointer disabled:cursor-default ${FocusOutlineClass}`;

/** 箱型の、大きさに依らない形。 */
const ButtonFramedClass =
  "inline-flex items-center justify-center gap-[7px] border";

/** アイコンの形（26px の正方形）。 */
const ButtonIconClass =
  "inline-flex size-[26px] shrink-0 items-center justify-center rounded-[5px] text-[13px]";

/**
 * 行の中に置き、高さを持たない形。テキストと行内のアイコンが使う。
 *
 * 左右の余白と角丸は hover の地が字に接しないためのもの（角丸は UI 案のエラー文中のコード片の地 `border-radius:3px` に揃える）。
 * 余白は同じ幅の負の margin で打ち消し、平常時の字の位置は余白が無いときと変えない。
 */
const ButtonInlineClass = "-mx-[3px] inline rounded-[3px] px-[3px]";

/** テキストの形。 */
const ButtonTextClass = `${ButtonInlineClass} text-[11px]`;

/**
 * 箱型の大きさごとの高さ・余白・字の大きさ・角丸。
 *
 * @param size 箱型の大きさ
 * @returns その大きさの形を指定するクラス
 */
function framedSizeClass(size: ButtonSize): string {
  switch (size) {
    case ButtonSizes.Small:
      return "h-7 px-[10px] text-[11px] rounded-[5px]";
    case ButtonSizes.Regular:
      return "h-[30px] px-[10px] text-[11px] rounded-[5px]";
    case ButtonSizes.Large:
      return "h-9 px-3 text-[13px] rounded-[6px]";
  }
}

/**
 * 種類と大きさで決まる形。
 *
 * アイコンの 26px と、行内のアイコンが字の大きさを持たず行から継ぐことは、崩してもテストでは落ちない（happy-dom は Tailwind を解決しない）。
 * 気づく手段は Storybook（components/Button の「アイコン」「行内のアイコン」と、置いた各画面のストーリー）だけ。
 *
 * @param props ボタンの props
 * @returns 形を指定するクラス
 */
function shapeClass(props: ButtonProps): string {
  switch (props.kind) {
    case ButtonKinds.Text:
      return ButtonTextClass;
    case ButtonKinds.Icon:
      return ButtonIconClass;
    case ButtonKinds.InlineIcon:
      return ButtonInlineClass;
    case ButtonKinds.Primary:
    case ButtonKinds.Secondary:
    case ButtonKinds.Danger:
    case ButtonKinds.Emphasis:
      return `${ButtonFramedClass} ${framedSizeClass(props.size)}`;
  }
}

/**
 * アプリの基本のボタン。見た目は種類と大きさ（行内のアイコン（InlineIcon）では、置いた行の字の大きさ）だけで決まり、className は受け取らない。
 *
 * @param props 種類・大きさ・名前・押したときの手続き・押せるか・添える 1 行・中身
 * @returns 押してもフォームを送信しないボタン
 */
export function Button(props: ButtonProps): ReactElement {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title}
      aria-label={props["aria-label"]}
      className={`${ButtonCommonClass} ${shapeClass(props)} ${ButtonKindFaces[props.kind]}`}
    >
      {props.children}
    </button>
  );
}
