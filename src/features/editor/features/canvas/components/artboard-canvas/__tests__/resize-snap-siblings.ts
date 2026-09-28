import type { DocumentSelection } from "@/domains/session/document-selection";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { drawnAt, selectionFromArtboards } from "./setup";

/**
 * 座標を持たない `home` に絶対配置の `badge`（100x40）と `marker` が並び、隣に座標を持つ
 * `settings` がある対。
 *
 * @param selectedNames 選ぶものの名前
 * @returns ドキュメントと選択の対
 */
export function setupSelection(
  selectedNames: readonly string[],
): DocumentSelection {
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "badge",
            type: "Box",
            props: {
              widthMode: "fixed",
              width: 100,
              heightMode: "fixed",
              height: 40,
              placement: "absolute",
              x: 20,
              y: 20,
            },
            children: [],
          },
          {
            name: "marker",
            type: "Box",
            props: { placement: "absolute", x: 20, y: 100 },
            children: [],
          },
        ],
      },
      {
        name: "settings",
        width: 300,
        height: 240,
        canvasPosition: { x: 400, y: 0 },
        children: [],
      },
    ],
    selectedNames,
  );
}

/** `home` が描かれている矩形（左辺 100・右辺 460）。 */
export const HomeBounds: CanvasBounds = {
  left: 100,
  top: 60,
  width: 360,
  height: 240,
};

/** `badge` が描かれている矩形（左辺 120・右辺 220）。 */
export const BadgeBounds: CanvasBounds = {
  left: 120,
  top: 80,
  width: 100,
  height: 40,
};

/**
 * それぞれの矩形を与える。`home` の右辺は 460、`badge` の右辺は 220、`marker` の右辺は 263、
 * `settings` の左辺は 500。
 */
export function drawnApart(): void {
  drawnAt("home", HomeBounds);
  drawnAt("badge", BadgeBounds);
  drawnAt("marker", { left: 120, top: 160, width: 143, height: 40 });
  drawnAt("settings", { left: 500, top: 60, width: 300, height: 240 });
}
