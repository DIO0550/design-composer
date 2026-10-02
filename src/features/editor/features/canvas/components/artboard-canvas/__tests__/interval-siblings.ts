import type { DocumentSelection } from "@/domains/session/document-selection";
import { drawnAt, selectionFromArtboards } from "./setup";

/**
 * `home` に、横に間隔 30 で並ぶ絶対配置の `first` / `second` と、運ぶための `badge` を持つ
 * 未選択の対。
 *
 * @returns 列の間隔への吸い付きを確かめられるドキュメントと、未選択の対
 */
export function setupHorizontalRow(): DocumentSelection {
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
            name: "first",
            type: "Text",
            props: { content: "一", placement: "absolute", x: 20, y: 100 },
          },
          {
            name: "second",
            type: "Text",
            props: { content: "二", placement: "absolute", x: 90, y: 100 },
          },
        ],
      },
    ],
    [],
  );
}

/**
 * それぞれの矩形を、ドキュメント上の座標と揃えた位置に置く（`home` の左上が (100, 60)）。
 *
 * `first` の右辺（160）と `second` の左辺（190）の間が 30 なので、列の後ろの端に当たる位置
 * は `second` の右辺（230）から 30 先の 260（ドキュメント上の x は 160）。
 */
export function drawnInHorizontalRow(): void {
  drawnAt("home", { left: 100, top: 60, width: 360, height: 240 });
  drawnAt("badge", { left: 140, top: 84, width: 20, height: 12 });
  drawnAt("first", { left: 120, top: 160, width: 40, height: 40 });
  drawnAt("second", { left: 190, top: 160, width: 40, height: 40 });
}
