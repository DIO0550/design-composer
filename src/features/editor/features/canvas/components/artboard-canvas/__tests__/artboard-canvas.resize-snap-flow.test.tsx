import { expect, test, vi } from "vitest";
import type { Props } from "@/domains/dcmp/node";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import type { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import {
  drawnAt,
  renderCanvas,
  selectionFromArtboards,
  snapGuides,
} from "./setup";

/*
 * フロー配置のノードのリサイズでの辺のスナップ（docs/06-ui.md「リサイズハンドル」）。
 *
 * 縦に並ぶ `header`・`card`・`footer` の `card` を選ぶ。右辺は `card` 300・`footer` 340・
 * `header` 400・`home` 460 で、`card` の右辺を 338 まで運ぶといちばん近い揃え先は後ろの兄弟
 * `footer` になる（前の兄弟や親に揃うだけの実装では落ちる）。
 */

/** 両軸とも長さを決めた Box の props。 */
function fixedBox(width: number, height: number): Props {
  return { widthMode: "fixed", width, heightMode: "fixed", height };
}

/**
 * 縦に並ぶ 3 つの Box の `card` を選んだ対。
 *
 * @returns ドキュメントと選択の対
 */
function setupSelection(): DocumentSelection {
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 400,
        children: [
          {
            name: "header",
            type: "Box",
            props: fixedBox(300, 40),
            children: [],
          },
          { name: "card", type: "Box", props: fixedBox(200, 80), children: [] },
          {
            name: "footer",
            type: "Box",
            props: fixedBox(240, 40),
            children: [],
          },
        ],
      },
    ],
    ["card"],
  );
}

/** `card` が描かれている矩形（右辺 300・下辺 180）。 */
const CardBounds: CanvasBounds = {
  left: 100,
  top: 100,
  width: 200,
  height: 80,
};

/** 縦に並んだ 3 つと `home` の矩形を与える。 */
function drawnStacked(): void {
  drawnAt("home", { left: 100, top: 60, width: 360, height: 400 });
  drawnAt("header", { left: 100, top: 60, width: 300, height: 40 });
  drawnAt("card", CardBounds);
  drawnAt("footer", { left: 100, top: 180, width: 240, height: 40 });
}

test("右辺の帯を後ろの兄弟の右辺の近くまで運ぶと、兄弟の右辺に揃う幅が通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(), onResize });
  drawnStacked();
  const card = drawnAt("card", CardBounds);

  // 右辺が 338 まで来る量。寄せが無ければ幅は 238
  pressPointer(card, { x: 298, y: 140 });
  movePointer(card, { x: 336, y: 140 });
  releasePointer(card, { x: 336, y: 140 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 240 }]),
    expect.anything(),
  );
});

test("右下の角を同じだけ運ぶと、兄弟の右辺には吸い付かない", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(), onResize });
  drawnStacked();
  const card = drawnAt("card", CardBounds);

  pressPointer(card, { x: 298, y: 178 });
  movePointer(card, { x: 336, y: 178 });
  releasePointer(card, { x: 336, y: 178 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([
      { axis: "width", length: 238 },
      { axis: "height", length: 80 },
    ]),
    expect.anything(),
  );
});

test("右辺の帯を後ろの兄弟の右辺の近くまで運んでいる間、兄弟の右辺に線が 1 本出る", () => {
  renderCanvas({ selection: setupSelection() });
  drawnStacked();
  const card = drawnAt("card", CardBounds);

  pressPointer(card, { x: 298, y: 140 });
  movePointer(card, { x: 336, y: 140 });

  // `footer` の右辺に中心を合わせ、`card` の上辺 100 から `footer` の下辺 220 までをまたぐ
  expect(snapGuides()).toHaveLength(1);
  expect(snapGuides()[0].getAttribute("style")).toContain(
    "left: 339px; top: 100px; width: 2px; height: 120px",
  );
});
