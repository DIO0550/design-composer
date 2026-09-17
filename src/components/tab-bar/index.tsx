import type { ReactElement, ReactNode } from "react";

/** 1 枚ぶんの見た目。見ているものだけ地を敷いて、下に続く中身とつながって見えるようにする。 */
const TabFace = {
  Current: "bg-[#f0f0f0] text-[#1e1e1e]",
  Other: "text-[#767676] hover:bg-[#f0f0f0]",
} as const;

/**
 * 横に並べたタブのうち 1 枚。
 *
 * 出す字（`children`）と、そのタブが指すものの名前（`name`）を分けて受け取る。短く縮めた
 * 字を出しつつ、指しているものを `title` と閉じるボタンの読み上げ名で言えるようにするため
 * （同名のファイルが別のフォルダにある、など）。
 *
 * @param name そのタブが指すもの。`title` と閉じるボタンの読み上げ名に使う
 * @param isCurrent 今見ているタブか
 * @param onSelect 見る先をここへ移す手続き
 * @param onClose このタブを閉じる手続き
 * @returns 字の部分と閉じるボタンを並べた 1 枚
 */
function Tab({
  name,
  isCurrent,
  onSelect,
  onClose,
  children,
}: Readonly<{
  name: string;
  isCurrent: boolean;
  onSelect: () => void;
  onClose: () => void;
  children: ReactNode;
}>): ReactElement {
  return (
    <li
      className={`flex items-center border-[#e6e6e6] border-r ${
        isCurrent ? TabFace.Current : TabFace.Other
      }`}
    >
      <button
        type="button"
        title={name}
        aria-current={isCurrent}
        onClick={onSelect}
        className="max-w-40 truncate py-1 pr-1 pl-[10px] text-[11px]"
      >
        {children}
      </button>
      <button
        type="button"
        aria-label={`${name} を閉じる`}
        onClick={onClose}
        className="px-[6px] py-1 text-[11px] hover:text-[#1e1e1e]"
      >
        ×
      </button>
    </li>
  );
}

/**
 * 今どれを見ているかを選ばせる、横並びのタブの帯。
 *
 * `role="tablist"` にはしない。その role は矢印キーでの移動を約束するが、この帯はキーボード
 * の導線を持たない（読み上げにだけ「タブ」と名乗って動かないほうが混乱する）。
 *
 * @param label この帯が何の並びかを読み上げる名前
 * @returns 1 枚ずつのタブを開いた順に並べた帯
 */
function TabBarRoot({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>): ReactElement {
  return (
    <nav
      aria-label={label}
      className="shrink-0 border-gray-300 border-b bg-white"
    >
      <ul className="flex h-8 items-stretch overflow-x-auto">{children}</ul>
    </nav>
  );
}

/** タブの帯。並べる中身は呼び出し側が `TabBar.Tab` で組む。 */
export const TabBar = Object.assign(TabBarRoot, { Tab });
