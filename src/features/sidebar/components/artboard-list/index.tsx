import { ReorderButtons } from "@/components/reorder-buttons";
import { TypeGlyph } from "@/components/type-glyph";
import type { Artboard } from "@/domains/artboard";
import { DocumentSelection } from "@/domains/document-selection";
import type { LeftPaneArtboardActions } from "@/features/sidebar/types/LeftPaneArtboardActions";

/** artboard が 1 枚も無いときの知らせ。 */
const NoArtboardMessage = "artboard がありません";

/** 追加のボタンの読み上げ名。UI 案の字面は `+` だけなので、名前は別に与える。 */
const AddArtboardLabel = "artboard を追加";

/**
 * artboard 1 枚の行（UI 案 docs/Design Composer.html の `# login 720×900`）。
 * 押すとその artboard が選択になり、ツリーもその中身に入れ替わる。
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
  placement,
  isCurrent,
  onSelect,
  onReorder,
}: Readonly<{
  artboard: Artboard;
  placement: Readonly<{ index: number; count: number }>;
  isCurrent: boolean;
  onSelect: (name: string) => void;
  onReorder: (move: Readonly<{ fromIndex: number; toIndex: number }>) => void;
}>) {
  return (
    <li className="flex items-center gap-1 pr-1">
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
      <ReorderButtons
        name={artboard.name}
        placement={placement}
        onMove={(toIndex) => onReorder({ fromIndex: placement.index, toIndex })}
      />
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
 * 行ごとの `↑` / `↓` は UI 案が描いていない。UI 案は並べ替えの入口を描かないまま
 * `Artboards` の一覧を「artboard の追加 / 並べ替えの置き場」と位置づけている
 * （Design notes の `artboard add / reorder has an obvious home`）ので、新しい形を
 * 発明せず、同じ左ペインのツリー（`NestedRowList`）と同じ `↑` / `↓` に寄せている。
 *
 * artboard が 1 枚も無いことを伝えるのはここ。ツリー側は「今見ている 1 枚の中身」を
 * 映す場所で、1 枚も無いのは artboard の一覧の話なので、持ち主をこちらに置く。
 * そのときも `+` は残す。1 枚目を足す導線がここにしか無いため。
 */
export function ArtboardList({
  selection,
  onSelect,
  artboard,
}: Readonly<{
  selection: DocumentSelection;
  onSelect: (name: string) => void;
  artboard: LeftPaneArtboardActions;
}>) {
  const artboards = selection.document.artboards;

  return (
    <section aria-label="artboard 一覧" className="text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-500 text-xs uppercase">
          Artboards
        </h3>
        <button
          type="button"
          aria-label={AddArtboardLabel}
          onClick={artboard.add}
          className="px-1 text-gray-500 text-sm hover:text-gray-900"
        >
          +
        </button>
      </div>
      {artboards.length === 0 ? (
        <p className="text-gray-500">{NoArtboardMessage}</p>
      ) : (
        <ul>
          {artboards.map((current, index) => (
            <ArtboardRow
              key={current.name}
              artboard={current}
              placement={{ index, count: artboards.length }}
              isCurrent={DocumentSelection.isCurrentArtboard(
                selection,
                current.name,
              )}
              onSelect={onSelect}
              onReorder={artboard.reorder}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
