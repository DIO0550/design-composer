import type { PrimitiveType } from "@/domains/primitive-schema";

/**
 * アイコンが表す対象の種別。UI 案（docs/Design Composer.html）は artboard・
 * プリミティブ・部品をそれぞれ別のアイコンで描き分ける。
 *
 * プリミティブの綴りを直接並べず `PrimitiveType` から導出するのは、primitive が
 * 増えたときにアイコンの取りこぼしをコンパイルエラーにするため。
 */
export type TypeGlyphKind = "artboard" | PrimitiveType | "component";

/** 字面と色の対で 1 つの種別を表す。 */
type Glyph = Readonly<{ symbol: string; className: string }>;

/**
 * 種別ごとのアイコン。字面・色はいずれも UI 案の default 状態から採った値で、
 * Tailwind の色名に対応するものが無いため実際の色をそのまま書いている。
 *
 * `component` はツリーの参照ノード（インスタンス）にも使う。指しているものが
 * 部品である点は同じで、UI 案もどちらの行にも `◆` を置いている。
 */
const GLYPHS = {
  artboard: { symbol: "▢", className: "text-[#0d99ff]" },
  Box: { symbol: "□", className: "text-[#00a0a0]" },
  Text: { symbol: "T", className: "font-bold text-[#c67c00]" },
  component: { symbol: "◆", className: "text-[#8b5cf6]" },
} as const satisfies Readonly<Record<TypeGlyphKind, Glyph>>;

/**
 * 名前の左に出す型アイコン（UI 案 docs/Design Composer.html）。
 *
 * 読み上げからは外す。その行が何であるかは名前が伝えるので、アイコンまで読ませると
 * 「◆ primary-button」のように装飾を含んだ読み上げ名になる。
 */
export function TypeGlyph({ kind }: Readonly<{ kind: TypeGlyphKind }>) {
  const glyph = GLYPHS[kind];

  return (
    <span aria-hidden="true" className={`shrink-0 ${glyph.className}`}>
      {glyph.symbol}
    </span>
  );
}
