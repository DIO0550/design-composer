import type { ReactNode } from "react";

/**
 * レールで選んだ行き先の中身を出すパネル（UI 案 docs/Design Composer.html の 248px の
 * パネル。見出しを載せた帯が上に付く / #129）。
 *
 * 縦スクロールするのはこのパネルだけ。レールは常に全部見えていないと行き先を選べない
 * ので、器（`EditorLayout.LeftPane`）ではなくここでスクロールを受ける。
 */
export function LeftPanePanel({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
      <div className="flex h-11 shrink-0 items-center border-gray-300 border-b px-3">
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
      </div>
      <div className="flex flex-col gap-4 overflow-auto p-3">{children}</div>
    </div>
  );
}
