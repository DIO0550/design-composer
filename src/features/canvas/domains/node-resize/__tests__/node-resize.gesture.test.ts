import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { Option } from "@/utils/Option";
import {
  NodeResize,
  type ResizeGrab,
  type ResizeGrip,
  type ResizeHandleAnchor,
} from "../index";

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

/**
 * その種類を掴める箇所。並びの何番目かをテストへ写さないよう `HandleAnchors` から引く。
 *
 * @param kind 掴める種類
 * @returns その種類を掴める箇所
 */
function anchorFor(kind: ResizeGrip["kind"]): ResizeHandleAnchor {
  return NodeResize.HandleAnchors.filter(
    (anchor) => anchor.grip.some && anchor.grip.value === kind,
  )[0];
}

/**
 * その箇所を押して掴んだ状態。
 *
 * @param kind 掴む種類
 * @param origin 押した位置
 * @returns 掴んだ状態
 */
function grabbedAt(
  kind: ResizeGrip["kind"],
  origin: ResizeGrab["origin"],
): NodeResize {
  const anchor = anchorFor(kind);
  return NodeResize.grab({
    anchor,
    grip: Option.unwrap(NodeResize.gripFor(setupHandles(), anchor)),
    origin,
  });
}

test("右辺の内側を押すと幅のハンドルを掴む", () => {
  const grabbed = NodeResize.grabAt(setupHandles(), setupBounds(), {
    x: 297,
    y: 100,
  });

  expect(Option.map(grabbed, (grab) => grab.grip)).toEqual(
    Option.some({ kind: "width", width: { axis: "width", length: 200 } }),
  );
});

test("下辺の内側を押すと高さのハンドルを掴む", () => {
  const grabbed = NodeResize.grabAt(setupHandles(), setupBounds(), {
    x: 150,
    y: 147,
  });

  expect(Option.map(grabbed, (grab) => grab.grip)).toEqual(
    Option.some({ kind: "height", height: { axis: "height", length: 100 } }),
  );
});

test("辺から離れた内側を押してもハンドルは掴めない", () => {
  expect(
    NodeResize.grabAt(setupHandles(), setupBounds(), { x: 150, y: 100 }),
  ).toEqual(Option.none);
});

test("要素の外を押すとハンドルは掴めない", () => {
  expect(
    NodeResize.grabAt(setupHandles(), setupBounds(), { x: 320, y: 100 }),
  ).toEqual(Option.none);
});

test("出ていないハンドルの辺を押しても掴めない", () => {
  const widthOnly = [AxisLength.create("width", 200)];

  expect(
    NodeResize.grabAt(widthOnly, setupBounds(), { x: 150, y: 147 }),
  ).toEqual(Option.none);
});

test("角の帯を押しても 1 軸しか掴めない", () => {
  /*
   * 帯の軸は「どちらの辺に近いか」で決まるので、角の付近でも 2 軸にはならない
   * （角の四角の外側・帯の内側を押したときの話。四角そのものは 2 軸を掴める）。
   */
  const grabbed = NodeResize.grabAt(setupHandles(), setupBounds(), {
    x: 297,
    y: 147,
  });

  expect(Option.map(grabbed, (grab) => grab.grip.kind)).toEqual(
    Option.some("width"),
  );
});

test("右下の角では幅と高さの両方を掴める", () => {
  expect(NodeResize.gripFor(setupHandles(), anchorFor("both"))).toEqual(
    Option.some({
      kind: "both",
      width: { axis: "width", length: 200 },
      height: { axis: "height", length: 100 },
    }),
  );
});

test("幅だけが固定なら、右下の角でも幅しか掴めない", () => {
  // 固定されていない軸まで変えると hug / fill の指定を黙って壊すため
  const widthOnly = [AxisLength.create("width", 200)];

  expect(NodeResize.gripFor(widthOnly, anchorFor("both"))).toEqual(
    Option.some({ kind: "width", width: { axis: "width", length: 200 } }),
  );
});

test("どちらの軸も固定されていなければ、右下の角は掴めない", () => {
  expect(NodeResize.gripFor([], anchorFor("both"))).toEqual(Option.none);
});

test("掴めない箇所では何も掴めない", () => {
  const topLeft = NodeResize.HandleAnchors[0];

  expect(NodeResize.gripFor(setupHandles(), topLeft)).toEqual(Option.none);
});

test("掴んでいなければ長さは決まらない", () => {
  expect(
    NodeResize.lengthsAt(NodeResize.create(), { x: 320, y: 100 }, setupView()),
  ).toEqual(Option.none);
});

test("掴んだあと右へ動かすと動かした分だけ幅が伸びる", () => {
  const resize = grabbedAt("width", { x: 300, y: 100 });

  expect(NodeResize.lengthsAt(resize, { x: 340, y: 100 }, setupView())).toEqual(
    Option.some([{ axis: "width", length: 240 }]),
  );
});

test("掴んだあと左へ動かすと動かした分だけ幅が縮む", () => {
  const resize = grabbedAt("width", { x: 300, y: 100 });

  expect(NodeResize.lengthsAt(resize, { x: 260, y: 100 }, setupView())).toEqual(
    Option.some([{ axis: "width", length: 160 }]),
  );
});

test("幅を掴んでいる間は縦の動きで長さが変わらない", () => {
  const resize = grabbedAt("width", { x: 300, y: 100 });

  expect(NodeResize.lengthsAt(resize, { x: 300, y: 400 }, setupView())).toEqual(
    Option.some([{ axis: "width", length: 200 }]),
  );
});

test("角を掴んで斜めに動かすと、幅と高さがそれぞれの向きの動きだけ変わる", () => {
  /*
   * 縦横で違う動きにするのは、両軸へ同じ差分を流す実装（軸の取り違え）でも
   * 通ってしまわないようにするため。
   */
  const resize = grabbedAt("both", { x: 300, y: 150 });

  expect(NodeResize.lengthsAt(resize, { x: 340, y: 175 }, setupView())).toEqual(
    Option.some([
      { axis: "width", length: 240 },
      { axis: "height", length: 125 },
    ]),
  );
});

test("角を掴んで片方の軸だけ 0 で止まっても、もう片方は動いた分だけ変わる", () => {
  const resize = grabbedAt("both", { x: 300, y: 150 });

  expect(NodeResize.lengthsAt(resize, { x: 0, y: 175 }, setupView())).toEqual(
    Option.some([
      { axis: "width", length: 0 },
      { axis: "height", length: 125 },
    ]),
  );
});

test("縮小して見ているときは画面上の移動量より大きく長さが変わる", () => {
  const resize = grabbedAt("width", { x: 300, y: 100 });
  // 1 段階だけ縮小して見ている状態（倍率 1/1.2）
  const zoomedOut = CanvasView.zoomOut(CanvasView.create());

  expect(NodeResize.lengthsAt(resize, { x: 330, y: 100 }, zoomedOut)).toEqual(
    Option.some([{ axis: "width", length: 236 }]),
  );
});

test("元の長さより大きく縮めても長さは 0 で止まる", () => {
  const resize = grabbedAt("width", { x: 300, y: 100 });

  expect(NodeResize.lengthsAt(resize, { x: 0, y: 100 }, setupView())).toEqual(
    Option.some([{ axis: "width", length: 0 }]),
  );
});

test("掴んで離した直後は続けて届く click を飲み込む", () => {
  const released = NodeResize.release(grabbedAt("width", { x: 300, y: 100 }));

  expect(NodeResize.consumesClick(released)).toBe(true);
});

test("何も掴んでいないまま離しても click は飲み込まない", () => {
  expect(
    NodeResize.consumesClick(NodeResize.release(NodeResize.create())),
  ).toBe(false);
});

test("離したあとは長さが決まらなくなる", () => {
  const released = NodeResize.release(grabbedAt("width", { x: 300, y: 100 }));

  expect(
    NodeResize.lengthsAt(released, { x: 340, y: 100 }, setupView()),
  ).toEqual(Option.none);
});
