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

/*
 * ⌘ / Ctrl を押しながら動かしている間は吸い付かない（docs/06-ui.md「リサイズハンドル」の
 * 辺のスナップ）。
 *
 * 動かす量は artboard-canvas.resize-snap.test.tsx と同じで、押していなければ揃う長さへ
 * 吸い付く。閾値の内側かつ揃う位置からずれた量にしているので、修飾キーを見落とすと
 * 揃う長さが書かれて落ちる。
 */

test("⌘ を押しながら右辺の帯を兄弟の右辺の近くまで運ぶと、運んだ量そのままの幅が通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["badge"]), onResize });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  // 押していなければ `marker` の右辺 263 へ揃って 143
  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 258, y: 100 }, "meta");
  releasePointer(badge, { x: 258, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 140 }]),
    expect.anything(),
  );
});

test("Ctrl を押しながら右辺の帯を兄弟の右辺の近くまで運んでも、吸い付かない", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["badge"]), onResize });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 258, y: 100 }, "ctrl");
  releasePointer(badge, { x: 258, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 140 }]),
    expect.anything(),
  );
});

test("⌘ を押しながら左辺のハンドルを親の縁の近くまで運ぶと、位置も運んだ量そのままで書かれる", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["badge"]), onResize });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  // 左辺が 103 まで来る量。押していなければ `home` の左辺 100 へ揃って幅 120・x 0
  pressPointer(resizeHandleAt({ x: 0, y: 0.5 }), { x: 120, y: 100 });
  movePointer(badge, { x: 103, y: 100 }, "meta");
  releasePointer(badge, { x: 103, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.placedAt([{ axis: "width", length: 117 }], { x: 3, y: 20 }),
    expect.anything(),
  );
});

test("⌘ を離して動かし直すと、同じ掴みのまま同じ位置で再び吸い付く", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["badge"]), onResize });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  // 押している「間」だけ効くことを見るので、ポインタは離さずにキーだけを離して動かす
  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 258, y: 100 }, "meta");
  movePointer(badge, { x: 258, y: 100 });
  releasePointer(badge, { x: 258, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 143 }]),
    expect.anything(),
  );
});

test("押さずに吸い付かせたあと ⌘ を押して動かすと、同じ掴みのまま同じ位置で吸い付きが外れる", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["badge"]), onResize });
  drawnApart();
  const badge = drawnAt("badge", BadgeBounds);

  // 1 回目の移動で 143 に吸い付かせてから、同じ位置で ⌘ を押して動かす
  pressPointer(badge, { x: 218, y: 100 });
  movePointer(badge, { x: 258, y: 100 });
  movePointer(badge, { x: 258, y: 100 }, "meta");
  releasePointer(badge, { x: 258, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 140 }]),
    expect.anything(),
  );
});

test("⌘ を押しながら artboard の右辺を他の artboard の左辺の近くまで運んでも、吸い付かない", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["home"]), onResize });
  drawnApart();
  const home = drawnAt("home", HomeBounds);

  // 押していなければ `settings` の左辺 500 へ揃って 400
  pressPointer(home, { x: 458, y: 280 });
  movePointer(home, { x: 495, y: 280 }, "meta");
  releasePointer(home, { x: 495, y: 280 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 397 }]),
    expect.anything(),
  );
});
