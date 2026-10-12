import type { ReactElement, ReactNode } from "react";
import type { ValueOf } from "@/types/ValueOf";

/** ボタンの種類。配色と形が決まる。 */
export const ButtonKinds = {
  /** 押す先を示す既定の操作（青の枠と文字）。 */
  Primary: "Primary",
  /** 勧め分けをしない操作（灰の枠と黒の文字）。 */
  Secondary: "Secondary",
  /** 取り消せない削除などの操作（赤の枠と文字）。 */
  Danger: "Danger",
  /** 文の中に置く、枠を持たない操作（青の文字）。 */
  Text: "Text",
  /**
   * その画面でいちばん勧めたい操作（青の地と白の文字）。画面に 1 つだけ置く。
   *
   * 1 つだけを型で縛らない。1 画面は複数の feature が描いた部品の合成で、1 つだけは合成後の木の性質なので props の型では表せない。
   */
  Emphasis: "Emphasis",
  /** 綴りを持たないアイコンだけの操作（プライマリと同じ配色の正方形）。 */
  Icon: "Icon",
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
type ButtonBoxKind =
  | typeof ButtonKinds.Primary
  | typeof ButtonKinds.Secondary
  | typeof ButtonKinds.Danger
  | typeof ButtonKinds.Emphasis;

/** ボタンの props。種類ごとに大きさと名前の要否が違う。 */
export type ButtonProps = ButtonCommonProps &
  (
    | Readonly<{
        kind: ButtonBoxKind;
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
        kind: typeof ButtonKinds.Icon;
        size?: never;
        /** アイコンには綴りが無いので、読ませる名前を必ず与える。 */
        "aria-label": string;
      }>
  );

/** プライマリの配色。アイコンも同じ値を使う。 */
const PrimaryFace =
  "border-[#0a74c9] bg-[#ffffff] text-[#0a74c9] enabled:hover:bg-[#e7f1fa] enabled:hover:text-[#0866b2] disabled:border-[#ebebeb] disabled:text-[#c4c4c4]";

/**
 * 種類ごとの、平常・hover・押せないときの配色を指定する Tailwind のクラス。
 *
 * happy-dom は Tailwind を解決せず描画もしないので、配色はテストでは守れず、気づけるのは Storybook の視覚差分（components/Button）だけ。
 */
const ButtonKindFaces = {
  [ButtonKinds.Primary]: PrimaryFace,
  [ButtonKinds.Secondary]:
    "border-[#d4d4d4] bg-[#ffffff] text-[#1e1e1e] enabled:hover:bg-[#f5f5f5] disabled:border-[#ebebeb] disabled:text-[#c4c4c4]",
  [ButtonKinds.Danger]:
    "border-[#c4262b] bg-[#ffffff] text-[#c4262b] enabled:hover:bg-[#fdecec] enabled:hover:text-[#a81f24] disabled:border-[#ebebeb] disabled:text-[#c4c4c4]",
  [ButtonKinds.Text]:
    "text-[#0a74c9] enabled:hover:bg-[#e7f1fa] disabled:text-[#c4c4c4]",
  // 枠を地と同じ色にして持たせるのは、枠のある他の箱型と高さを揃えるため。
  // 押せないときの配色は UI 案（docs/Design Composer.html）の部品化のボタンの値。
  [ButtonKinds.Emphasis]:
    "border-[#0a74c9] bg-[#0a74c9] text-[#ffffff] enabled:hover:border-[#0866b2] enabled:hover:bg-[#0866b2] disabled:border-[#ebebeb] disabled:bg-[#fafafa] disabled:text-[#c4c4c4]",
  [ButtonKinds.Icon]: PrimaryFace,
} as const satisfies Readonly<Record<ButtonKind, string>>;

/** どの種類にも付ける、字の太さ・カーソル・フォーカス枠（ActionCard と同じ青）。 */
const ButtonCommonClass =
  "font-normal enabled:cursor-pointer disabled:cursor-default focus-visible:outline-2 focus-visible:outline-[#0a74c9] focus-visible:outline-offset-2";

/** 箱型の、大きさに依らない形。 */
const ButtonBoxClass =
  "inline-flex items-center justify-center gap-[7px] border";

/** アイコンの形（30px の正方形）。 */
const ButtonIconClass =
  "inline-flex size-[30px] items-center justify-center gap-[7px] rounded-[5px] border text-[13px]";

/**
 * テキストの形。文の中に置き、高さを持たない。
 *
 * 左右の余白と角丸は hover の地が字に接しないためのもの（UI 案の行内の地の角丸 3px に揃える）。
 */
const ButtonTextClass = "inline rounded-[3px] px-[3px] text-[11px]";

/**
 * 箱型の大きさごとの高さ・余白・字の大きさ・角丸。
 *
 * @param size 箱型の大きさ
 * @returns その大きさの形を指定するクラス
 */
function boxSizeClass(size: ButtonSize): string {
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
 * @param props ボタンの props
 * @returns 形を指定するクラス
 */
function shapeClass(props: ButtonProps): string {
  switch (props.kind) {
    case ButtonKinds.Text:
      return ButtonTextClass;
    case ButtonKinds.Icon:
      return ButtonIconClass;
    case ButtonKinds.Primary:
    case ButtonKinds.Secondary:
    case ButtonKinds.Danger:
    case ButtonKinds.Emphasis:
      return `${ButtonBoxClass} ${boxSizeClass(props.size)}`;
  }
}

/**
 * アプリの基本のボタン。見た目は種類と大きさだけで決まり、className は受け取らない。
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
