import { expect, test, vi } from "vitest";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  BadgeBounds,
  drawnApart,
  HomeBounds,
  setupSelection,
} from "./resize-snap-siblings";
import { drawnAt, renderCanvas, resizeHandleAt } from "./setup";

test("右辺の帯を掴んで兄弟の右辺の近くまで運ぶと、右辺が揃う幅が通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["badge"]), onResize });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  // 右辺が 260 まで来る量。寄せが無ければ幅は 140
  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 258, y: 100 });
  releasePointer(badge, { x: 258, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 143 }]),
    expect.anything(),
  );
});

test("ハンドルを掴んで親の縁の近くまで運ぶと、親の縁に揃う幅が通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["badge"]), onResize });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  // 右辺が 456 まで来る量。寄せが無ければ幅は 336
  pressPointer(resizeHandleAt({ x: 1, y: 0.5 }), { x: 220, y: 100 });
  movePointer(badge, { x: 456, y: 100 });
  releasePointer(badge, { x: 456, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 340 }]),
    expect.anything(),
  );
});

test("artboard の右辺を掴んで他の artboard の左辺の近くまで運ぶと、辺が揃う幅が通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["home"]), onResize });
  drawnApart();
  const home = drawnAt("home", HomeBounds);

  // 右辺が 497 まで来る量。寄せが無ければ幅は 397
  pressPointer(home, { x: 458, y: 280 });
  movePointer(home, { x: 495, y: 280 });
  releasePointer(home, { x: 495, y: 280 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 400 }]),
    expect.anything(),
  );
});
