import { expect, test, vi } from "vitest";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import type { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  drawnAt,
  renderCanvas,
  resizeHandleAt,
  selectionFromArtboards,
} from "./setup";

/**
 * 座標を持たない `home` に絶対配置の `badge`（100x40）と `marker` が並び、隣に座標を持つ
 * `settings` がある対。
 *
 * @param selectedNames 選ぶものの名前
 * @returns ドキュメントと選択の対
 */
function setupSelection(selectedNames: readonly string[]): DocumentSelection {
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

/**
 * それぞれの矩形を与える。`home` の右辺は 460、`badge` の右辺は 220、`marker` の右辺は 263、
 * `settings` の左辺は 500。
 */
function drawnApart(): void {
  drawnAt("home", { left: 100, top: 60, width: 360, height: 240 });
  drawnAt("badge", { left: 120, top: 80, width: 100, height: 40 });
  drawnAt("marker", { left: 120, top: 160, width: 143, height: 40 });
  drawnAt("settings", { left: 500, top: 60, width: 300, height: 240 });
}

test("右辺の帯を掴んで兄弟の右辺の近くまで運ぶと、右辺が揃う幅が通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["badge"]), onResize });
  drawnApart();
  const badge = drawnAt("badge", {
    left: 120,
    top: 80,
    width: 100,
    height: 40,
  });

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
  const badge = drawnAt("badge", {
    left: 120,
    top: 80,
    width: 100,
    height: 40,
  });

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
  const home = drawnAt("home", { left: 100, top: 60, width: 360, height: 240 });

  // 右辺が 497 まで来る量。寄せが無ければ幅は 397
  pressPointer(home, { x: 458, y: 280 });
  movePointer(home, { x: 495, y: 280 });
  releasePointer(home, { x: 495, y: 280 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 400 }]),
    expect.anything(),
  );
});
