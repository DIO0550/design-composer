import { expect, test } from "vitest";
import type { AbsolutePlacement } from "@/domains/dcmp/placement";
import {
  type DropParentCoordinates,
  type GrabbedGeometry,
  RepositionTarget,
} from "../index";

/** 掴んだ時点の配置。縦横で違う値にして、取り違えを落とす。 */
const GrabbedAt: AbsolutePlacement = { mode: "absolute", x: 40, y: 24 };

/** 回っていない親の中で掴んだ、20x12 の回っていないノードの時点の配置。 */
const Grabbed: GrabbedGeometry = {
  placement: GrabbedAt,
  parentRotation: 0,
  ownRotation: 0,
  centerFromCorner: { x: 10, y: 6 },
};

/** 回っていない今の親へそのまま落とす。 */
const Home: DropParentCoordinates = {
  name: "home",
  shift: { x: 0, y: 0 },
  rotation: 0,
};

test("親が変わらないとき、書かれる座標は掴んだ時点から運んだ分だけ動く", () => {
  const dropped = RepositionTarget.create(Grabbed, { x: 30, y: -12 }, Home);

  expect(dropped.written.to).toEqual({
    parentName: "home",
    placement: { mode: "absolute", x: 70, y: 12 },
  });
});

test("親が変わるとき、書かれる座標は原点のずれを打ち消した値になる", () => {
  // `card` の左上は今の親より右下（200, 60）にあるので、その分だけ座標は小さくなる
  const dropped = RepositionTarget.create(
    Grabbed,
    { x: 30, y: -12 },
    { name: "card", shift: { x: -200, y: -60 }, rotation: 0 },
  );

  expect(dropped.written.to).toEqual({
    parentName: "card",
    placement: { mode: "absolute", x: -130, y: -48 },
  });
});

test("親が変わっても、見た目のずらし量には原点のずれが入らない", () => {
  // 原点のずれは書かれる座標の側で打ち消すので、見た目は運んだ分だけずれる
  const dropped = RepositionTarget.create(
    Grabbed,
    { x: 30, y: -12 },
    { name: "card", shift: { x: -200, y: -60 }, rotation: 0 },
  );

  expect(dropped.offset).toEqual({ x: 30, y: -12 });
});

test("割り切れない量を運んでも、見た目のずらし量は丸めた行き先から逆算した整数になる", () => {
  // 丸めずに返すと、離したあとの位置と 1px 未満ずれる
  const dropped = RepositionTarget.create(
    Grabbed,
    { x: 28.33, y: -10.83 },
    Home,
  );

  expect(dropped.offset).toEqual({ x: 28, y: -11 });
});

test("落とし先の親が決まっていなくても、運んだ分のずらし量は決まる", () => {
  // 落とせる親がポインタの下に無い間も、掴んだノードはポインタへ追従する
  expect(RepositionTarget.carriedOffset(Grabbed, { x: 30, y: -12 })).toEqual({
    x: 30,
    y: -12,
  });
});

test("親を決めずに求めたずらし量も、丸めた行き先から逆算した整数になる", () => {
  // 落とせる場所へ入った瞬間にずれ方が変わってはいけないので、`create` と同じ丸め方
  expect(
    RepositionTarget.carriedOffset(Grabbed, { x: 28.33, y: -10.83 }),
  ).toEqual({ x: 28, y: -11 });
});

/**
 * 90 度回った親の中で掴んだ時点の配置。親の座標の y 軸は画面の左を向く。
 */
const GrabbedInTurned: GrabbedGeometry = { ...Grabbed, parentRotation: 90 };

/** 90 度回った今の親へそのまま落とす。 */
const Turned: DropParentCoordinates = {
  name: "frame",
  shift: { x: 0, y: 0 },
  rotation: 90,
};

test("90 度回った親の中で画面上の左へ運ぶと、書かれる座標は親の座標で y が運んだ量だけ増える", () => {
  // 運んだ量を親の向きへ戻さないと x が 7 減る
  const dropped = RepositionTarget.create(
    GrabbedInTurned,
    { x: -7, y: 0 },
    Turned,
  );

  expect(dropped.written.to).toEqual({
    parentName: "frame",
    placement: { mode: "absolute", x: 40, y: 31 },
  });
});

test("90 度回った親の中で画面上の左へ運ぶと、見た目のずらし量も親の向きへ戻した量になる", () => {
  // ずらし量は親と一緒に回って効くので、戻さないと画面上では上へずれて見える
  const dropped = RepositionTarget.create(
    GrabbedInTurned,
    { x: -7, y: 0 },
    Turned,
  );

  expect(dropped.offset).toEqual({ x: 0, y: 7 });
});

test("90 度回った親の中で、親を決めずに求めたずらし量も親の向きへ戻した量になる", () => {
  // 落とせる場所の外へ出た瞬間にずれる向きが変わってはいけないので、`create` と同じ戻し方
  expect(
    RepositionTarget.carriedOffset(GrabbedInTurned, { x: -7, y: 0 }),
  ).toEqual({ x: 0, y: 7 });
});

test("30 度回った親の中で割り切れない量を運んでも、書かれる座標とずらし量は同じ丸めた行き先から出る", () => {
  // 親の向きへ戻した量は (19.12, -23.54)。丸めた行き先 (59, 0) から逆算すると (19, -24)
  const dropped = RepositionTarget.create(
    { ...Grabbed, parentRotation: 30 },
    { x: 28.33, y: -10.83 },
    { name: "home", shift: { x: 0, y: 0 }, rotation: 30 },
  );

  expect([dropped.written.to.placement, dropped.offset]).toEqual([
    { mode: "absolute", x: 59, y: 0 },
    { x: 19, y: -24 },
  ]);
});

test("360 度回った親の中では、回っていない親の中と同じ座標が書かれる", () => {
  const dropped = RepositionTarget.create(
    { ...Grabbed, parentRotation: 360 },
    { x: 30, y: -12 },
    { name: "home", shift: { x: 0, y: 0 }, rotation: 360 },
  );

  expect(dropped.written.to).toEqual({
    parentName: "home",
    placement: { mode: "absolute", x: 70, y: 12 },
  });
});
