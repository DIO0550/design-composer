import type { ReactNode } from "react";

type PaneProps = Readonly<{ children: ReactNode }>;

/**
 * 3 ペインの器（docs/06-ui.md「画面構成」）。
 * 中身は children で受け取り、どのペインに何を出すかは呼び出し側が決める
 * （真偽値 props による出し分けを作らない / rules/components.md）。
 *
 * 高さは画面ではなく親に合わせる。ファイル操作のツールバーと同期の失敗表示が
 * 上に並ぶため、画面の高さを取ると 3 ペインがその分はみ出す。
 */
function EditorLayoutRoot({ children }: PaneProps) {
  return (
    <div className="grid h-full min-h-0 w-full grid-cols-[16rem_1fr_18rem] overflow-hidden bg-gray-100 text-gray-900">
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
    // キャンバスは自前でズーム / パンを持つため、ペイン側でスクロールさせない
    // （二重にスクロールすると、掴んで動かした位置と表示がずれる）。
    // relative はエラー一覧を重ねる基準（docs/03-schema.md「不正ファイル時の挙動」）。
    <main
      aria-label="キャンバス"
      className="relative overflow-hidden bg-gray-100"
    >
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
