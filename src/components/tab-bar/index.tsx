import {
  createContext,
  type ReactElement,
  type ReactNode,
  useContext,
} from "react";
import { DropLine, ListOrientations } from "@/components/drop-line";
import { type RowProps, useReorderDrag } from "@/hooks/use-reorder-drag";
import type { IndexMove } from "@/types/IndexMove";
import { Option } from "@/utils/Option";
import { ReorderDrag } from "@/utils/ReorderDrag";

/** 1 枚ぶんの見た目。見ているものだけ地を敷いて、下に続く中身とつながって見えるようにする。 */
const TabFace = {
  Current: "bg-[#f0f0f0] text-[#1e1e1e]",
  Other: "text-[#767676] hover:bg-[#f0f0f0]",
} as const;

/** 帯からタブへ配る、並べ替えの今の状態と掴む口。 */
type TabReorder = Readonly<{
  drag: ReorderDrag;
  rowProps: (index: number) => RowProps;
}>;

const TabReorderContext = createContext<Option<TabReorder>>(Option.none);

/**
 * 囲っている帯の並べ替え。
 *
 * @returns 囲っている `TabBar` が持つ並べ替えの状態と掴む口
 * @throws `TabBar` の外で呼ばれたとき（配置ミスなので隠さずに落とす）
 */
function useTabReorder(): TabReorder {
  const reorder = useContext(TabReorderContext);
  if (!Option.isSome(reorder)) {
    throw new Error("TabBar.Tab は TabBar の内側でのみ使える");
  }
  return reorder.value;
}

/**
 * 横に並べたタブのうち 1 枚。
 *
 * 出す字（`children`）と、そのタブが指すものの名前（`name`）を分けて受け取る。短く縮めた
 * 字を出しつつ、指しているものを `title` と閉じるボタンの読み上げ名で言えるようにするため
 * （同名のファイルが別のフォルダにある、など）。
 *
 * 1 枚まるごと（字も閉じるボタンも）が掴む口になる。掴んだタブの上で離せば移動は起きず、
 * 押した扱いだけが残る。
 *
 * @param name そのタブが指すもの。`title` と閉じるボタンの読み上げ名に使う
 * @param index 帯の中での位置。並べ替えの移動はこの位置で伝わる
 * @param isCurrent 今見ているタブか
 * @param onSelect 見る先をここへ移す手続き
 * @param onClose このタブを閉じる手続き
 * @returns 字の部分と閉じるボタンを並べた 1 枚
 */
function Tab({
  name,
  index,
  isCurrent,
  onSelect,
  onClose,
  children,
}: Readonly<{
  name: string;
  index: number;
  isCurrent: boolean;
  onSelect: () => void;
  onClose: () => void;
  children: ReactNode;
}>): ReactElement {
  const { drag, rowProps } = useTabReorder();
  const dropSide = ReorderDrag.dropSideAt(drag, index);

  return (
    <li
      // 落ちる先の線をタブの縁へ重ねるので、タブを位置の基準にする。`relative` と掴んだタブの
      // 淡さは消してもテストは落ちず、ストーリーも掴んでいない状態しか描かないので気づけない
      className={`relative flex items-center border-[#e6e6e6] border-r ${
        isCurrent ? TabFace.Current : TabFace.Other
      } ${ReorderDrag.isHeld(drag, index) ? "opacity-40" : ""}`}
      {...rowProps(index)}
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
      {Option.isSome(dropSide) ? (
        <DropLine
          side={dropSide.value}
          listOrientation={ListOrientations.Horizontal}
        />
      ) : null}
    </li>
  );
}

/**
 * 今どれを見ているかを選ばせる、横並びのタブの帯。
 *
 * `role="tablist"` にはしない。その role は矢印キーでの移動を約束するが、この帯はキーボード
 * の導線を持たない（読み上げにだけ「タブ」と名乗って動かないほうが混乱する）。
 *
 * タブを掴んで別のタブの上で離すと、その位置への移動を伝える。掴んでいる状態は帯が持ち、
 * タブへは context で配る（タブごとに渡させると、状態と位置の組を呼び出し側が毎回組む
 * ことになる）。ドラッグ中に帯の端で自動スクロールはせず、帯の外へ出ると取り消す。
 *
 * @param label この帯が何の並びかを読み上げる名前
 * @param onReorder タブを掴んで別のタブの上で離したときの移動を伝える先
 * @returns 1 枚ずつのタブを `children` の順に並べた帯
 */
function TabBarRoot({
  label,
  onReorder,
  children,
}: Readonly<{
  label: string;
  onReorder: (move: IndexMove) => void;
  children: ReactNode;
}>): ReactElement {
  const { drag, rowProps, groupProps } = useReorderDrag(onReorder);

  return (
    <nav
      aria-label={label}
      className="shrink-0 border-gray-300 border-b bg-white"
    >
      <ul className="flex h-8 items-stretch overflow-x-auto" {...groupProps()}>
        <TabReorderContext.Provider value={Option.some({ drag, rowProps })}>
          {children}
        </TabReorderContext.Provider>
      </ul>
    </nav>
  );
}

/** タブの帯。並べる中身は呼び出し側が `TabBar.Tab` で組む。 */
export const TabBar = Object.assign(TabBarRoot, { Tab });
