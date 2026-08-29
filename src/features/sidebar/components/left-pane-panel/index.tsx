import type { ReactNode } from "react";
import type { Option } from "@/utils/Option";

/**
 * レールで選んだ行き先の中身を出すパネル（UI 案 docs/Design Composer.html の 248px の
 * パネル。見出しを載せた帯が上に付く / #129）。
 *
 * 縦スクロールするのはこのパネルだけ。レールは常に全部見えていないと行き先を選べない
 * ので、器（`EditorLayout.LeftPane`）ではなくここでスクロールを受ける。
 *
 * `footer` をスクロールする本体の**外**へ置くのは、UI 案が `Assets` の
 * `Create component` をパネル下端に固定しているため（中に入れると一覧と一緒に流れる）。
 * 不在を `undefined` ではなく `Option` で受けるのは、出し分ける側の `switch` から
 * 行き先の抜けをコンパイルエラーにするため（`ReactNode` は `undefined` を含む）。
 */
export function LeftPanePanel({
  title,
  note,
  footer,
  children,
}: Readonly<{
  title: string;
  /** 見出しの右端に添える補助情報（UI 案の Error 画面の `frozen`）。 */
  note: Option<ReactNode>;
  footer: Option<ReactNode>;
  children: ReactNode;
}>) {
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
      {/*
        `min-h-0 flex-1` を外すと本体が中身の高さのままになり、フッターが下端から
        浮く（一覧が長いときは押し出される）。happy-dom は Tailwind を解決しないため
        テストでは落ちず、気づく手段は Storybook の視覚差分だけ。

        `scrollbar-gutter: stable` は `PaneBody` と同じ理由で置く（一覧が伸び縮みする
        たびに中身が横へ跳ねないようにする）。
      */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-3 [scrollbar-gutter:stable]">
        {children}
      </div>
      {footer.some ? footer.value : null}
    </div>
  );
}
