import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import type { Offset } from "@/domains/unit/offset";
import { resizeAnchorAt } from "@/features/canvas/__tests__/canvas-resize";
import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import { Option } from "@/utils/Option";
import {
  NodeResize,
  type ResizableSelection,
  type ResizeHandleAnchor,
} from "../index";

/** 画面の (100, 50) から 200x100 の大きさで描かれている要素。 */
function setupBounds(): CanvasBounds {
  return { left: 100, top: 50, width: 200, height: 100 };
}

/** 2 軸とも掴めて、(30, 70) に置かれている要素（左辺・上辺も掴める）。 */
function setupResizable(): ResizableSelection {
  return {
    lengths: [
      AxisLength.create("width", 200),
      AxisLength.create("height", 100),
    ],
    origin: Option.some({ x: 30, y: 70 }),
  };
}

/** 2 軸とも掴めるが位置を持たない要素（フロー配置のノード）。 */
function setupFlowResizable(): ResizableSelection {
  return { ...setupResizable(), origin: Option.none };
}

/** 等倍で見ているキャンバス。 */
function setupView(): CanvasView {
  return CanvasView.create();
}

/**
 * その箇所を押して掴んだ状態。
 *
 * @param resizable 掴む対象
 * @param anchor 押した箇所
 * @param pointerOrigin 押した位置
 * @returns 掴んだ状態
 */
function grabbedAt(
  resizable: ResizableSelection,
  anchor: ResizeHandleAnchor,
  pointerOrigin: Offset,
): NodeResize {
  return NodeResize.grab(
    NodeResize.hold(
      resizable,
      Option.unwrap(
        NodeResize.gripFor(resizable, Option.unwrap(resizeAnchorAt(anchor))),
      ),
      pointerOrigin,
    ),
  );
}

test("右辺の内側を押すと幅のハンドルを掴む", () => {
  // 戻り値はそのまま `grab` へ渡るので、押した位置（起点）まで含めて丸ごと固定する
  expect(
    NodeResize.grabAt(setupResizable(), setupBounds(), { x: 297, y: 100 }),
  ).toEqual(
    Option.some({
      grip: {
        kind: "width",
        width: { length: { axis: "width", length: 200 }, end: "end" },
      },
      pointerOrigin: { x: 297, y: 100 },
      grabbedAt: Option.some({ x: 30, y: 70 }),
    }),
  );
});

test("下辺の内側を押すと高さのハンドルを掴む", () => {
  const grabbed = NodeResize.grabAt(setupResizable(), setupBounds(), {
    x: 150,
    y: 147,
  });

  expect(Option.map(grabbed, (grab) => grab.grip)).toEqual(
    Option.some({
      kind: "height",
      height: { length: { axis: "height", length: 100 }, end: "end" },
    }),
  );
});

test("左辺の内側を押すと幅を始点側から掴む", () => {
  const grabbed = NodeResize.grabAt(setupResizable(), setupBounds(), {
    x: 103,
    y: 100,
  });

  expect(Option.map(grabbed, (grab) => grab.grip)).toEqual(
    Option.some({
      kind: "width",
      width: { length: { axis: "width", length: 200 }, end: "start" },
    }),
  );
});

test("上辺の内側を押すと高さを始点側から掴む", () => {
  const grabbed = NodeResize.grabAt(setupResizable(), setupBounds(), {
    x: 150,
    y: 53,
  });

  expect(Option.map(grabbed, (grab) => grab.grip)).toEqual(
    Option.some({
      kind: "height",
      height: { length: { axis: "height", length: 100 }, end: "start" },
    }),
  );
});

test("位置を持たない要素では左辺の内側を押しても掴めない", () => {
  expect(
    NodeResize.grabAt(setupFlowResizable(), setupBounds(), { x: 103, y: 100 }),
  ).toEqual(Option.none);
});

test("位置を持たない要素でも右辺の内側は掴める", () => {
  // 対照。左辺が掴めないことを「帯を丸ごと殺した」実装で通させないため
  const grabbed = NodeResize.grabAt(setupFlowResizable(), setupBounds(), {
    x: 297,
    y: 100,
  });

  expect(Option.map(grabbed, (grab) => grab.grip.kind)).toEqual(
    Option.some("width"),
  );
});

test("辺から離れた内側を押してもハンドルは掴めない", () => {
  expect(
    NodeResize.grabAt(setupResizable(), setupBounds(), { x: 200, y: 100 }),
  ).toEqual(Option.none);
});

test("要素の外を押すとハンドルは掴めない", () => {
  expect(
    NodeResize.grabAt(setupResizable(), setupBounds(), { x: 320, y: 100 }),
  ).toEqual(Option.none);
});

test("出ていないハンドルの辺を押しても掴めない", () => {
  const widthOnly: ResizableSelection = {
    ...setupResizable(),
    lengths: [AxisLength.create("width", 200)],
  };

  expect(
    NodeResize.grabAt(widthOnly, setupBounds(), { x: 150, y: 147 }),
  ).toEqual(Option.none);
});

test("角の帯を押しても 1 軸しか掴めない", () => {
  /*
   * 2 本の帯が重なる角では、並び順で先にある幅を掴む（近さでは決まらない）。
   * 角の四角の外側・帯の内側を押したときの話で、四角そのものは 2 軸を掴める。
   */
  const grabbed = NodeResize.grabAt(setupResizable(), setupBounds(), {
    x: 297,
    y: 147,
  });

  expect(Option.map(grabbed, (grab) => grab.grip.kind)).toEqual(
    Option.some("width"),
  );
});

test("左上の角の帯でも、掴めるのは並び順で先にある幅だけ", () => {
  const grabbed = NodeResize.grabAt(setupResizable(), setupBounds(), {
    x: 103,
    y: 53,
  });

  expect(Option.map(grabbed, (grab) => grab.grip)).toEqual(
    Option.some({
      kind: "width",
      width: { length: { axis: "width", length: 200 }, end: "start" },
    }),
  );
});

test("右下の角では幅と高さの両方を掴める", () => {
  expect(
    NodeResize.gripFor(
      setupResizable(),
      Option.unwrap(resizeAnchorAt({ x: 1, y: 1 })),
    ),
  ).toEqual(
    Option.some({
      kind: "both",
      width: { length: { axis: "width", length: 200 }, end: "end" },
      height: { length: { axis: "height", length: 100 }, end: "end" },
    }),
  );
});

test("左上の角は幅と高さをどちらも始点側から掴む", () => {
  expect(
    NodeResize.gripFor(
      setupResizable(),
      Option.unwrap(resizeAnchorAt({ x: 0, y: 0 })),
    ),
  ).toEqual(
    Option.some({
      kind: "both",
      width: { length: { axis: "width", length: 200 }, end: "start" },
      height: { length: { axis: "height", length: 100 }, end: "start" },
    }),
  );
});

test("右上の角は幅を終点側・高さを始点側から掴む", () => {
  expect(
    NodeResize.gripFor(
      setupResizable(),
      Option.unwrap(resizeAnchorAt({ x: 1, y: 0 })),
    ),
  ).toEqual(
    Option.some({
      kind: "both",
      width: { length: { axis: "width", length: 200 }, end: "end" },
      height: { length: { axis: "height", length: 100 }, end: "start" },
    }),
  );
});

test("左辺中央のハンドルは幅を始点側から掴む", () => {
  expect(
    NodeResize.gripFor(
      setupResizable(),
      Option.unwrap(resizeAnchorAt({ x: 0, y: 0.5 })),
    ),
  ).toEqual(
    Option.some({
      kind: "width",
      width: { length: { axis: "width", length: 200 }, end: "start" },
    }),
  );
});

test("上辺中央のハンドルは高さを始点側から掴む", () => {
  expect(
    NodeResize.gripFor(
      setupResizable(),
      Option.unwrap(resizeAnchorAt({ x: 0.5, y: 0 })),
    ),
  ).toEqual(
    Option.some({
      kind: "height",
      height: { length: { axis: "height", length: 100 }, end: "start" },
    }),
  );
});

test("位置を持たない要素では左辺中央のハンドルを掴めない", () => {
  expect(
    NodeResize.gripFor(
      setupFlowResizable(),
      Option.unwrap(resizeAnchorAt({ x: 0, y: 0.5 })),
    ),
  ).toEqual(Option.none);
});

test("位置を持たない要素でも右辺中央のハンドルは掴める", () => {
  // 対照。始点側を殺すつもりで 8 箇所すべてを殺した実装では落ちる
  expect(
    NodeResize.gripFor(
      setupFlowResizable(),
      Option.unwrap(resizeAnchorAt({ x: 1, y: 0.5 })),
    ),
  ).toEqual(
    Option.some({
      kind: "width",
      width: { length: { axis: "width", length: 200 }, end: "end" },
    }),
  );
});

test("位置を持たない要素の右下の角は、2 軸とも終点側で掴める", () => {
  expect(
    NodeResize.gripFor(
      setupFlowResizable(),
      Option.unwrap(resizeAnchorAt({ x: 1, y: 1 })),
    ),
  ).toEqual(
    Option.some({
      kind: "both",
      width: { length: { axis: "width", length: 200 }, end: "end" },
      height: { length: { axis: "height", length: 100 }, end: "end" },
    }),
  );
});

test("幅だけが固定なら、右下の角でも幅しか掴めない", () => {
  // 固定されていない軸まで変えると hug / fill の指定を黙って壊すため
  const widthOnly: ResizableSelection = {
    ...setupResizable(),
    lengths: [AxisLength.create("width", 200)],
  };

  expect(
    NodeResize.gripFor(
      widthOnly,
      Option.unwrap(resizeAnchorAt({ x: 1, y: 1 })),
    ),
  ).toEqual(
    Option.some({
      kind: "width",
      width: { length: { axis: "width", length: 200 }, end: "end" },
    }),
  );
});

test("高さだけが固定なら、右下の角でも高さしか掴めない", () => {
  // 幅側だけを見ていると、高さ側の枝を消しても気づけない（対で見る）
  const heightOnly: ResizableSelection = {
    ...setupResizable(),
    lengths: [AxisLength.create("height", 100)],
  };

  expect(
    NodeResize.gripFor(
      heightOnly,
      Option.unwrap(resizeAnchorAt({ x: 1, y: 1 })),
    ),
  ).toEqual(
    Option.some({
      kind: "height",
      height: { length: { axis: "height", length: 100 }, end: "end" },
    }),
  );
});

test("どちらの軸も固定されていなければ、右下の角は掴めない", () => {
  const noAxis: ResizableSelection = { ...setupResizable(), lengths: [] };

  expect(
    NodeResize.gripFor(noAxis, Option.unwrap(resizeAnchorAt({ x: 1, y: 1 }))),
  ).toEqual(Option.none);
});

test("掴んでいなければ編集は決まらない", () => {
  expect(
    NodeResize.editAt(NodeResize.create(), { x: 320, y: 100 }, setupView()),
  ).toEqual(Option.none);
});

test("右辺を掴んだあと右へ動かすと動かした分だけ幅が伸びる", () => {
  const resize = grabbedAt(
    setupResizable(),
    { x: 1, y: 0.5 },
    {
      x: 300,
      y: 100,
    },
  );

  expect(NodeResize.editAt(resize, { x: 340, y: 100 }, setupView())).toEqual(
    Option.some(ResizeEdit.create([{ axis: "width", length: 240 }])),
  );
});

test("右辺を掴んだあと左へ動かすと動かした分だけ幅が縮む", () => {
  const resize = grabbedAt(
    setupResizable(),
    { x: 1, y: 0.5 },
    {
      x: 300,
      y: 100,
    },
  );

  expect(NodeResize.editAt(resize, { x: 260, y: 100 }, setupView())).toEqual(
    Option.some(ResizeEdit.create([{ axis: "width", length: 160 }])),
  );
});

test("右辺を引いても位置は書き換えない", () => {
  // 位置を持つ要素で見る（持たない要素だと常に `none` で、出し分けを壊しても通る）
  const resize = grabbedAt(
    setupResizable(),
    { x: 1, y: 0.5 },
    {
      x: 300,
      y: 100,
    },
  );

  expect(
    Option.map(
      NodeResize.editAt(resize, { x: 340, y: 100 }, setupView()),
      (edit) => edit.position,
    ),
  ).toEqual(Option.some(Option.none));
});

test("左辺を右へ引くと幅が縮み、縮んだぶんだけ位置が右へ動く", () => {
  const resize = grabbedAt(
    setupResizable(),
    { x: 0, y: 0.5 },
    {
      x: 100,
      y: 100,
    },
  );

  expect(NodeResize.editAt(resize, { x: 130, y: 100 }, setupView())).toEqual(
    Option.some(
      ResizeEdit.placedAt([{ axis: "width", length: 170 }], { x: 60, y: 70 }),
    ),
  );
});

test("左辺を左へ引くと幅が増え、増えたぶんだけ位置が左へ動く", () => {
  const resize = grabbedAt(
    setupResizable(),
    { x: 0, y: 0.5 },
    {
      x: 100,
      y: 100,
    },
  );

  expect(NodeResize.editAt(resize, { x: 80, y: 100 }, setupView())).toEqual(
    Option.some(
      ResizeEdit.placedAt([{ axis: "width", length: 220 }], { x: 10, y: 70 }),
    ),
  );
});

test("上辺を下へ引くと高さが縮み、縮んだぶんだけ位置が下へ動く", () => {
  const resize = grabbedAt(
    setupResizable(),
    { x: 0.5, y: 0 },
    {
      x: 200,
      y: 50,
    },
  );

  expect(NodeResize.editAt(resize, { x: 200, y: 75 }, setupView())).toEqual(
    Option.some(
      ResizeEdit.placedAt([{ axis: "height", length: 75 }], { x: 30, y: 95 }),
    ),
  );
});

test("左上の角を引くと、幅・高さと位置が 1 回の編集で決まる", () => {
  /*
   * 縦横で違う動きにするのは、両軸へ同じ差分を流す実装（軸の取り違え）でも
   * 通ってしまわないようにするため。
   */
  const resize = grabbedAt(setupResizable(), { x: 0, y: 0 }, { x: 100, y: 50 });

  expect(NodeResize.editAt(resize, { x: 140, y: 75 }, setupView())).toEqual(
    Option.some(
      ResizeEdit.placedAt(
        [
          { axis: "width", length: 160 },
          { axis: "height", length: 75 },
        ],
        { x: 70, y: 95 },
      ),
    ),
  );
});

test("右上の角を引くと、幅は右へ伸び、位置は縦だけ動く", () => {
  const resize = grabbedAt(setupResizable(), { x: 1, y: 0 }, { x: 300, y: 50 });

  expect(NodeResize.editAt(resize, { x: 340, y: 75 }, setupView())).toEqual(
    Option.some(
      ResizeEdit.placedAt(
        [
          { axis: "width", length: 240 },
          { axis: "height", length: 75 },
        ],
        { x: 30, y: 95 },
      ),
    ),
  );
});

test("右下の角を掴んで斜めに動かすと、幅と高さがそれぞれの向きの動きだけ変わる", () => {
  const resize = grabbedAt(
    setupResizable(),
    { x: 1, y: 1 },
    { x: 300, y: 150 },
  );

  expect(NodeResize.editAt(resize, { x: 340, y: 175 }, setupView())).toEqual(
    Option.some(
      ResizeEdit.create([
        { axis: "width", length: 240 },
        { axis: "height", length: 125 },
      ]),
    ),
  );
});

test("幅を掴んでいる間は縦の動きで長さが変わらない", () => {
  const resize = grabbedAt(
    setupResizable(),
    { x: 1, y: 0.5 },
    {
      x: 300,
      y: 100,
    },
  );

  expect(NodeResize.editAt(resize, { x: 300, y: 400 }, setupView())).toEqual(
    Option.some(ResizeEdit.create([{ axis: "width", length: 200 }])),
  );
});

test("角を掴んで片方の軸だけ 0 で止まっても、もう片方は動いた分だけ変わる", () => {
  const resize = grabbedAt(
    setupResizable(),
    { x: 1, y: 1 },
    { x: 300, y: 150 },
  );

  expect(NodeResize.editAt(resize, { x: 0, y: 175 }, setupView())).toEqual(
    Option.some(
      ResizeEdit.create([
        { axis: "width", length: 0 },
        { axis: "height", length: 125 },
      ]),
    ),
  );
});

test("縮小して見ているときは画面上の移動量より大きく長さが変わる", () => {
  const resize = grabbedAt(
    setupResizable(),
    { x: 1, y: 0.5 },
    {
      x: 300,
      y: 100,
    },
  );
  // 1 段階だけ縮小して見ている状態（倍率 1/1.2）
  const zoomedOut = CanvasView.zoomOut(CanvasView.create());

  expect(NodeResize.editAt(resize, { x: 330, y: 100 }, zoomedOut)).toEqual(
    Option.some(ResizeEdit.create([{ axis: "width", length: 236 }])),
  );
});

test("元の長さより大きく縮めても長さは 0 で止まる", () => {
  const resize = grabbedAt(
    setupResizable(),
    { x: 1, y: 0.5 },
    {
      x: 300,
      y: 100,
    },
  );

  expect(NodeResize.editAt(resize, { x: 0, y: 100 }, setupView())).toEqual(
    Option.some(ResizeEdit.create([{ axis: "width", length: 0 }])),
  );
});

test("左辺を幅より大きく右へ引くと、長さは 0 で止まり、位置も止まったぶんしか動かない", () => {
  const resize = grabbedAt(
    setupResizable(),
    { x: 0, y: 0.5 },
    {
      x: 100,
      y: 100,
    },
  );

  expect(NodeResize.editAt(resize, { x: 500, y: 100 }, setupView())).toEqual(
    Option.some(
      ResizeEdit.placedAt([{ axis: "width", length: 0 }], { x: 230, y: 70 }),
    ),
  );
});

test("掴んで離した直後は続けて届く click を飲み込む", () => {
  const released = NodeResize.release(
    grabbedAt(setupResizable(), { x: 1, y: 0.5 }, { x: 300, y: 100 }),
  );

  expect(NodeResize.consumesClick(released)).toBe(true);
});

test("何も掴んでいないまま離しても click は飲み込まない", () => {
  expect(
    NodeResize.consumesClick(NodeResize.release(NodeResize.create())),
  ).toBe(false);
});

test("離したあとは編集が決まらなくなる", () => {
  const released = NodeResize.release(
    grabbedAt(setupResizable(), { x: 1, y: 0.5 }, { x: 300, y: 100 }),
  );

  expect(NodeResize.editAt(released, { x: 340, y: 100 }, setupView())).toEqual(
    Option.none,
  );
});

test("両側の帯に入る細い要素では、近いほうの辺を掴む", () => {
  /*
   * 幅が帯 2 本ぶん（16px）に満たないと、要素の中のどこを押しても両側の帯に入る。
   * 端の順序で先に来るほうを返す実装だと、右寄りを押しても左辺を掴んでしまう。
   */
  const narrow: ResizableSelection = {
    lengths: [AxisLength.create("width", 10)],
    origin: Option.some({ x: 30, y: 70 }),
  };
  const narrowBounds: CanvasBounds = {
    left: 100,
    top: 50,
    width: 10,
    height: 100,
  };

  const grabbed = NodeResize.grabAt(narrow, narrowBounds, { x: 108, y: 100 });

  expect(Option.map(grabbed, (grab) => grab.grip)).toEqual(
    Option.some({
      kind: "width",
      width: { length: { axis: "width", length: 10 }, end: "end" },
    }),
  );
});

test("両側の帯に入る細い要素でも、左寄りを押せば始点側を掴む", () => {
  // 対照。右寄りの 1 件だけだと、常に終点側を返す実装でも通ってしまう
  const narrow: ResizableSelection = {
    lengths: [AxisLength.create("width", 10)],
    origin: Option.some({ x: 30, y: 70 }),
  };
  const narrowBounds: CanvasBounds = {
    left: 100,
    top: 50,
    width: 10,
    height: 100,
  };

  const grabbed = NodeResize.grabAt(narrow, narrowBounds, { x: 102, y: 100 });

  expect(Option.map(grabbed, (grab) => grab.grip)).toEqual(
    Option.some({
      kind: "width",
      width: { length: { axis: "width", length: 10 }, end: "start" },
    }),
  );
});
