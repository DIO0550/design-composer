import { TypeGlyph } from "@/components/type-glyph";
import type { Artboard } from "@/domains/artboard";
import { EditorState } from "@/features/editor/domains/editor-state";

/** artboard が 1 枚も無いときの知らせ。 */
const NoArtboardMessage = "artboard がありません";

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
  isCurrent,
  onSelect,
}: Readonly<{
  artboard: Artboard;
  isCurrent: boolean;
  onSelect: (name: string) => void;
}>) {
  return (
    <li>
      <button
        type="button"
        aria-label={artboard.name}
        aria-current={isCurrent}
        onClick={() => onSelect(artboard.name)}
        className={`flex w-full items-center gap-1.5 rounded px-2 py-1 text-left ${
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
    </li>
  );
}

/**
 * ドキュメントが持つ artboard の一覧（UI 案 docs/Design Composer.html の
 * `Layers` パネル上段の `Artboards`）。ここで選んだ 1 枚の中身をツリーが映す。
 *
 * UI 案は見出しの右に `+`（artboard の追加）を置くが、出さない。artboard の
 * 追加・削除・並べ替えは別の単位（#43）で、ここが担うのは「どの 1 枚を見るか」だけ。
 * 押しても何も起きないボタンを先に置くと、できない操作が画面にある状態になる。
 *
 * artboard が 1 枚も無いことを伝えるのはここ。ツリー側は「今見ている 1 枚の中身」を
 * 映す場所で、1 枚も無いのは artboard の一覧の話なので、持ち主をこちらに置く。
 */
export function ArtboardList({
  state,
  onSelect,
}: Readonly<{
  state: EditorState;
  onSelect: (name: string) => void;
}>) {
  const artboards = EditorState.document(state).artboards;

  return (
    <section aria-label="artboard 一覧" className="text-sm">
      <h3 className="mb-2 font-semibold text-gray-500 text-xs uppercase">
        Artboards
      </h3>
      {artboards.length === 0 ? (
        <p className="text-gray-500">{NoArtboardMessage}</p>
      ) : (
        <ul>
          {artboards.map((artboard) => (
            <ArtboardRow
              key={artboard.name}
              artboard={artboard}
              isCurrent={EditorState.isCurrentArtboard(state, artboard.name)}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
