import type { DocumentSelection } from "@/domains/session/document-selection";
import { drawnAt, selectionFromArtboards } from "./setup";

/**
 * `home` に絶対配置の `badge` / `marker` / `card`（その中に孫の `label`）が並び、
 * 隣に `slot` を持つ `settings` がある未選択の対。
 *
 * 座標を持つので、期待値の「揃った」がドキュメント上の値どうしの一致として読める。
 *
 * @returns スナップの範囲を確かめられるドキュメントと、未選択の対
 */
export function setupSiblings(): DocumentSelection {
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "badge",
            type: "Text",
            props: { content: "3", placement: "absolute", x: 40, y: 24 },
          },
          {
            name: "marker",
            type: "Text",
            props: { content: "印", placement: "absolute", x: 150, y: 140 },
          },
          {
            name: "card",
            type: "Box",
            props: { placement: "absolute", x: 100, y: 90 },
            children: [
              { name: "label", type: "Text", props: { content: "札" } },
            ],
          },
        ],
      },
      {
        name: "settings",
        width: 360,
        height: 240,
        children: [
          {
            name: "slot",
            type: "Text",
            props: { content: "枠", placement: "absolute", x: 60, y: 40 },
          },
        ],
      },
    ],
    [],
  );
}

/**
 * それぞれの矩形に、互いの辺が離れた位置を与える。
 *
 * 画面上の位置はドキュメント上の座標と揃えてある（`home` の左上が (100, 60) なので、ドキュ
 * メント上の (150, 140) にいる `marker` は画面上の (250, 200)）。
 */
export function drawnApart(): void {
  drawnAt("home", { left: 100, top: 60, width: 360, height: 240 });
  drawnAt("badge", { left: 140, top: 84, width: 20, height: 12 });
  drawnAt("marker", { left: 250, top: 200, width: 80, height: 40 });
  drawnAt("card", { left: 200, top: 150, width: 120, height: 60 });
  drawnAt("label", { left: 260, top: 170, width: 40, height: 20 });
  drawnAt("settings", { left: 500, top: 100, width: 360, height: 240 });
  drawnAt("slot", { left: 560, top: 140, width: 80, height: 40 });
}
