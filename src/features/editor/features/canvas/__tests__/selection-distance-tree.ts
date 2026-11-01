import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { drawnAt } from "./canvas-measure";

/*
 * 選択しているだけのときの Alt / Option の距離（docs/06-ui.md「キャンバス直接操作」）を、
 * 相手の決め方（`distance-pair`）と通し（`artboard-canvas.selection-distance*`）の両方で
 * 見るための木。
 *
 * home
 *   card
 *     row         ← 主に選ぶもの（artboard 直下の `card` の子）
 *       cell
 *         label
 *     chip        ← `row` の兄弟
 *       chip-icon
 *     sealed      ← `row` のロックした兄弟
 *       sealed-mark
 *   title         ← 別の枝
 * settings
 *   slot          ← 別の artboard
 *
 * `row` の下を 2 段にするのは、⌘ のいちばん内側（`label`）と 1 つ内側（`cell`）を分けるため。
 */

/**
 * この木のドキュメントと選択の対。
 *
 * @param selectedNames 選んでいるものの名前
 * @returns ドキュメントと選択の対
 */
export function selectionDistanceTree(
  selectedNames: readonly string[],
): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 600,
          height: 400,
          children: [
            {
              name: "card",
              type: "Box",
              children: [
                {
                  name: "row",
                  type: "Box",
                  children: [
                    {
                      name: "cell",
                      type: "Box",
                      children: [{ name: "label", type: "Text" }],
                    },
                  ],
                },
                {
                  name: "chip",
                  type: "Box",
                  children: [{ name: "chip-icon", type: "Box" }],
                },
                {
                  name: "sealed",
                  type: "Box",
                  props: { locking: "locked" },
                  children: [{ name: "sealed-mark", type: "Box" }],
                },
              ],
            },
            { name: "title", type: "Text" },
          ],
        },
        {
          name: "settings",
          width: 300,
          height: 200,
          canvasPosition: { x: 700, y: 0 },
          children: [{ name: "slot", type: "Box" }],
        },
      ],
    }),
    selectedNames,
  );
}

/** 描かれている矩形（client 座標）。 */
export const SelectionDistanceTreeBounds = {
  /** 左右 100〜700・上下 60〜460 */
  home: { left: 100, top: 60, width: 600, height: 400 },
  /** 左右 120〜520・上下 90〜280 */
  card: { left: 120, top: 90, width: 400, height: 190 },
  /** 左右 140〜340・上下 100〜160 */
  row: { left: 140, top: 100, width: 200, height: 60 },
  /** 左右 150〜250・上下 110〜150 */
  cell: { left: 150, top: 110, width: 100, height: 40 },
  /** 左右 170〜220・上下 115〜135 */
  label: { left: 170, top: 115, width: 50, height: 20 },
  /** 左右 380〜480・上下 110〜150（`row` の右 40） */
  chip: { left: 380, top: 110, width: 100, height: 40 },
  /** 左右 390〜410・上下 120〜140（`row` の右 50） */
  "chip-icon": { left: 390, top: 120, width: 20, height: 20 },
  /** 左右 140〜240・上下 200〜250 */
  sealed: { left: 140, top: 200, width: 100, height: 50 },
  /** 左右 150〜170・上下 210〜230 */
  "sealed-mark": { left: 150, top: 210, width: 20, height: 20 },
  /** 左右 140〜340・上下 320〜360（`row` の下 160） */
  title: { left: 140, top: 320, width: 200, height: 40 },
  /** 左右 800〜1100・上下 60〜260 */
  settings: { left: 800, top: 60, width: 300, height: 200 },
  /** 左右 820〜920・上下 80〜120 */
  slot: { left: 820, top: 80, width: 100, height: 40 },
} as const satisfies Record<string, CanvasBounds>;

/** 木のすべてを `SelectionDistanceTreeBounds` の矩形で描く。 */
export function drawSelectionDistanceTree(): void {
  for (const [name, bounds] of Object.entries(SelectionDistanceTreeBounds)) {
    drawnAt(name, bounds);
  }
}
