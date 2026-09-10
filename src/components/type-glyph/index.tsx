/**
 * アイコンで描き分けられる対象の種別。
 *
 * 選択の種別（`SelectionKind`）をそのまま受けずに綴り直しているのは、横断層から
 * `domains/` を import できないため。描けない種別が増えれば呼び出し側がコンパイルエラー
 * になる（`selection.type.test.ts` が型で固定している）。
 *
 * パレットの部品**定義**の行にも `component` を渡す。UI 案が定義とインスタンスのどちら
 * にも `◆` を置いている以上、描き分けの並びは 1 つでよい（2 つ持つと primitive が増えた
 * とき両方へ足す）。
 */
export type TypeGlyphKind = "artboard" | "Box" | "Text" | "component";

/** 字面と色の対で 1 つの種別を表す。 */
type Glyph = Readonly<{ symbol: string; className: string }>;

/**
 * 種別ごとのアイコン。字面は UI 案から採った値で、Tailwind の色名に対応するものが無いた
 * め色は実際の値をそのまま書いている。
 *
 * 色のうち UI 案と一致しているのは `artboard` と `component` だけ。UI 案は `□` / `T` を
 * **選択状態**で塗り分けていて種別の色を持たないので、ここは種別ごとに 1 色のままにして
 * ある（#112 の別の単位）。
 *
 * `artboard` も 1 色のままにする。UI 案は `Artboards` の一覧で今見ている 1 枚の `#` を
 * 青、それ以外を灰に描き分けているが、アイコンが表すのは種別で、どれが今の 1 枚かは行の
 * 背景色と `aria-current` が伝える。同じ 1 つのことを 2 つの見た目で持つと、片方だけ直
 * したときに食い違う。
 */
const Glyphs = {
  artboard: { symbol: "#", className: "text-[#0d99ff]" },
  Box: { symbol: "□", className: "text-[#00a0a0]" },
  Text: { symbol: "T", className: "font-bold text-[#c67c00]" },
  component: { symbol: "◆", className: "text-[#9747ff]" },
} as const satisfies Readonly<Record<TypeGlyphKind, Glyph>>;

/**
 * 名前の左に出す型アイコン（UI 案 docs/Design Composer.html）。
 *
 * 読み上げからは外す。その行が何であるかは名前が伝えるので、アイコンまで読ませると
 * 「◆ primary-button」のように装飾を含んだ読み上げ名になる。
 */
export function TypeGlyph({ kind }: Readonly<{ kind: TypeGlyphKind }>) {
  const glyph = Glyphs[kind];

  return (
    <span aria-hidden="true" className={`shrink-0 ${glyph.className}`}>
      {glyph.symbol}
    </span>
  );
}
