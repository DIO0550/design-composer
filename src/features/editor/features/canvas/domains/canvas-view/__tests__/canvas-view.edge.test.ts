import { expect, test } from "vitest";
import { CanvasView } from "../index";

/** 倍率が動かなくなるまで同じズーム操作を繰り返した view。 */
function zoomedToLimit(zoom: (view: CanvasView) => CanvasView): CanvasView {
  return Array.from({ length: 30 }).reduce<CanvasView>(
    (current) => zoom(current),
    CanvasView.create(),
  );
}

test("拡大を繰り返しても上限より大きくならない", () => {
  const view = zoomedToLimit(CanvasView.zoomIn);

  expect(CanvasView.scalePercent(view)).toBe(400);
});

test("縮小を繰り返しても下限より小さくならない", () => {
  const view = zoomedToLimit(CanvasView.zoomOut);

  expect(CanvasView.scalePercent(view)).toBe(10);
});

test("上限に達したあとさらに拡大しても倍率は変わらない", () => {
  const limited = zoomedToLimit(CanvasView.zoomIn);

  expect(CanvasView.zoomIn(limited).scale).toBe(limited.scale);
});

test("下限に達したあとさらに縮小しても倍率は変わらない", () => {
  const limited = zoomedToLimit(CanvasView.zoomOut);

  expect(CanvasView.zoomOut(limited).scale).toBe(limited.scale);
});

test("上限まで拡大したあとでも縮小はできる", () => {
  const limited = zoomedToLimit(CanvasView.zoomIn);

  expect(CanvasView.scalePercent(CanvasView.zoomOut(limited))).toBeLessThan(
    400,
  );
});

test("ドラッグしていないときのポインタ移動では位置が変わらない", () => {
  const view = CanvasView.dragTo(CanvasView.create(), { x: 130, y: 80 });

  expect(view.offset).toEqual({ x: 0, y: 0 });
});

test("ドラッグを終えたあとのポインタ移動では位置が変わらない", () => {
  const dragged = CanvasView.endDrag(
    CanvasView.dragTo(
      CanvasView.startDrag(CanvasView.create(), { x: 100, y: 100 }),
      {
        x: 130,
        y: 80,
      },
    ),
  );

  const view = CanvasView.dragTo(dragged, { x: 200, y: 200 });

  expect(view.offset).toEqual({ x: 30, y: -20 });
});

test("拡大しても元の view は変化しない", () => {
  const view = CanvasView.create();

  CanvasView.zoomIn(view);

  expect(CanvasView.scalePercent(view)).toBe(100);
});

test("パンしても元の view は変化しない", () => {
  const view = CanvasView.create();

  CanvasView.panBy(view, { x: 30, y: -20 });

  expect(view.offset).toEqual({ x: 0, y: 0 });
});
