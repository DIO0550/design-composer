import { expect, test } from "vitest";
import { CanvasView } from "../index";

test("キャンバスを開いた直後は等倍で原点にある", () => {
  const view = CanvasView.create();

  expect(CanvasView.scalePercent(view)).toBe(100);
  expect(view.offset).toEqual({ x: 0, y: 0 });
});

test("拡大すると倍率が上がる", () => {
  const view = CanvasView.zoomIn(CanvasView.create());

  expect(CanvasView.scalePercent(view)).toBeGreaterThan(100);
});

test("縮小すると倍率が下がる", () => {
  const view = CanvasView.zoomOut(CanvasView.create());

  expect(CanvasView.scalePercent(view)).toBeLessThan(100);
});

test("拡大したあと同じ回数だけ縮小すると等倍に戻る", () => {
  const zoomed = CanvasView.zoomIn(CanvasView.zoomIn(CanvasView.create()));

  const view = CanvasView.zoomOut(CanvasView.zoomOut(zoomed));

  expect(CanvasView.scalePercent(view)).toBe(100);
});

test("パンすると移動量が位置に加算される", () => {
  const view = CanvasView.panBy(CanvasView.create(), { x: 30, y: -20 });

  expect(view.offset).toEqual({ x: 30, y: -20 });
});

test("ドラッグでポインタを動かすとその分だけ位置が動く", () => {
  const dragging = CanvasView.startDrag(CanvasView.create(), {
    x: 100,
    y: 100,
  });

  const view = CanvasView.dragTo(dragging, { x: 130, y: 80 });

  expect(view.offset).toEqual({ x: 30, y: -20 });
});

test("ドラッグを続けると直前の位置からの差分だけ動く", () => {
  const dragging = CanvasView.dragTo(
    CanvasView.startDrag(CanvasView.create(), { x: 100, y: 100 }),
    { x: 130, y: 80 },
  );

  const view = CanvasView.dragTo(dragging, { x: 140, y: 90 });

  expect(view.offset).toEqual({ x: 40, y: -10 });
});

test("ドラッグを終えても動かした位置は保たれる", () => {
  const dragging = CanvasView.dragTo(
    CanvasView.startDrag(CanvasView.create(), { x: 100, y: 100 }),
    { x: 130, y: 80 },
  );

  const view = CanvasView.endDrag(dragging);

  expect(view.offset).toEqual({ x: 30, y: -20 });
  expect(CanvasView.isDragging(view)).toBe(false);
});

test("パンを繰り返すと移動量が積み上がる", () => {
  const panned = CanvasView.panBy(CanvasView.create(), { x: 30, y: -20 });

  const view = CanvasView.panBy(panned, { x: 12, y: 5 });

  expect(view.offset).toEqual({ x: 42, y: -15 });
});

test("パンしても倍率は変わらない", () => {
  const zoomed = CanvasView.zoomIn(CanvasView.create());

  const view = CanvasView.panBy(zoomed, { x: 30, y: -20 });

  expect(view.scale).toBe(zoomed.scale);
});

test("拡大しても位置は変わらない", () => {
  const panned = CanvasView.panBy(CanvasView.create(), { x: 30, y: -20 });

  const view = CanvasView.zoomIn(panned);

  expect(view.offset).toEqual({ x: 30, y: -20 });
});

test("倍率と位置が transform に反映される", () => {
  const panned = CanvasView.panBy(CanvasView.create(), { x: 30, y: -20 });

  const transform = CanvasView.transform(panned);

  expect(transform).toBe("translate(30px, -20px) scale(1)");
});

test("100% に戻すと等倍・原点の状態になる", () => {
  const moved = CanvasView.panBy(CanvasView.zoomIn(CanvasView.create()), {
    x: 30,
    y: -20,
  });

  expect(CanvasView.create()).not.toEqual(moved);
  expect(CanvasView.transform(CanvasView.create())).toBe(
    "translate(0px, 0px) scale(1)",
  );
});
