import { type ReactNode, useState } from "react";
import { SearchField } from "@/components/search-field";
import type { Option } from "@/utils/Option";

/**
 * レールで選んだ行き先の中身を出すパネル（UI 案 docs/Design Composer.html の 248px のパネ
 * ル。見出しを載せた帯が上に付く）。中身を絞る検索語もここが持ち、下へ渡す。
 *
 * 縦スクロールするのはこのパネルだけ。レールは常に全部見えていないと行き先を選べないの
 * で、器（`EditorLayout.LeftPane`）ではなくここでスクロールを受ける。
 *
 * **検索欄はスクロールする本体の外**（見出しの直下）に置く。UI 案がはみ出しを切り落とす器
 * に入れているのはツリーの行だけで、欄はその外にある（docs/06-ui.md「絞り込み」）。
 *
 * **検索語を空へ戻すのは器の付け替え**（呼び出し側が行き先を `key` にする）で行う。行き先
 * を変えると検索語が消えるのは docs/06-ui.md「絞り込み」の非永続にあたる。
 */
export function LeftPanePanel({
  title,
  note,
  search,
  footer,
  children,
}: Readonly<{
  title: string;
  /** 見出しの右端に添える補助情報（UI 案の Error 画面の `frozen`）。 */
  note: Option<ReactNode>;
  /** 検索欄の案内文。中身を絞れない行き先では不在。 */
  search: Option<string>;
  footer: Option<ReactNode>;
  /** 今の検索語を受け取って中身を組み立てる。欄を持たない行き先では空の語が渡る。 */
  children: (query: string) => ReactNode;
}>) {
  const [query, setQuery] = useState("");

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="flex h-11 shrink-0 items-center border-gray-300 border-b px-3">
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
        {note.some ? (
          <span className="ml-auto text-[10px] text-gray-400">
            {note.value}
          </span>
        ) : null}
      </div>
      {search.some ? (
        <div className="shrink-0 px-3 pt-3">
          <SearchField label={search.value} value={query} onChange={setQuery} />
        </div>
      ) : null}
      {/*
        `min-h-0 flex-1` を外すと本体が中身の高さのままになり、フッターが下端から
        浮く（一覧が長いときは押し出される）。happy-dom は Tailwind を解決しないため
        テストでは落ちず、気づく手段は Storybook の視覚差分だけ。

        `scrollbar-gutter: stable` は `PaneBody` と同じ理由で置く（一覧が伸び縮みする
        たびに中身が横へ跳ねないようにする）。
      */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-3 [scrollbar-gutter:stable]">
        {children(query)}
      </div>
      {footer.some ? footer.value : null}
    </div>
  );
}
