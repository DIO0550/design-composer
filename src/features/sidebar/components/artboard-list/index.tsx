import { DropLine } from "@/components/drop-line";
import { TypeGlyph } from "@/components/type-glyph";
import type { Artboard } from "@/domains/dcmp/artboard";
import { DocumentSelection } from "@/domains/session/document-selection";
import type { LeftPaneArtboardActions } from "@/features/sidebar/types/LeftPaneArtboardActions";
import { type RowProps, useReorderDrag } from "@/hooks/use-reorder-drag";
import type { Option } from "@/utils/Option";
import { type DropSide, ReorderDrag } from "@/utils/ReorderDrag";

/** artboard が 1 枚も無いときの知らせ。 */
const NoArtboardMessage = "artboard がありません";

/** 追加のボタンの読み上げ名。UI 案の字面は `+` だけなので、名前は別に与える。 */
const AddArtboardLabel = "artboard を追加";

/**
 * artboard 1 枚の行（UI 案 docs/Design Composer.html の `# login 720×900`）。
 * 押すとその artboard が選択になり、ツリーもその中身に入れ替わる。
 * 掴んで別の行の上で離すと、その位置へ移る。
 *
 * `aria-current` が指すのは選択ではなく「今ツリーが映している 1 枚」。
 * 中のノードを選んでいる間も、それを載せている artboard がここでは current になる
 * （`aria-current` は「並びの中の今の項目」を表す属性なので、この意味で合っている）。
 *
 * 幅・高さを読み上げから外すのは、行が指すのが artboard の名前だからで、
 * こうしないと読み上げ名が「# login 720×900」のように大きさを含んだ文字列になる。
 */
function ArtboardRow({
  artboard,
  isCurrent,
  isHeld,
  dropSide,
  rowProps,
  onSelect,
}: Readonly<{
  artboard: Artboard;
  isCurrent: boolean;
  /** 今掴まれている行か。掴んでいる間は淡くする */
  isHeld: boolean;
  /** 落ちる先ならどちら側に線を引くか。落ちる先でなければ不在 */
  dropSide: Option<DropSide>;
  rowProps: RowProps;
  onSelect: (name: string) => void;
}>) {
  return (
    <li
      // 落ちる先の線を行の縁へ重ねるので、行を位置の基準にする
      className={`relative flex items-center ${isHeld ? "opacity-40" : ""}`}
      {...rowProps}
    >
      <button
        type="button"
        aria-label={artboard.name}
        aria-current={isCurrent}
        onClick={() => onSelect(artboard.name)}
        className={`flex min-w-0 flex-1 items-center gap-1.5 rounded px-2 py-1 text-left ${
          // 押せる範囲を示す hover と、今の 1 枚を示す色を重ねない
          isCurrent ? "bg-blue-100 text-blue-900" : "hover:bg-gray-100"
        }`}
      >
        <TypeGlyph kind="artboard" />
        {/* 名前が余りを占める。flex の子は既定で内容幅より縮まないため省略には min-w-0 が要る */}
        <span className="min-w-0 flex-1 truncate">{artboard.name}</span>
        <span aria-hidden="true" className="shrink-0 text-gray-400 text-xs">
          {artboard.width}×{artboard.height}
        </span>
      </button>
      {dropSide.some ? <DropLine side={dropSide.value} /> : null}
    </li>
  );
}

/**
 * ドキュメントが持つ artboard の一覧（UI 案 docs/Design Composer.html の
 * `Layers` パネル上段の `Artboards`）。ここで選んだ 1 枚の中身をツリーが映す。
 *
 * 見出しの右の `+` は UI 案そのもの（展開後 379〜382 行）。押すと末尾に 1 枚増え、
 * そのまま選択になる。
 *
 * 並べ替えは行を掴んで運ぶ。docs/06-ui.md「編集操作の一覧」がドラッグと定めているのは
 * **ノードの同一親内の並べ替え**で、artboard の入口は定めておらず UI 案も描いていない。
 * 新しい形を発明せず、同じ左ペインのツリー（`NestedRowList`）と同じ機構
 * （`useReorderDrag`）に載せて、パネルの中で操作の流儀が割れないようにしている。
 *
 * 並びが 1 つしか無いので、落ちる先が並びの外を指すことは構造上ありえない
 * （入った行の index しか落ちる先にならない）。ツリー側は親をまたげてしまうため、
 * 階層ごとに状態を分けることで同じ性質を作っている。
 *
 * artboard が 1 枚も無いことを伝えるのはここ。ツリー側は「今見ている 1 枚の中身」を
 * 映す場所で、1 枚も無いのは artboard の一覧の話なので、持ち主をこちらに置く。
 * そのときも `+` は残す。1 枚目を足す導線がここにしか無いため。
 */
export function ArtboardList({
  selection,
  onSelect,
  artboardActions,
}: Readonly<{
  selection: DocumentSelection;
  onSelect: (name: string) => void;
  artboardActions: LeftPaneArtboardActions;
}>) {
  const artboards = selection.document.artboards;
  const { drag, rowProps, groupProps } = useReorderDrag(
    artboardActions.reorder,
  );

  return (
    <section aria-label="artboard 一覧" className="text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-500 text-xs uppercase">
          Artboards
        </h3>
        <button
          type="button"
          aria-label={AddArtboardLabel}
          onClick={artboardActions.add}
          className="px-1 text-gray-500 text-sm hover:text-gray-900"
        >
          +
        </button>
      </div>
      {artboards.length === 0 ? (
        <p className="text-gray-500">{NoArtboardMessage}</p>
      ) : (
        <ul {...groupProps()}>
          {artboards.map((artboard, index) => (
            <ArtboardRow
              key={artboard.name}
              artboard={artboard}
              isCurrent={DocumentSelection.isCurrentArtboard(
                selection,
                artboard.name,
              )}
              isHeld={ReorderDrag.isHeld(drag, index)}
              dropSide={ReorderDrag.dropSideAt(drag, index)}
              rowProps={rowProps(index)}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
