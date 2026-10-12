import { type ReactElement, useId } from "react";
import { FocusOutlineClass } from "@/components/focus-outline";
import type { ValueOf } from "@/types/ValueOf";

/** カードの配色の種類。 */
export const ActionCardTones = {
  /**
   * 並んだカードのうち、いちばん勧めたい操作の配色（青系）。
   *
   * UI 案のボタン（`<button>`）に青い塗りは無く、`#4db2ff` はリンクの hover の文字色（`a:hover`）にしか出てこない。
   * それを地に流用すると白文字で約 2.3:1 と 4.5:1 に届かないので、地は使わない。
   * この青は開始画面（#1062）で決め、#1061 で基本ボタン（`Button` のプライマリ）の配色にもなった。UI 案に裏付けは無い。
   * hover 中の `#0a74c9` on `#e7f1fa` も約 4.2:1 で届かないが、押す直前の一時的な状態として受け入れている。
   */
  Primary: "Primary",
  /** 勧め分けをしない操作の配色（灰系）。 */
  Normal: "Normal",
} as const;

/** カードの配色。 */
export type ActionCardTone = ValueOf<typeof ActionCardTones>;

/** カード 1 枚の中身。綴り・アイコン・配色の種類を持つ。 */
export type ActionCardContent = Readonly<{
  /** カードの名前になる見出し。 */
  title: string;
  /** 押すと何が起きるかの 1 行。 */
  description: string;
  /** 同じ操作を呼ぶキーボードの割り当ての表記。 */
  shortcut: string;
  /** アイコン（viewBox 0 0 24 24）を描く path の `d`。 */
  iconPaths: readonly string[];
  /** 配色の種類。 */
  tone: ActionCardTone;
}>;

/**
 * 配色の種類ごとの、部位ごとの配色を指定する Tailwind のクラス。
 *
 * happy-dom は Tailwind を解決せず描画もしないので、配色とアイコンの崩れはテストでは守れず、
 * 気づけるのは Storybook の視覚差分（components/ActionCard のプライマリ / ノーマル）だけ。
 *
 * カードの `card` 部位はボタンのプライマリ / セカンダリと同じ値だが（名前は同じでも、カードのプライマリは勧める度合いではボタンの強調にあたる）、プライマリのカードは hover で文字色を変えず、押せないときはカード全体を `opacity-50` で薄くする。カードをボタンへ追随させるかは決まっていないので表を分けている。
 */
const ActionCardToneFaces = {
  [ActionCardTones.Primary]: {
    card: "border-[#0a74c9] bg-[#ffffff] text-[#0a74c9] enabled:hover:bg-[#e7f1fa]",
    icon: "bg-[#e7f1fa]",
    description: "text-[#4a6a85]",
    shortcut: "border-[#b9d6ef] text-[#0a74c9]",
  },
  [ActionCardTones.Normal]: {
    card: "border-[#d4d4d4] bg-[#ffffff] text-[#1e1e1e] enabled:hover:bg-[#f5f5f5]",
    icon: "bg-[#f0f0f0]",
    description: "text-[#767676]",
    shortcut: "border-[#e6e6e6] text-[#767676]",
  },
} as const satisfies Readonly<
  Record<
    ActionCardTone,
    Readonly<{
      /** カードの枠・文字・地と、押せるときの hover の地。 */
      card: string;
      /** アイコンの地。 */
      icon: string;
      /** 説明の文字色。 */
      description: string;
      /** ショートカットの枠・文字の色。 */
      shortcut: string;
    }>
  >
>;

/**
 * アイコン・見出し・説明・ショートカットを載せた、押せるカード。
 *
 * フォーカス枠は `FocusOutlineClass` が持つ（UI 案から離れている理由もそちら）。
 *
 * @param content カードの綴り・アイコン・配色の種類
 * @param onClick 押したときに始める手続き
 * @param disabled 押させたくないか
 * @returns 見出しを名前に、説明とショートカットを説明に持つボタン
 */
export function ActionCard({
  content,
  onClick,
  disabled,
}: Readonly<{
  content: ActionCardContent;
  onClick: () => void;
  disabled: boolean;
}>): ReactElement {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const shortcutId = `${id}-shortcut`;
  const toneClasses = ActionCardToneFaces[content.tone];

  return (
    // 名前は見出しだけにする。中身から決めさせると見出し・説明・ショートカットを繋げた
    // 名前になり、見出しで引いている呼び出し側が見つけられなくなる。
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId} ${shortcutId}`}
      className={`flex flex-col items-start gap-[10px] rounded-[10px] border p-4 text-left ${FocusOutlineClass} disabled:cursor-default disabled:opacity-50 ${toneClasses.card}`}
    >
      <span
        className={`flex size-8 items-center justify-center rounded-[8px] ${toneClasses.icon}`}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-[18px]"
        >
          {content.iconPaths.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </span>
      <span className="flex flex-col gap-[2px]">
        <span id={titleId} className="font-medium text-[14px]">
          {content.title}
        </span>
        <span
          id={descriptionId}
          className={`text-[12px] ${toneClasses.description}`}
        >
          {content.description}
        </span>
      </span>
      <span
        id={shortcutId}
        className={`self-end rounded-[4px] border px-[6px] py-[1px] text-[11px] ${toneClasses.shortcut}`}
      >
        {content.shortcut}
      </span>
    </button>
  );
}
