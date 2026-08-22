import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DocumentError } from "@/domains/document-error";
import { DocumentSaveState } from "@/domains/document-save-state";
import type { Elapsed } from "@/domains/elapsed";
import type { OpenedDocument } from "@/domains/opened-document";
import { useCanvasView } from "@/features/canvas";
import {
  EditorTopBar,
  type EditorTopBarTone,
  EditorTopBarTones,
} from "../index";

/** 倍率の並びを、実物の表示（`useCanvasView`）に繋いで描く。 */
function ZoomWithView(): ReactNode {
  const { view, zoomIn, zoomOut, reset } = useCanvasView();
  return (
    <EditorTopBar.Zoom
      view={view}
      onZoomIn={zoomIn}
      onZoomOut={zoomOut}
      onReset={reset}
    />
  );
}

/**
 * 上部バーを描く。
 *
 * @param bar 出したいもの。省略した項目は帯に並べない
 * @returns `render` の戻り値
 */
export function renderTopBar(
  bar: Readonly<{
    opened?: OpenedDocument;
    tone?: EditorTopBarTone;
    saveState?: DocumentSaveState;
    fileErrors?: readonly DocumentError[];
    zoom?: boolean;
    elapsed?: Elapsed;
  }>,
) {
  // 色味の入口は帯だけ（パンくずは Context から読む）。
  const tone = bar.tone ?? EditorTopBarTones.Normal;
  return render(
    <EditorTopBar tone={tone}>
      {bar.opened ? <EditorTopBar.Breadcrumb opened={bar.opened} /> : null}
      {bar.saveState ? <EditorTopBar.SaveBadge state={bar.saveState} /> : null}
      {bar.fileErrors ? (
        <EditorTopBar.FileInvalidBadge errors={bar.fileErrors} />
      ) : null}
      {bar.zoom ? <ZoomWithView /> : null}
      {bar.elapsed ? (
        <EditorTopBar.LastValidRender elapsed={bar.elapsed} />
      ) : null}
    </EditorTopBar>,
  );
}

/** 保存状態の 3 つを、テストから名前で指せるようにまとめる。 */
export const SaveStates = {
  saved: DocumentSaveState.Saved,
  saving: DocumentSaveState.Saving,
  failed: DocumentSaveState.fromError({
    kind: "permissionDenied",
    message: "/work/app.dcmp: 書き込みが許可されていない",
  }),
} as const;
