import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import type { OpenedDocument } from "@/features/editor/domains/opened-document";
import { useCanvasView } from "@/features/editor/hooks/use-canvas-view";
import { DocumentTopBar } from "../index";

/** 倍率の並びを、実物の表示（`useCanvasView`）に繋いで描く。 */
function ZoomWithView(): ReactNode {
  const { view, zoomIn, zoomOut, reset } = useCanvasView();
  return (
    <DocumentTopBar.Zoom
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
    saveState?: DocumentSaveState;
    zoom?: boolean;
  }>,
) {
  return render(
    <DocumentTopBar>
      {bar.opened ? <DocumentTopBar.Breadcrumb opened={bar.opened} /> : null}
      {bar.saveState ? (
        <DocumentTopBar.SaveBadge state={bar.saveState} />
      ) : null}
      {bar.zoom ? <ZoomWithView /> : null}
    </DocumentTopBar>,
  );
}

/** 保存状態の 3 つを、テストから名前で指せるようにまとめる。 */
export const SAVE_STATES = {
  saved: DocumentSaveState.SAVED,
  saving: DocumentSaveState.SAVING,
  failed: DocumentSaveState.fromError({
    kind: "permissionDenied",
    message: "/work/app.dcmp: 書き込みが許可されていない",
  }),
} as const;
