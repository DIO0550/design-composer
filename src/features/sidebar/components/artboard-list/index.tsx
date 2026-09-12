import { DropLine } from "@/components/drop-line";
import { TypeGlyph } from "@/components/type-glyph";
import type { Artboard } from "@/domains/dcmp/artboard";
import { DocumentSelection } from "@/domains/session/document-selection";
import { RowNameField } from "@/features/sidebar/components/row-name-field";
import type { LeftPaneArtboardActions } from "@/features/sidebar/types/LeftPaneArtboardActions";
import type { LeftPaneRenameActions } from "@/features/sidebar/types/LeftPaneRenameActions";
import { type RowProps, useReorderDrag } from "@/hooks/use-reorder-drag";
import { Option } from "@/utils/Option";
import { type DropSide, ReorderDrag } from "@/utils/ReorderDrag";

/** 追加のボタンの読み上げ名。UI 案の字面は `+` だけなので、名前は別に与える。 */
const AddArtboardLabel = "artboard を追加";

/**
 * 一覧に出す内容一式。
 *
 * 何を出すか・1 つも無いときに何と言うか・掴んで並べ替えられるかは**絞り込みで一緒に
 * 決まる**ので対で渡す（片方だけ差し替えると、絞った並びを掴めるといった食い違いが作れる）。
 */
export type ArtboardListing = Readonly<{
  artboards: readonly Artboard[];
  /** 1 つも無いときに出す知らせ。artboard が無いのか一致が無いのかで文言が変わる */
  emptyNotice: string;
  /** 掴んで並べ替えられるか。絞った並びの index は元の並びを指さないので絞り込み中は止める */
  isReorderable: boolean;
}>;

/** artboard が 1 枚も無いときの知らせ。 */
export const NoArtboardMessage = "artboard がありません";

/** 一覧に出す内容の組み立て。 */
export const ArtboardListing = {
  /**
   * 絞っていないときの内容。
   *
   * @param artboards ドキュメントが持つ並び
   * @returns 全部を出し、掴んで並べ替えられる内容
   */
  full(artboards: readonly Artboard[]): ArtboardListing {
    return {
      artboards,
      emptyNotice: NoArtboardMessage,
      isReorderable: true,
    };
  },
} as const;

/**
 * artboard 1 枚の行（UI 案 docs/Design Composer.html の `# login 720×900`）。押すとその
 * artboard が選択になりツリーも中身に入れ替わり、掴んで別の行の上で離すとその位置へ移る。
 *
 * `aria-current` が指すのは選択ではなく「今ツリーが映している 1 枚」。中のノードを選ん
 * でいる間も、それを載せている artboard がここでは current になる。
 *
 * 幅・高さを読み上げから外すのは、行が指すのが artboard の名前だからで、こうしないと読
 * み上げ名が大きさを含んだ文字列になる。
 */
function ArtboardRow({
  artboard,
  isCurrent,
  isHeld,
  isRenaming,
  dropSide,
  rowProps,
  onSelect,
  renameActions,
}: Readonly<{
  artboard: Artboard;
  isCurrent: boolean;
  /** 今掴まれている行か。掴んでいる間は淡くする */
  isHeld: boolean;
  /** この行が名前を編集中か */
  isRenaming: boolean;
  /** 落ちる先ならどちら側に線を引くか。落ちる先でなければ不在 */
  dropSide: Option<DropSide>;
  rowProps: Partial<RowProps>;
  onSelect: (name: string) => void;
  renameActions: LeftPaneRenameActions;
}>) {
  if (isRenaming) {
    return (
      // 余白は行のボタンと揃える。変えると編集に入った瞬間に行の高さと名前の左端が動く
      <li className="relative flex items-center px-2 py-1">
        <RowNameField
          name={artboard.name}
          glyph="artboard"
          onCommit={renameActions.commit}
          onFinish={renameActions.finish}
          onCancel={renameActions.cancel}
        />
      </li>
    );
  }

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
        onDoubleClick={() => renameActions.startAt(artboard.name)}
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
 * ドキュメントが持つ artboard の一覧（UI 案 docs/Design Composer.html の `Layers` パネ
 * ル上段の `Artboards`）。ここで選んだ 1 枚の中身をツリーが映し、見出しの右の `+` は UI
 * 案そのもの（押すと末尾に 1 枚増えてそのまま選択になる）。
 *
 * **何を出すかは決めない**（`listing` を受け取るだけ）。絞り込みを持つのはパネル側で、
 * `Artboards` の一覧とツリーを同じ条件で絞るため。
 *
 * 並べ替えは行を掴んで運ぶ。docs/06-ui.md がドラッグと定めているのは**ノードの同一親内
 * の並べ替え**で artboard の入口は定めておらず UI 案も描いていないので、新しい形を発明
 * せず同じ左ペインのツリーと同じ機構（`useReorderDrag`）に載せている。並びが 1 つしか無
 * いので、落ちる先が並びの外を指すことは構造上ありえない。
 *
 * 出すものが 1 つも無いことを伝えるのはここ（ツリー側は「今見ている 1 枚の中身」を映す
 * 場所だから）。そのときも `+` は残す — `+` は絞り込みの対象ではないので、語の有無で
 * 出たり消えたりしない。
 */
export function ArtboardList({
  listing,
  selection,
  renaming,
  onSelect,
  artboardActions,
  renameActions,
}: Readonly<{
  listing: ArtboardListing;
  selection: DocumentSelection;
  /** 今その名前を編集しているもの。編集していなければ不在 */
  renaming: Option<string>;
  onSelect: (name: string) => void;
  artboardActions: LeftPaneArtboardActions;
  renameActions: LeftPaneRenameActions;
}>) {
  const { artboards, emptyNotice, isReorderable } = listing;
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
        <p className="text-gray-500">{emptyNotice}</p>
      ) : (
        <ul {...(isReorderable ? groupProps() : {})}>
          {artboards.map((artboard, index) => (
            <ArtboardRow
              key={artboard.name}
              artboard={artboard}
              isCurrent={DocumentSelection.isCurrentArtboard(
                selection,
                artboard.name,
              )}
              isHeld={ReorderDrag.isHeld(drag, index)}
              isRenaming={Option.contains(renaming, artboard.name)}
              dropSide={ReorderDrag.dropSideAt(drag, index)}
              rowProps={isReorderable ? rowProps(index) : {}}
              onSelect={onSelect}
              renameActions={renameActions}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
