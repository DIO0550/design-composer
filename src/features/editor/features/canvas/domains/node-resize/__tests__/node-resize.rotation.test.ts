import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { DocumentSelection } from "@/domains/session/document-selection";
import type { Offset } from "@/domains/unit/offset";
import { RotatedBounds } from "@/features/editor/features/canvas/domains/rotated-bounds";
import { Option } from "@/utils/Option";
import {
  NodeResize,
  type ResizableSelection,
  type ResizeHandleAnchor,
  type ResizeRotation,
} from "../index";
import {
  grabbedAt,
  setupBounds,
  setupFlowResizable,
  setupResizable,
  setupView,
} from "./setup";

/*
 * 回って描かれているもののリサイズ（docs/06-ui.md「リサイズハンドル」）。
 * 回っていないものの振る舞いは `node-resize.gesture` が持つ。
 */

/** `setupResizable`（(30, 70) に置かれた 200x100 の絶対配置）を、指定した向きに回したもの。 */
function placedTurned(rotation: ResizeRotation): ResizableSelection {
  return { ...setupResizable(), rotation };
}

/**
 * 親の座標で、置かれた矩形の比率の箇所が来る点（自分の向きで中心まわりに回したもの）。
 *
 * @param position ノードの左上
 * @param lengths 幅・高さ
 * @param box 自分の向きと見る箇所
 * @returns 親の座標の点
 */
function parentPointAt(
  position: Offset,
  lengths: Readonly<{ width: number; height: number }>,
  box: Readonly<{ own: number; anchor: ResizeHandleAnchor }>,
): Offset {
  return RotatedBounds.pointAt(
    {
      unrotated: { left: position.x, top: position.y, ...lengths },
      rotation: box.own,
    },
    box.anchor,
  );
}

/**
 * 編集を当てたあとの位置と大きさ。
 *
 * @param edit 書き込む編集
 * @returns 置き直したあとの左上と、幅・高さ
 */
function appliedBox(edit: ResizeEdit): Readonly<{
  position: Offset;
  lengths: Readonly<{ width: number; height: number }>;
}> {
  const lengthOf = (axis: "width" | "height"): number =>
    Option.unwrap(AxisLength.find(edit.lengths, axis)).length;
  return {
    position: Option.unwrap(edit.position),
    lengths: { width: lengthOf("width"), height: lengthOf("height") },
  };
}

test("30 度回したノードの右下を (+20, +20) 引くと、移動量をノードの向きへ戻した量だけ伸びる", () => {
  const resizable: ResizableSelection = {
    ...placedTurned({ own: 30, total: 30 }),
    lengths: [AxisLength.create("width", 44), AxisLength.create("height", 24)],
  };
  const resize = grabbedAt(resizable, { x: 1, y: 1 }, { x: 0, y: 0 });

  const edit = NodeResize.editAt(resize, { x: 20, y: 20 }, setupView());

  // 画面の軸のままなら 64x44。ノードの向きへ戻すと (27.3, 7.3)
  expect(Option.map(edit, (each) => each.lengths)).toEqual(
    Option.some([
      { axis: "width", length: 71 },
      { axis: "height", length: 31 },
    ]),
  );
});

test("90 度回したノードの右辺を画面の下へ引くと幅が伸びる", () => {
  const resize = grabbedAt(
    placedTurned({ own: 90, total: 90 }),
    { x: 1, y: 0.5 },
    { x: 0, y: 0 },
  );

  const edit = NodeResize.editAt(resize, { x: 0, y: 30 }, setupView());

  expect(Option.map(edit, (each) => each.lengths)).toEqual(
    Option.some([{ axis: "width", length: 230 }]),
  );
});

test("回した絶対配置のノードの左上を引くと、右下の角が親の座標で動かない位置へ置き直す", () => {
  const before = { width: 200, height: 100 };
  const resize = grabbedAt(
    placedTurned({ own: 30, total: 30 }),
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  );

  const edit = Option.unwrap(
    NodeResize.editAt(resize, { x: -12, y: -17 }, setupView()),
  );
  const after = appliedBox(edit);

  const anchor = { own: 30, anchor: { x: 1, y: 1 } } as const;
  const stayed = parentPointAt({ x: 30, y: 70 }, before, anchor);
  const moved = parentPointAt(after.position, after.lengths, anchor);
  expect(moved.x).toBeCloseTo(stayed.x);
  expect(moved.y).toBeCloseTo(stayed.y);
});

test("回した絶対配置のノードは右辺を引いても、左辺が親の座標で動かないよう位置を置き直す", () => {
  const before = { width: 200, height: 100 };
  const resize = grabbedAt(
    placedTurned({ own: 90, total: 90 }),
    { x: 1, y: 0.5 },
    { x: 0, y: 0 },
  );

  const edit = Option.unwrap(
    NodeResize.editAt(resize, { x: 0, y: 20 }, setupView()),
  );
  const after = appliedBox({
    ...edit,
    lengths: [...edit.lengths, AxisLength.create("height", 100)],
  });

  const anchor = { own: 90, anchor: { x: 0, y: 0.5 } } as const;
  const stayed = parentPointAt({ x: 30, y: 70 }, before, anchor);
  const moved = parentPointAt(after.position, after.lengths, anchor);
  expect(moved.x).toBeCloseTo(stayed.x);
  expect(moved.y).toBeCloseTo(stayed.y);
});

test("回したフロー配置のノードは、位置を書かずに長さだけを書く", () => {
  const resize = grabbedAt(
    { ...setupFlowResizable(), rotation: { own: 30, total: 30 } },
    { x: 1, y: 1 },
    { x: 0, y: 0 },
  );

  const edit = NodeResize.editAt(resize, { x: 20, y: 20 }, setupView());

  expect(Option.map(edit, (each) => each.position)).toEqual(
    Option.some(Option.none),
  );
});

test("祖先だけが回っているとき、伸びる向きは祖先の向きで決まり、終点側を引いても位置は書かない", () => {
  const resizable: ResizableSelection = {
    ...placedTurned({ own: 0, total: 30 }),
    lengths: [AxisLength.create("width", 44), AxisLength.create("height", 24)],
  };
  const resize = grabbedAt(resizable, { x: 1, y: 1 }, { x: 0, y: 0 });

  const edit = NodeResize.editAt(resize, { x: 20, y: 20 }, setupView());

  expect(edit).toEqual(
    Option.some(
      ResizeEdit.create([
        AxisLength.create("width", 71),
        AxisLength.create("height", 31),
      ]),
    ),
  );
});

test("祖先も回っているとき、置き直しは自分の向きだけで反対の角を留める", () => {
  const before = { width: 200, height: 100 };
  const resize = grabbedAt(
    placedTurned({ own: 30, total: 75 }),
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  );

  const edit = Option.unwrap(
    NodeResize.editAt(resize, { x: -12, y: -17 }, setupView()),
  );
  const after = appliedBox(edit);

  const anchor = { own: 30, anchor: { x: 1, y: 1 } } as const;
  const stayed = parentPointAt({ x: 30, y: 70 }, before, anchor);
  const moved = parentPointAt(after.position, after.lengths, anchor);
  expect(moved.x).toBeCloseTo(stayed.x);
  expect(moved.y).toBeCloseTo(stayed.y);
});

/** `setupBounds`（画面の (100, 50) から 200x100）を 45 度回して描いたもの。中心は (200, 100)。 */
const TurnedBounds: RotatedBounds = { unrotated: setupBounds(), rotation: 45 };

test("45 度回したノードの回った右辺の内側を押すと、幅を掴む", () => {
  const onRightBand = RotatedBounds.pointAt(TurnedBounds, { x: 0.985, y: 0.5 });

  const grabbed = NodeResize.grabAt(
    placedTurned({ own: 45, total: 45 }),
    TurnedBounds,
    onRightBand,
  );

  expect(Option.map(grabbed, (held) => held.grip)).toEqual(
    Option.some({
      kind: "width",
      width: { length: { axis: "width", length: 200 }, end: "end" },
    }),
  );
});

test("45 度回したノードの外接矩形の角を押しても、回った矩形の外なので掴まない", () => {
  // 外接矩形の左上は (93.9, -6.1)。その少し内側は外接矩形には入るが、回った矩形の外
  const grabbed = NodeResize.grabAt(
    placedTurned({ own: 45, total: 45 }),
    TurnedBounds,
    { x: 96, y: -4 },
  );

  expect(grabbed).toEqual(Option.none);
});

/**
 * 30 度回した Box の中に絶対配置の `badge`、1 回りした絶対配置の `stamp`、30 度回した
 * 絶対配置の `tilted` がいるドキュメントで、名前を 1 つ選ぶ。
 *
 * @param name 選ぶものの名前
 * @returns ドキュメントと選択の対
 */
function setupTurnedSelection(name: string): DocumentSelection {
  const placedBox = (x: number, rotation: number) => ({
    widthMode: "fixed",
    width: 40,
    heightMode: "fixed",
    height: 20,
    placement: "absolute",
    x,
    y: 10,
    rotation,
  });
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            {
              name: "card",
              type: "Box",
              props: { ...placedBox(200, 30), width: 120, height: 80 },
              children: [
                {
                  name: "badge",
                  type: "Box",
                  props: placedBox(10, 15),
                  children: [],
                },
              ],
            },
            {
              name: "stamp",
              type: "Box",
              props: placedBox(10, 360),
              children: [],
            },
            {
              name: "tilted",
              type: "Box",
              props: placedBox(80, 30),
              children: [],
            },
          ],
        },
      ],
    }),
    [name],
  );
}

test("回った Box の中のノードは、自分の向きと祖先を合わせた画面上の向きを持つ", () => {
  expect(NodeResize.resizable(setupTurnedSelection("badge")).rotation).toEqual({
    own: 15,
    total: 45,
  });
});

test("回したノードには揃え先が無い", () => {
  expect(
    NodeResize.resizable(setupTurnedSelection("tilted")).snapTargetNames,
  ).toEqual([]);
});

test("回った Box の中のノードにも揃え先が無い", () => {
  expect(
    NodeResize.resizable(setupTurnedSelection("badge")).snapTargetNames,
  ).toEqual([]);
});

test("1 回り回したノードは回っていないものと同じく揃え先を持つ", () => {
  expect(
    NodeResize.resizable(setupTurnedSelection("stamp")).snapTargetNames,
  ).toEqual(["home", "card", "tilted"]);
});
