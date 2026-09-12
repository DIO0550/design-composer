import { DropLine } from "@/components/drop-line";
import { NoMatchMessage } from "@/components/search-field";
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
 * 一覧に出すもの。
 *
 * 絞った並びかどうかで、1 つも無いときの文言と掴めるかが一緒に決まる。直和にするのは、
 * **絞った並びなのに掴める**という食い違いを型で作れなくするため（絞った並びの index は
 * 元の並びを指さないので、掴めると別の artboard が動く）。
 */
export type ArtboardListing =
  | Readonly<{ kind: "full"; artboards: readonly Artboard[] }>
  | Readonly<{ kind: "filtered"; artboards: readonly Artboard[] }>;

/** artboard が 1 枚も無いときの知らせ。 */
const NoArtboardMessage = "artboard がありません";

/** 一覧に出すものの組み立て。 */
export const ArtboardListing = {
  /**
   * 絞っていないときの内容。
   *
   * @param artboards ドキュメントが持つ並び
   * @returns 全部を出し、掴んで並べ替えられる内容
   */
  full(artboards: readonly Artboard[]): ArtboardListing {
    return { kind: "full", artboards };
  },

  /**
   * 絞り込んだあとの内容。
   *
   * @param artboards 絞り込みに残った並び
   * @returns 残ったものだけを出し、掴めない内容
   */
  filtered(artboards: readonly Artboard[]): ArtboardListing {
    return { kind: "filtered", artboards };
  },
} as const;

/**
 * 1 つも出すものが無いときの知らせ。
 *
 * @param listing 一覧に出すもの
 * @returns 絞った結果が空なら一致が無い旨、そうでなければ artboard が無い旨
 */
function emptyNoticeOf(listing: ArtboardListing): string {
  switch (listing.kind) {
    case "full":
      return NoArtboardMessage;
    case "filtered":
      return NoMatchMessage;
  }
}

/**
 * artboard 1 枚の行（UI 案 docs/Design Composer.html の `# login 720×900`）。押すとその
 * artboard が選択になりツリーも中身に入れ替わる。掴む口が配られていれば、掴んで別の行の
 * 上で離すとその位置へ移る。
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
  /** 掴む口と、ポインタが入ったことを伝える口。絞った並びでは配られないので不在 */
  rowProps: Option<RowProps>;
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
      {...(rowProps.some ? rowProps.value : {})}
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
 * 並べ替えは行を掴んで運ぶ。UI 案は artboard の並べ替えを描いていないので、新しい形を
 * 発明せず同じ左ペインのツリーと同じ機構（`useReorderDrag`）に載せている。並びが 1 つしか
 * 無いので、落ちる先が並びの外を指すことは構造上ありえない。
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
  const { artboards } = listing;
  const isReorderable = listing.kind === "full";
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
        <p className="text-gray-500">{emptyNoticeOf(listing)}</p>
      ) : (
        // 掴む口を配らなければ離しも移動を起こさないので、器の側では止めない
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
              isRenaming={Option.contains(renaming, artboard.name)}
              dropSide={ReorderDrag.dropSideAt(drag, index)}
              rowProps={
                isReorderable ? Option.some(rowProps(index)) : Option.none
              }
              onSelect={onSelect}
              renameActions={renameActions}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
