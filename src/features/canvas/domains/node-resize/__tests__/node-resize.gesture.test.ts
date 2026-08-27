import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { Option } from "@/utils/Option";
import { NodeResize } from "../index";

/** 画面の (100, 50) から 200x100 の大きさで描かれている要素。 */
function setupBounds(): CanvasBounds {
  return { left: 100, top: 50, width: 200, height: 100 };
}

/** 2 軸とも掴める要素のハンドル（右辺 x=300 / 下辺 y=150）。 */
function setupHandles(): readonly AxisLength[] {
  return [AxisLength.create("width", 200), AxisLength.create("height", 100)];
}

/** 等倍で見ているキャンバス。 */
function setupView(): CanvasView {
  return CanvasView.create();
}

test("右辺の内側を押すと幅のハンドルを掴む", () => {
  expect(
    NodeResize.handleAt(setupHandles(), setupBounds(), { x: 297, y: 100 }),
  ).toEqual(Option.some({ axis: "width", length: 200 }));
});

test("下辺の内側を押すと高さのハンドルを掴む", () => {
  expect(
    NodeResize.handleAt(setupHandles(), setupBounds(), { x: 150, y: 147 }),
  ).toEqual(Option.some({ axis: "height", length: 100 }));
});

test("辺から離れた内側を押してもハンドルは掴めない", () => {
  expect(
    NodeResize.handleAt(setupHandles(), setupBounds(), { x: 150, y: 100 }),
  ).toEqual(Option.none);
});

test("要素の外を押すとハンドルは掴めない", () => {
  expect(
    NodeResize.handleAt(setupHandles(), setupBounds(), { x: 320, y: 100 }),
  ).toEqual(Option.none);
});

test("出ていないハンドルの辺を押しても掴めない", () => {
  const widthOnly = [AxisLength.create("width", 200)];

  expect(
    NodeResize.handleAt(widthOnly, setupBounds(), { x: 150, y: 147 }),
  ).toEqual(Option.none);
});

test("掴んでいなければ長さは決まらない", () => {
  expect(
    NodeResize.lengthAt(NodeResize.create(), { x: 320, y: 100 }, setupView()),
  ).toEqual(Option.none);
});

test("掴んだあと右へ動かすと動かした分だけ幅が伸びる", () => {
  const resize = NodeResize.grab(AxisLength.create("width", 200), {
    x: 300,
    y: 100,
  });

  expect(NodeResize.lengthAt(resize, { x: 340, y: 100 }, setupView())).toEqual(
    Option.some({ axis: "width", length: 240 }),
  );
});

test("掴んだあと左へ動かすと動かした分だけ幅が縮む", () => {
  const resize = NodeResize.grab(AxisLength.create("width", 200), {
    x: 300,
    y: 100,
  });

  expect(NodeResize.lengthAt(resize, { x: 260, y: 100 }, setupView())).toEqual(
    Option.some({ axis: "width", length: 160 }),
  );
});

test("幅を掴んでいる間は縦の動きで長さが変わらない", () => {
  const resize = NodeResize.grab(AxisLength.create("width", 200), {
    x: 300,
    y: 100,
  });

  expect(NodeResize.lengthAt(resize, { x: 300, y: 400 }, setupView())).toEqual(
    Option.some({ axis: "width", length: 200 }),
  );
});

test("縮小して見ているときは画面上の移動量より大きく長さが変わる", () => {
  const resize = NodeResize.grab(AxisLength.create("width", 200), {
    x: 300,
    y: 100,
  });
  // 1 段階だけ縮小して見ている状態（倍率 1/1.2）
  const zoomedOut = CanvasView.zoomOut(CanvasView.create());

  expect(NodeResize.lengthAt(resize, { x: 330, y: 100 }, zoomedOut)).toEqual(
    Option.some({ axis: "width", length: 236 }),
  );
});

test("元の長さより大きく縮めても長さは 0 で止まる", () => {
  const resize = NodeResize.grab(AxisLength.create("width", 200), {
    x: 300,
    y: 100,
  });

  expect(NodeResize.lengthAt(resize, { x: 0, y: 100 }, setupView())).toEqual(
    Option.some({ axis: "width", length: 0 }),
  );
});

test("掴んで離した直後は続けて届く click を飲み込む", () => {
  const released = NodeResize.release(
    NodeResize.grab(AxisLength.create("width", 200), { x: 300, y: 100 }),
  );

  expect(NodeResize.consumesClick(released)).toBe(true);
});

test("何も掴んでいないまま離しても click は飲み込まない", () => {
  expect(
    NodeResize.consumesClick(NodeResize.release(NodeResize.create())),
  ).toBe(false);
});

test("離したあとは長さが決まらなくなる", () => {
  const released = NodeResize.release(
    NodeResize.grab(AxisLength.create("width", 200), { x: 300, y: 100 }),
  );

  expect(
    NodeResize.lengthAt(released, { x: 340, y: 100 }, setupView()),
  ).toEqual(Option.none);
});
