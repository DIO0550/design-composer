import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import type { ResizeEdit } from "@/domains/dcmp/resize-edit";
import type { Axis } from "@/domains/unit/axis";
import { Offset } from "@/domains/unit/offset";
import { Option } from "@/utils/Option";
import {
  type DrawnWhileTracking,
  ResizeGrip,
  type ResizeHandleAnchor,
  type ResizeRotation,
} from "../index";
import {
  grabbedAt,
  lengthAlong,
  parentPointAt,
  placedTurned,
  RightEdgeGrip,
  resizeEditAt,
  resizeEditMeasuredAt,
  setupFlowResizable,
  setupView,
} from "./setup";

/*
 * 掴んでいない軸の長さが `hug` / `fill` で連れて変わったときの置き直し（docs/06-ui.md
 * 「リサイズハンドル」）。掴んだ軸だけの置き直しは `node-resize.rotation` が持つ。
 *
 * どのテストも、測る手段が掴んだ時点と今とで違う大きさを返す入力にする（同じ大きさなら
 * 置き直しを丸ごと外しても通る）。
 */

/** 掴む前の位置と大きさ（`setupResizable`）。 */
const Before = { position: { x: 30, y: 70 }, width: 200, height: 100 };

/**
 * 1 軸を当てると、もう一方の軸の長さが連れて変わる描かれ方。当てなければ掴む前の長さのまま。
 *
 * @param applied 長さを当てる軸
 * @param followedElse 当てる軸に掴む前の長さ以外を当てたときの、もう一方の軸の長さ
 * @returns 掴む前の長さを当てたなら掴む前の大きさ、それ以外ならもう一方の軸を
 *   `followedElse` にした大きさを返す測る手段
 */
function followingLength(
  applied: Axis,
  followedElse: number,
): DrawnWhileTracking["layoutSizeFor"] {
  return (lengths) => {
    const length = Option.unwrapOr(
      lengthAlong(lengths, applied),
      Before[applied],
    );
    const isBefore = length === Before[applied];
    return Option.some(
      applied === "width"
        ? { width: length, height: isBefore ? Before.height : followedElse }
        : { width: isBefore ? Before.width : followedElse, height: length },
    );
  };
}

/**
 * 自分の向きに回したノードをその箇所で掴み、回る前の向きで `unrotatedMove` だけ引いたときの編集。
 *
 * @param gesture 自分の向き・掴む箇所・回る前の向きでの移動量
 * @param layoutSizeFor 長さを当てたときの大きさを返す手段
 * @returns 書き込む編集
 */
function turnedEditAt(
  gesture: Readonly<{
    rotation: ResizeRotation;
    anchor: ResizeHandleAnchor;
    unrotatedMove: Offset;
  }>,
  layoutSizeFor: DrawnWhileTracking["layoutSizeFor"],
): ResizeEdit {
  const resize = grabbedAt(
    placedTurned(gesture.rotation),
    gesture.anchor,
    Offset.Origin,
  );
  return resizeEditMeasuredAt(
    resize,
    Offset.rotate(gesture.unrotatedMove, gesture.rotation.total),
    layoutSizeFor,
  );
}

/**
 * 編集を当てたあと、回る前の箇所が親の座標で動いた量。大きさは編集の長さを当てて測ったもの。
 *
 * @param edit 書き込む編集
 * @param box 自分の向き・見る箇所・測る手段
 * @returns 掴む前からの、その箇所の動き
 */
function cornerMoved(
  edit: ResizeEdit,
  box: Readonly<{
    own: number;
    anchor: ResizeHandleAnchor;
    layoutSizeFor: DrawnWhileTracking["layoutSizeFor"];
  }>,
): Offset {
  const stayed = parentPointAt(Before.position, Before, box);
  const after = Option.unwrap(box.layoutSizeFor(edit.lengths));
  const moved = parentPointAt(Option.unwrap(edit.position), after, box);
  return Offset.delta(stayed, moved);
}

test("幅だけを掴んだとき、連れて変わりうるのは高さ", () => {
  expect(ResizeGrip.ungrabbedAxis(RightEdgeGrip)).toEqual(
    Option.some("height"),
  );
});

test("高さだけを掴んだとき、連れて変わりうるのは幅", () => {
  expect(
    ResizeGrip.ungrabbedAxis({
      kind: "height",
      height: { length: AxisLength.create("height", 100), end: "end" },
    }),
  ).toEqual(Option.some("width"));
});

test("角で 2 軸を掴んだとき、連れて変わる軸は無い", () => {
  expect(
    ResizeGrip.ungrabbedAxis({
      kind: "both",
      width: { length: AxisLength.create("width", 200), end: "end" },
      height: { length: AxisLength.create("height", 100), end: "end" },
    }),
  ).toEqual(Option.none);
});

test("90 度回したノードの右辺を引いて高さが連れて縮んでも、回る前の左上の角が親の座標で動かない", () => {
  const layoutSizeFor = followingLength("width", 80);
  const edit = turnedEditAt(
    {
      rotation: { own: 90, total: 90 },
      anchor: { x: 1, y: 0.5 },
      unrotatedMove: { x: 50, y: 0 },
    },
    layoutSizeFor,
  );

  const moved = cornerMoved(edit, {
    own: 90,
    anchor: { x: 0, y: 0 },
    layoutSizeFor,
  });
  expect(moved.x).toBeCloseTo(0);
  expect(moved.y).toBeCloseTo(0);
});

test("30 度回したノードの左辺を引いて高さが連れて伸びても、回る前の右上の角が親の座標で動かない", () => {
  const layoutSizeFor = followingLength("width", 130);
  const edit = turnedEditAt(
    {
      rotation: { own: 30, total: 30 },
      anchor: { x: 0, y: 0.5 },
      unrotatedMove: { x: 40, y: 0 },
    },
    layoutSizeFor,
  );

  const moved = cornerMoved(edit, {
    own: 30,
    anchor: { x: 1, y: 0 },
    layoutSizeFor,
  });
  expect(moved.x).toBeCloseTo(0);
  expect(moved.y).toBeCloseTo(0);
});

test("30 度回したノードの下辺を引いて幅が連れて変わっても、回る前の左上の角が親の座標で動かない", () => {
  const layoutSizeFor = followingLength("height", 170);
  const edit = turnedEditAt(
    {
      rotation: { own: 30, total: 30 },
      anchor: { x: 0.5, y: 1 },
      unrotatedMove: { x: 0, y: 40 },
    },
    layoutSizeFor,
  );

  const moved = cornerMoved(edit, {
    own: 30,
    anchor: { x: 0, y: 0 },
    layoutSizeFor,
  });
  expect(moved.x).toBeCloseTo(0);
  expect(moved.y).toBeCloseTo(0);
});

test("30 度回したノードの上辺を引いて幅が連れて変わっても、回る前の左下の角が親の座標で動かない", () => {
  const layoutSizeFor = followingLength("height", 230);
  const edit = turnedEditAt(
    {
      rotation: { own: 30, total: 30 },
      anchor: { x: 0.5, y: 0 },
      unrotatedMove: { x: 0, y: 30 },
    },
    layoutSizeFor,
  );

  const moved = cornerMoved(edit, {
    own: 30,
    anchor: { x: 0, y: 1 },
    layoutSizeFor,
  });
  expect(moved.x).toBeCloseTo(0);
  expect(moved.y).toBeCloseTo(0);
});

test("360 度回したノードは、高さが連れて変わっても回っていないものと同じ編集になる", () => {
  const gestureOf = (rotation: ResizeRotation) => ({
    rotation,
    anchor: { x: 1, y: 0.5 } as const,
    unrotatedMove: { x: 50, y: 0 },
  });

  expect(
    turnedEditAt(
      gestureOf({ own: 360, total: 360 }),
      followingLength("width", 80),
    ),
  ).toEqual(
    turnedEditAt(gestureOf({ own: 0, total: 0 }), followingLength("width", 80)),
  );
});

test("祖先だけが回っているノードは、高さが連れて変わっても右辺を引いて位置を書き換えない", () => {
  const edit = turnedEditAt(
    {
      rotation: { own: 0, total: 30 },
      anchor: { x: 1, y: 0.5 },
      unrotatedMove: { x: 50, y: 0 },
    },
    followingLength("width", 80),
  );

  expect(edit.position).toEqual(Option.none);
});

test("角を掴んだときは、測る大きさが前後で違っても、測れないときと同じ編集になる", () => {
  const resize = grabbedAt(
    placedTurned({ own: 30, total: 30 }),
    { x: 1, y: 1 },
    Offset.Origin,
  );
  const pointer = Offset.rotate({ x: 20, y: 20 }, 30);

  expect(
    resizeEditMeasuredAt(resize, pointer, followingLength("width", 80)),
  ).toEqual(Option.unwrap(resizeEditAt(resize, pointer, setupView())));
});

/**
 * 90 度回したノードの右辺を回る前の向きで 50 引いたときの位置。
 *
 * @param layoutSizeFor 長さを当てたときの大きさを返す手段
 * @returns 書き込む位置
 */
function rightEdgePulledPosition(
  layoutSizeFor: DrawnWhileTracking["layoutSizeFor"],
): Offset {
  return Option.unwrap(
    turnedEditAt(
      {
        rotation: { own: 90, total: 90 },
        anchor: { x: 1, y: 0.5 },
        unrotatedMove: { x: 50, y: 0 },
      },
      layoutSizeFor,
    ).position,
  );
}

/*
 * 掴んだ軸だけで置き直すと、中心が回る前の右へ 25（親の座標で下へ 25）動き、左上はそこから
 * 25 戻るので (30 - 25, 70 + 25)。前後とも測れて高さが 100 → 30 なら (40, 130) になる。
 */

test("掴んだ時点も今も大きさを測れないときは、掴んだ軸だけで置き直す", () => {
  const position = rightEdgePulledPosition(() => Option.none);

  expect(position.x).toBeCloseTo(5);
  expect(position.y).toBeCloseTo(95);
});

/**
 * 掴んだ時点か今のどちらか一方だけを測れない描かれ方。測れる側は幅を当てると高さが 30 になる。
 *
 * @param unmeasured 測れない側。`grabbed` なら掴んだ時点の幅（200）を当てたとき、`current` なら
 *   それ以外の幅を当てたとき
 * @returns 長さを当てたときの大きさを返す手段
 */
function measuredOnlyOneSide(
  unmeasured: "grabbed" | "current",
): DrawnWhileTracking["layoutSizeFor"] {
  const measured = followingLength("width", 30);
  return (lengths) => {
    const side = Option.contains(lengthAlong(lengths, "width"), Before.width)
      ? "grabbed"
      : "current";
    return side === unmeasured ? Option.none : measured(lengths);
  };
}

test("掴んだ時点の大きさだけを測れないときは、掴んだ軸だけで置き直す", () => {
  const position = rightEdgePulledPosition(measuredOnlyOneSide("grabbed"));

  expect(position.x).toBeCloseTo(5);
  expect(position.y).toBeCloseTo(95);
});

test("今の大きさだけを測れないときは、掴んだ軸だけで置き直す", () => {
  const position = rightEdgePulledPosition(measuredOnlyOneSide("current"));

  expect(position.x).toBeCloseTo(5);
  expect(position.y).toBeCloseTo(95);
});

test("回したフロー配置のノードは、高さが連れて変わっても位置を書かない", () => {
  const resize = grabbedAt(
    { ...setupFlowResizable(), rotation: { own: 30, total: 30 } },
    { x: 1, y: 0.5 },
    Offset.Origin,
  );

  const edit = resizeEditMeasuredAt(
    resize,
    Offset.rotate({ x: 50, y: 0 }, 30),
    followingLength("width", 80),
  );

  expect(edit.position).toEqual(Option.none);
});
