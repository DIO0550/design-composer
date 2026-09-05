import { expect, test } from "vitest";
import type { AbsolutePlacement } from "@/domains/dcmp/placement";
import { RepositionTarget } from "../index";

/** 掴んだ時点の配置。縦横で違う値にして、取り違えを落とす。 */
const Grabbed: AbsolutePlacement = { mode: "absolute", x: 40, y: 24 };

test("親が変わらないとき、書かれる座標は掴んだ時点から運んだ分だけ動く", () => {
  const dropped = RepositionTarget.create(
    Grabbed,
    { x: 30, y: -12 },
    { name: "home", shift: { x: 0, y: 0 } },
  );

  expect(dropped.to).toEqual({
    parentName: "home",
    placement: { mode: "absolute", x: 70, y: 12 },
  });
});

test("親が変わるとき、書かれる座標は原点のずれを打ち消した値になる", () => {
  // `card` の左上は今の親より右下（200, 60）にあるので、その分だけ座標は小さくなる
  const dropped = RepositionTarget.create(
    Grabbed,
    { x: 30, y: -12 },
    { name: "card", shift: { x: -200, y: -60 } },
  );

  expect(dropped.to).toEqual({
    parentName: "card",
    placement: { mode: "absolute", x: -130, y: -48 },
  });
});

test("親が変わっても、見た目のずらし量には原点のずれが入らない", () => {
  // 画面上の位置は変わらないので、見た目は運んだ分だけずれる
  const dropped = RepositionTarget.create(
    Grabbed,
    { x: 30, y: -12 },
    { name: "card", shift: { x: -200, y: -60 } },
  );

  expect(dropped.offset).toEqual({ x: 30, y: -12 });
});

test("割り切れない量を運んでも、見た目のずらし量は丸めた行き先から逆算した整数になる", () => {
  // 丸めずに返すと、離したあとの位置と 1px 未満ずれる
  const dropped = RepositionTarget.create(
    Grabbed,
    { x: 28.33, y: -10.83 },
    { name: "home", shift: { x: 0, y: 0 } },
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
