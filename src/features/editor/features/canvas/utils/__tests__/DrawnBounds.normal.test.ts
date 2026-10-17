import { afterEach, expect, test } from "vitest";
import {
  clearDrawn,
  drawNamed,
  stubLayoutSize,
} from "@/features/editor/features/canvas/__tests__/canvas-measure";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { Option } from "@/utils/Option";
import { DrawnBounds } from "../DrawnBounds";

/* 測定の差し替え方と後片付けが要る理由は `canvas-measure` の doc を見る。 */
afterEach(clearDrawn);

test("描かれている名前を指すと、その要素の矩形が返る", () => {
  drawNamed("home", { left: 12, top: 34, width: 200, height: 100 });

  expect(DrawnBounds.measure("home")).toEqual(
    Option.some({ left: 12, top: 34, width: 200, height: 100 }),
  );
});

test("複数の名前を指すと、すべてを含む最小の矩形が返る", () => {
  drawNamed("home", { left: 10, top: 20, width: 100, height: 50 });
  drawNamed("about", { left: 200, top: 300, width: 40, height: 60 });

  expect(DrawnBounds.enclosing(["home", "about"])).toEqual(
    Option.some({ left: 10, top: 20, width: 230, height: 340 }),
  );
});

test("矩形に重なって描かれているものだけを拾う", () => {
  drawNamed("home", { left: 0, top: 0, width: 100, height: 100 });
  drawNamed("about", { left: 500, top: 500, width: 100, height: 100 });

  const overlapping = DrawnBounds.collectOverlappingNames(
    [
      { name: "home", rotation: 0 },
      { name: "about", rotation: 0 },
    ],
    {
      left: 50,
      top: 50,
      width: 100,
      height: 100,
    },
    CanvasView.create(),
  );

  expect(overlapping).toEqual(["home"]);
});

test("拾った名前は渡された並びの順のまま返る", () => {
  // 文書順を返す実装と差が出るよう、DOM へ足す順を名前の並びと逆にする
  drawNamed("about", { left: 0, top: 0, width: 100, height: 100 });
  drawNamed("home", { left: 0, top: 0, width: 100, height: 100 });

  const overlapping = DrawnBounds.collectOverlappingNames(
    [
      { name: "home", rotation: 0 },
      { name: "about", rotation: 0 },
    ],
    {
      left: 0,
      top: 0,
      width: 100,
      height: 100,
    },
    CanvasView.create(),
  );

  expect(overlapping).toEqual(["home", "about"]);
});

test("名前で指したものの矩形を、渡した並びの順に測る", () => {
  drawNamed("home", { left: 10, top: 20, width: 100, height: 50 });
  drawNamed("about", { left: 200, top: 20, width: 80, height: 60 });

  expect(DrawnBounds.collectDrawnBounds(["about", "home"])).toEqual([
    { left: 200, top: 20, width: 80, height: 60 },
    { left: 10, top: 20, width: 100, height: 50 },
  ]);
});

/**
 * 回る前は 100x100 の正方形を、中心 (200, 150) まわりに 45 度回したものとして描く。
 * 外接矩形は (129.29, 79.29) から 141.42 四方で、回った左上の辺は x + y = 279.29 の上にある。
 */
function drawTurnedSquare(name: string): void {
  stubLayoutSize(
    drawNamed(name, {
      left: 200 - 50 * Math.SQRT2,
      top: 150 - 50 * Math.SQRT2,
      width: 100 * Math.SQRT2,
      height: 100 * Math.SQRT2,
    }),
    { width: 100, height: 100 },
  );
}

test("回って描かれているものは、外接矩形の隅にだけかかる矩形では拾わない", () => {
  drawTurnedSquare("turned");
  drawNamed("plain", { left: 60, top: 40, width: 20, height: 20 });

  const overlapping = DrawnBounds.collectOverlappingNames(
    [
      { name: "turned", rotation: 45 },
      { name: "plain", rotation: 0 },
    ],
    CanvasBounds.spanning({ x: 60, y: 40 }, { x: 150, y: 100 }),
    CanvasView.create(),
  );

  expect(overlapping).toEqual(["plain"]);
});

test("回って描かれているものは、回った矩形に重なる矩形で拾う", () => {
  drawTurnedSquare("turned");

  const overlapping = DrawnBounds.collectOverlappingNames(
    [{ name: "turned", rotation: 45 }],
    CanvasBounds.spanning({ x: 60, y: 40 }, { x: 180, y: 130 }),
    CanvasView.create(),
  );

  expect(overlapping).toEqual(["turned"]);
});
