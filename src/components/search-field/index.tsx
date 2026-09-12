/**
 * 絞り込んで 1 つも残らなかったときの知らせ（docs/06-ui.md「絞り込み」）。
 *
 * 欄と同じ場所に置くのは、これが打った語に対する答えだから。一覧の側に持たせると、
 * 欄を持つパネルの数だけ同じ文言が増える。
 */
export const NoMatchMessage = "一致するものがありません";

/**
 * 虫眼鏡（UI 案 docs/Design Composer.html の検索欄が枠の中に持つ円 + 柄）。
 *
 * UI 案のレールと同じく、字面ではなく形を要素で組む（字面で代用すると、フォントによって
 * 太さと大きさがばらつく）。何のための欄かは案内文が伝えるので読み上げからは外す。
 *
 * @returns 円と、その右下へ伸びる柄
 */
function SearchGlyph() {
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center">
      <span className="size-2 rounded-full border-[1.5px] border-gray-400" />
      <span className="-ml-px h-px w-1 rotate-45 bg-gray-400" />
    </span>
  );
}

/**
 * 名前で中身を絞る検索欄（UI 案 docs/Design Composer.html の `Search layers` /
 * `Search assets` / docs/06-ui.md「絞り込み」）。
 *
 * 打った語を消す入口は欄自身が持つもの（消すしるしと Esc）を使い、専用のボタンを描かな
 * い。検索用の入力欄はどちらも自前で持つため。
 *
 * 何を絞るかは知らない。持っているのは案内文と今の語と、打たれたことを伝える口だけ。
 */
export function SearchField({
  label,
  value,
  onChange,
}: Readonly<{
  /** 案内文。読み上げ名も兼ねる（UI 案の綴り） */
  label: string;
  value: string;
  onChange: (value: string) => void;
}>) {
  return (
    <div className="flex h-7 items-center gap-2 rounded border border-gray-300 px-2">
      <SearchGlyph />
      {/* 枠は外側の器が持つので、欄そのものは枠を持たず余りを占める */}
      <input
        type="search"
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
      />
    </div>
  );
}
