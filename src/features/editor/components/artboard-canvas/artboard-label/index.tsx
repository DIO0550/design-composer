import type { CompiledArtboard } from "@/domains/compiled-artboard";

/**
 * artboard の見出し（UI 案 docs/Design Composer.html。名前の右に大きさが並ぶ）。
 *
 * 名前が青く太くなるのは「今ツリーが映している 1 枚」のとき（#184）。UI 案で色が
 * 付いているのは 10 行中 1 行だけで、その画面では artboard 自身ではなく配下のノードが
 * 選択されている。一方その画面は `Artboards` 一覧が `login` をハイライトしている
 * 唯一の画面でもあるので、青が指しているのは選択ではなく「今見ている 1 枚」と読んだ。
 * Why not: `EditorState.isSelected` は採らない。UI 案の唯一の色付きを再現できない。
 *
 * Why not: 大きさの綴りを `artboard-list` と共通化しない。UI 案はツリー側が
 * `720×900`、キャンバス側が `720 × 900` で空白の有無が違う。
 *
 * @returns 名前と大きさを並べた見出しの 1 行
 */
export function ArtboardLabel({
  artboard,
  isCurrent,
}: Readonly<{ artboard: CompiledArtboard; isCurrent: boolean }>) {
  return (
    <span className="flex h-[18px] items-center gap-2 text-[11px]">
      {/*
        **この出し分けを潰してもテストは 1 件も落ちない。** happy-dom は Tailwind を
        解決せず、class 名を assert するのは実装詳細のテストになる。気づく手段は
        `ArtboardCanvas` の視覚差分（選択なし / artboard を選択中）だけ。
      */}
      <span
        className={isCurrent ? "font-medium text-[#0d99ff]" : "text-[#8c8c8c]"}
      >
        {artboard.element.name}
      </span>
      {/* 選択中の artboard でも大きさは太くしない（UI 案が font-weight を明示している） */}
      <span className="font-normal text-[#b3b3b3]">
        {artboard.width} × {artboard.height}
      </span>
    </span>
  );
}
