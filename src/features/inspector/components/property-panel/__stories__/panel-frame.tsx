import type { ReactElement, ReactNode } from "react";
import { RightPaneShell } from "@/components/__stories__/right-pane-shell";
import { PaneBody } from "@/components/pane-body";

/**
 * 部品 1 つを、実際の右ペインと同じ幅・同じ余白で見るための器。部品ごとのストーリーが同じ綴りを書き写さずに済むよう 1 つに置く。
 *
 * 殻は横断層の `RightPaneShell`、余白は編集画面が着せるのと同じ本文（`PaneBody`）で、どちらも真似ない。`PaneBody` の `flex-1` /
 * `min-h-0` はここでは効かないが（`RightPaneShell` の `content` は flex の親ではない）、余白の綴り（`p-3`）を写さずに済ませる
 * ために着せる。
 *
 * 字の大きさだけは本文の器ではなく**中身**が持っている（実画面では選択があるときの `PropertyPanel.Body` が着せる）ので、ここでも
 * 本文の内側に着せる。
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
