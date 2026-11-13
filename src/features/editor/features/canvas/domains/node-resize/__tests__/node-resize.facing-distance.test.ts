import { expect, test } from "vitest";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import type { Offset } from "@/domains/unit/offset";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import { Option } from "@/utils/Option";
import type { Range } from "@/utils/Range";
import { NodeResize, type ResizeTargetNames } from "../index";
import {
  grabbedAt,
  grabbedWithMeasured,
  grabbedWithTargets,
  heldAt,
  setupDrawnWhileTracking,
  setupResizable,
  setupView,
} from "./setup";

/*
 * リサイズ中の Alt / Option の距離（docs/06-ui.md「リサイズハンドル」）。掴む要素は
 * `setupBounds` の矩形（左 100 / 右 300 / 上 50 / 下 150）に描かれていて、今の親
 * （左右 0〜600・上下 0〜400）の中で、右・左・上・下にそれぞれ兄弟が 1 つずついる。
 * 兄弟の辺は、見ている辺からどれも吸い付く距離より遠い（上の兄弟の右辺 200 だけは、
 * 吸い付きを見るテストで寄せ先に使う）。
 */

/** 今の親と兄弟の名前。 */
const WithinParent: ResizeTargetNames = {
  kind: "within-parent",
  parentName: "parent",
  siblingNames: ["right", "left", "above", "below"],
};

/** 兄弟だけが描かれている矩形（今の親を引けない）。 */
const SiblingBounds: Readonly<Record<string, CanvasBounds>> = {
  right: { left: 400, top: 60, width: 50, height: 50 },
  left: { left: 20, top: 60, width: 30, height: 30 },
  above: { left: 150, top: 0, width: 50, height: 20 },
  below: { left: 150, top: 200, width: 50, height: 50 },
};

/** 今の親と兄弟が描かれている矩形。 */
const DrawnBounds: Readonly<Record<string, CanvasBounds>> = {
  ...SiblingBounds,
  parent: { left: 0, top: 0, width: 600, height: 400 },
};

/**
 * 向きごとの線の伸びる範囲だけを取り出す（線の置き場所は `FacingDistances` のテストが見る）。
 *
 * @param distances 向きごとの短い線
 * @returns 向きごとの範囲。線の無い向きは `none`
 */
function spansOf(distances: FacingDistances) {
  const spanOf = (line: (typeof distances)["horizontal"]["start"]) =>
    Option.map(line, (each): Range => each.span);
  return {
    horizontal: {
      start: spanOf(distances.horizontal.start),
      end: spanOf(distances.horizontal.end),
    },
    vertical: {
      start: spanOf(distances.vertical.start),
      end: spanOf(distances.vertical.end),
    },
  };
}

/**
 * その位置まで動かしたときの距離。
 *
 * @param resize 今のリサイズの状態
 * @param pointer 今のポインタの位置
 * @param view 画面上の量をドキュメント上の量へ直す倍率
 * @returns 距離（掴んでいなければテストを落とす）
 */
function distancesAt(
  resize: NodeResize,
  pointer: Offset,
  view: CanvasView = setupView(),
): FacingDistances {
  return Option.unwrap(
    NodeResize.trackedAt(resize, pointer, setupDrawnWhileTracking({ view })),
  ).distanceLines;
}

test("右辺だけを掴んで動かすと、左・上・下に相手がいても右の相手までの距離だけが出る", () => {
  const resize = grabbedWithTargets(
    { x: 1, y: 0.5 },
    { x: 300, y: 100 },
    {
      names: WithinParent,
      boundsByName: DrawnBounds,
    },
  );

  expect(spansOf(distancesAt(resize, { x: 320, y: 100 }))).toEqual({
    horizontal: {
      start: Option.none,
      end: Option.some({ min: 320, max: 400 }),
    },
    vertical: { start: Option.none, end: Option.none },
  });
});

test("右下の角を掴んで動かすと、右と下の相手までの距離が出る", () => {
  const resize = grabbedWithTargets(
    { x: 1, y: 1 },
    { x: 300, y: 150 },
    {
      names: WithinParent,
      boundsByName: DrawnBounds,
    },
  );

  expect(spansOf(distancesAt(resize, { x: 320, y: 170 }))).toEqual({
    horizontal: {
      start: Option.none,
      end: Option.some({ min: 320, max: 400 }),
    },
    vertical: { start: Option.none, end: Option.some({ min: 170, max: 200 }) },
  });
});

test("右上の角を掴んで動かすと、右と上の相手までの距離が出る", () => {
  const resize = grabbedWithTargets(
    { x: 1, y: 0 },
    { x: 300, y: 50 },
    {
      names: WithinParent,
      boundsByName: DrawnBounds,
    },
  );

  expect(spansOf(distancesAt(resize, { x: 320, y: 40 }))).toEqual({
    horizontal: {
      start: Option.none,
      end: Option.some({ min: 320, max: 400 }),
    },
    vertical: { start: Option.some({ min: 20, max: 40 }), end: Option.none },
  });
});

test("左辺を引いて縮めると、左の距離は動かしたあとの左辺から測る", () => {
  const resize = grabbedWithTargets(
    { x: 0, y: 0.5 },
    { x: 100, y: 100 },
    {
      names: WithinParent,
      boundsByName: DrawnBounds,
    },
  );

  // 掴んだ時点の左辺 100 から測るなら 50〜100 になる
  expect(
    spansOf(distancesAt(resize, { x: 130, y: 100 })).horizontal.start,
  ).toEqual(Option.some({ min: 50, max: 130 }));
});

test("掴んだ辺が吸い付いたときは、吸い付いたあとの辺から測る", () => {
  const resize = grabbedWithTargets(
    { x: 1, y: 0.5 },
    { x: 300, y: 100 },
    {
      names: WithinParent,
      boundsByName: DrawnBounds,
    },
  );

  // 右辺は 197 で、上の兄弟の右辺 200 へ吸い付く
  expect(
    spansOf(distancesAt(resize, { x: 197, y: 100 })).horizontal.end,
  ).toEqual(Option.some({ min: 200, max: 400 }));
});

test("揃え先を外して（⌘ / Ctrl）吸い付かないときは、寄せない位置から測る", () => {
  const resize = NodeResize.withoutSnapTargets(
    grabbedWithTargets(
      { x: 1, y: 0.5 },
      { x: 300, y: 100 },
      {
        names: WithinParent,
        boundsByName: DrawnBounds,
      },
    ),
  );

  expect(
    spansOf(distancesAt(resize, { x: 197, y: 100 })).horizontal.end,
  ).toEqual(Option.some({ min: 197, max: 400 }));
});

test("距離の相手を外す（Alt / Option なし）と距離は出ず、吸い付きとガイド線は変わらない", () => {
  const resize = grabbedWithTargets(
    { x: 1, y: 0.5 },
    { x: 300, y: 100 },
    {
      names: WithinParent,
      boundsByName: DrawnBounds,
    },
  );
  const measuring = Option.unwrap(
    NodeResize.trackedAt(resize, { x: 197, y: 100 }, setupDrawnWhileTracking()),
  );

  expect(
    NodeResize.trackedAt(
      NodeResize.withoutDistanceTargets(resize),
      { x: 197, y: 100 },
      setupDrawnWhileTracking(),
    ),
  ).toEqual(Option.some({ ...measuring, distanceLines: FacingDistances.None }));
});

test("倍率 2 倍では、掴んだ辺は縮んだ量の 2 倍動いた位置から測る", () => {
  const resize = grabbedWithTargets(
    { x: 1, y: 0.5 },
    { x: 300, y: 100 },
    {
      names: WithinParent,
      boundsByName: DrawnBounds,
    },
  );
  const doubled: CanvasView = { ...CanvasView.create(), scale: 2 };

  // 画面で 40 引くと幅は 20 伸びる。倍率を戻し忘れると右辺は 320 になる
  expect(
    spansOf(distancesAt(resize, { x: 340, y: 100 }, doubled)).horizontal.end,
  ).toEqual(Option.some({ min: 340, max: 400 }));
});

test("右辺を左辺の向こうまで引いても、長さ 0 で止まった位置から測る", () => {
  const resize = grabbedWithTargets(
    { x: 1, y: 0.5 },
    { x: 300, y: 100 },
    {
      names: WithinParent,
      boundsByName: DrawnBounds,
    },
  );

  // ポインタは 40 にあるが、幅は 0 で止まり右辺は左辺 100 の位置に留まる
  expect(
    spansOf(distancesAt(resize, { x: 40, y: 100 })).horizontal.end,
  ).toEqual(Option.some({ min: 100, max: 400 }));
});

test("右下の角で高さが 0 で止まると、右の距離は出ず下の距離だけが出る", () => {
  const resize = grabbedWithTargets(
    { x: 1, y: 1 },
    { x: 300, y: 150 },
    {
      names: WithinParent,
      boundsByName: DrawnBounds,
    },
  );

  // 高さ 0 の起点は左右の相手と上下で重ならない
  expect(spansOf(distancesAt(resize, { x: 320, y: 0 }))).toEqual({
    horizontal: { start: Option.none, end: Option.none },
    vertical: { start: Option.none, end: Option.some({ min: 50, max: 200 }) },
  });
});

test("今の親を引けないときは距離が出ないが、兄弟には吸い付く", () => {
  const resize = grabbedWithTargets(
    { x: 1, y: 0.5 },
    { x: 300, y: 100 },
    {
      names: WithinParent,
      boundsByName: SiblingBounds,
    },
  );

  // 右辺は 197 で、上の兄弟の右辺 200 へ吸い付けば幅 100
  expect(
    Option.map(
      NodeResize.trackedAt(
        resize,
        { x: 197, y: 100 },
        setupDrawnWhileTracking(),
      ),
      ({ edit, distanceLines }) => ({ edit, distanceLines }),
    ),
  ).toEqual(
    Option.some({
      edit: ResizeEdit.create([{ axis: "width", length: 100 }]),
      distanceLines: FacingDistances.None,
    }),
  );
});

test("掴んだ時点の実測を載せていない掴みでは、距離は出ない", () => {
  const resize = grabbedAt(
    { ...setupResizable(), targets: { kind: "anyGrip", names: WithinParent } },
    { x: 1, y: 0.5 },
    { x: 300, y: 100 },
  );

  expect(distancesAt(resize, { x: 320, y: 100 })).toEqual(FacingDistances.None);
});

test("揃え先も距離の相手も無い掴み方（フロー配置の 2 軸の角）では、距離は出ない", () => {
  // 幅の 1 軸だけで効く相手なので、右下の角では名前が絞られて無くなる
  const resizable = {
    ...setupResizable(),
    targets: { kind: "axisOnly", axis: "width", names: WithinParent },
  } as const;
  const resize = grabbedWithMeasured(
    heldAt(resizable, { x: 1, y: 1 }, { x: 300, y: 150 }),
    DrawnBounds,
  );

  expect(distancesAt(resize, { x: 320, y: 170 })).toEqual(FacingDistances.None);
});

test("artboard の右辺を掴むと、右の動かない artboard までの距離が出る", () => {
  const resize = grabbedWithTargets(
    { x: 1, y: 0.5 },
    { x: 300, y: 100 },
    {
      names: { kind: "among-artboards", otherNames: ["intro", "settings"] },
      boundsByName: {
        intro: { left: -300, top: 50, width: 200, height: 100 },
        settings: { left: 500, top: 0, width: 200, height: 300 },
      },
    },
  );

  expect(spansOf(distancesAt(resize, { x: 320, y: 100 }))).toEqual({
    horizontal: {
      start: Option.none,
      end: Option.some({ min: 320, max: 500 }),
    },
    vertical: { start: Option.none, end: Option.none },
  });
});

test("掴んだ直後と離したあとは、今出す距離が無い", () => {
  const resize = grabbedWithTargets(
    { x: 1, y: 0.5 },
    { x: 300, y: 100 },
    {
      names: WithinParent,
      boundsByName: DrawnBounds,
    },
  );
  const tracked = Option.unwrap(
    NodeResize.trackedAt(resize, { x: 320, y: 100 }, setupDrawnWhileTracking()),
  );
  const released = NodeResize.release(NodeResize.withLines(resize, tracked));

  expect([
    NodeResize.facingDistances(resize),
    NodeResize.facingDistances(released),
  ]).toEqual([FacingDistances.None, FacingDistances.None]);
});

test("掴んでいる状態に載せた距離が、今出す距離として返る", () => {
  const resize = grabbedWithTargets(
    { x: 1, y: 0.5 },
    { x: 300, y: 100 },
    {
      names: WithinParent,
      boundsByName: DrawnBounds,
    },
  );
  const tracked = Option.unwrap(
    NodeResize.trackedAt(resize, { x: 320, y: 100 }, setupDrawnWhileTracking()),
  );

  expect(
    NodeResize.facingDistances(NodeResize.withLines(resize, tracked)),
  ).toEqual(tracked.distanceLines);
});
