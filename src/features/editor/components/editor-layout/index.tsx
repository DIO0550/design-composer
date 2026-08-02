import type { ReactNode } from "react";

type PaneProps = Readonly<{ children: ReactNode }>;

/**
 * 3 ペインの器（docs/06-ui.md「画面構成」）。
 * 中身は children で受け取り、どのペインに何を出すかは呼び出し側が決める
 * （真偽値 props による出し分けを作らない / rules/components.md）。
 */
function EditorLayoutRoot({ children }: PaneProps) {
  return (
    <div className="grid h-screen w-screen grid-cols-[16rem_1fr_18rem] overflow-hidden bg-gray-100 text-gray-900">
      {children}
    </div>
  );
}

function LeftPane({ children }: PaneProps) {
  return (
    <aside
      aria-label="ツリービュー・部品一覧"
      className="flex flex-col gap-4 overflow-auto border-r border-gray-300 bg-white p-3"
    >
      {children}
    </aside>
  );
}

function CenterPane({ children }: PaneProps) {
  return (
    <main aria-label="キャンバス" className="overflow-auto bg-gray-100 p-6">
      {children}
    </main>
  );
}

function RightPane({ children }: PaneProps) {
  return (
    <aside
      aria-label="プロパティパネル"
      className="overflow-auto border-l border-gray-300 bg-white p-3"
    >
      {children}
    </aside>
  );
}

export const EditorLayout = Object.assign(EditorLayoutRoot, {
  LeftPane,
  CenterPane,
  RightPane,
});
