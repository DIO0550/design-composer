import type { ReactElement, ReactNode } from "react";
import { RightPaneShell } from "@/components/__stories__/right-pane-shell";
import { PaneBody } from "@/components/pane-body";

/**
 * 部品 1 つを、実際の右ペインと同じ幅・同じ余白で見るための器。
 *
 * 部品ごとのストーリーが同じ綴りを書き写さずに済むよう 1 つに置く。殻は横断層の
 * `RightPaneShell`、余白は編集画面が着せるのと同じ本文（`PaneBody`）で、どちらも真似ない。
 *
 * `PaneBody` が持つもののうち、`flex-1` と `min-h-0` はここでは効かない（`RightPaneShell`
 * の `content` は flex の親ではない）。`overflow-auto` は効くので、幅からはみ出す中身を
 * 置いたストーリーはこの枠で止まる。効かないものを着せてでも本文を使うのは、余白の綴り
 * （`p-3`）を写さずに済ませるため。
 *
 * 字の大きさだけは本文の器ではなく**中身**が持っている（実画面では、選択があるときの
 * `PropertyPanel.Body` が `flex flex-col items-start gap-3 text-sm` を着せる）ので、
 * ここでも本文の内側に着せる。
 *
 * @returns 受け取った部品を右ペインの幅の枠に入れたもの
 */
export function PanelFrame({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <RightPaneShell height="content">
      <PaneBody>
        <div className="text-sm">{children}</div>
      </PaneBody>
    </RightPaneShell>
  );
}
