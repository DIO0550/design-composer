/**
 * アイコンで描き分けられる対象の種別。
 *
 * ここで綴っているのは、横断層（`src/components/`）が `domains/` を import できず
 * （rules/architecture.md「依存方向のルール」）、選択の種別（`SelectionKind`）を
 * そのまま受けられないため。呼び出し側はその種別を渡しているので、描けない種別が
 * 増えれば呼び出し側がコンパイルエラーになる（`selection.type.test.ts` が
 * その関係を型で固定している）。
 *
 * パレットの部品**定義**の行にも `component` を渡す。選択できるものの種別としては
 * 定義そのものが外れるが、UI 案が定義とインスタンスのどちらにも `◆` を置いている以上、
 * 描き分けの並びは 1 つでよい。並びを 2 つ持つと、primitive が増えたときに両方へ足す
 * 必要が出る。
 */
export type TypeGlyphKind = "artboard" | "Box" | "Text" | "component";

/** 字面と色の対で 1 つの種別を表す。 */
type Glyph = Readonly<{ symbol: string; className: string }>;

/**
 * 種別ごとのアイコン。字面は UI 案から採った値で、Tailwind の色名に対応するものが
 * 無いため色は実際の値をそのまま書いている。
 *
 * 色のうち UI 案と一致しているのは `artboard` と `component` だけ。UI 案は `□` / `T` を
 * **選択状態**で塗り分けており（選択中は青、それ以外は灰）、種別の色を持っていない。
 * ここは種別ごとに 1 色のままにしてある（#112 の別の単位で扱う）。
 *
 * `component` はツリーの参照ノード（インスタンス）にも使う。指しているものが
 * 部品である点は同じで、UI 案もどちらの行にも `◆` を置いている。
 *
 * `artboard` の色は 1 色のままにする。UI 案は `Artboards` の一覧で、今見ている 1 枚の
 * `#` を青、それ以外を灰に描き分けているが、アイコンが表すのは種別で、どれが今の 1 枚かは
 * 行の背景色と `aria-current` が伝える。同じ 1 つのことを 2 つの見た目で二重に持つと、
 * 片方だけ直したときに食い違う。キャンバスのツールバーの `#`（#316）も同じ 1 色で、
 * UI 案がそこへ与えている灰とは離れる（`□` / `T` と同じ #112 の乖離）。
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
