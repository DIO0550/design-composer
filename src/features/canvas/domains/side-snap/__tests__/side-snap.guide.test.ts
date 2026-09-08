import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import { Option } from "@/utils/Option";
import { SideSnap } from "../index";
import { Moving } from "./moving-bounds";

/*
 * 揃った辺に引くガイド線（docs/06-ui.md「キャンバス直接操作」の辺のスナップ）。
 * 線は太さのぶんを中心で振り分けるので、位置は揃った辺の座標より 1 小さくなる。
 */

test("左辺どうしが揃うと、揃え先の左辺に中心を合わせた縦の線が 1 本出る", () => {
  const stationary: CanvasBounds = {
    left: 104,
    top: 300,
    width: 200,
    height: 20,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).guides,
  ).toEqual({
    horizontal: Option.some({ left: 103, top: 100, width: 2, height: 220 }),
    vertical: Option.none,
  });
});

test("運んでいるものの左辺が揃え先の右辺と揃うときも、線は揃え先の辺に出る", () => {
  // 右辺は 97。寄せる前の運んでいるものの辺（100）で線を引く実装だと 99 になる
  const stationary: CanvasBounds = {
    left: 40,
    top: 300,
    width: 57,
    height: 20,
  };

  expect(
    Option.unwrap(
      SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).guides
        .horizontal,
    ).left,
  ).toBe(96);
});

test("線の長さは、寄せたあとの運んでいるものと揃え先の両方をまたぐ", () => {
  // 縦には重ならない位置に置くので、上端は揃え先から・下端は運んでいるものから決まる
  const stationary: CanvasBounds = {
    left: 104,
    top: 20,
    width: 200,
    height: 30,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).guides,
  ).toEqual({
    horizontal: Option.some({ left: 103, top: 20, width: 2, height: 100 }),
    vertical: Option.none,
  });
});

test("既に辺が重なっているときも、揃った線は出る", () => {
  // 寄せ量は 0。「寄せ量が 0 でない軸だけ」で出す実装だと、いちばん揃っている瞬間に消える
  const stationary: CanvasBounds = {
    left: Moving.left,
    top: 300,
    width: 200,
    height: 20,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).guides,
  ).toEqual({
    horizontal: Option.some({ left: 99, top: 100, width: 2, height: 220 }),
    vertical: Option.none,
  });
});

test("同じ軸に届く辺が複数あっても、線は寄る先の 1 本だけ出る", () => {
  const far: CanvasBounds = { left: 105, top: 300, width: 300, height: 20 };
  const near: CanvasBounds = { left: 102, top: 340, width: 300, height: 20 };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [far, near])).guides,
  ).toEqual({
    horizontal: Option.some({ left: 101, top: 100, width: 2, height: 260 }),
    vertical: Option.none,
  });
});

test("どの辺も届かない揃え先からは、線が出ない", () => {
  // 届く相手（縦だけ揃う `reachable`）を同じ入力に置き、出る側と対で見る
  const far: CanvasBounds = { left: 300, top: 300, width: 40, height: 20 };
  const reachable: CanvasBounds = {
    left: 500,
    top: 95,
    width: 40,
    height: 200,
  };

  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [far, reachable])).guides,
  ).toEqual({
    horizontal: Option.none,
    vertical: Option.some({ left: 100, top: 94, width: 440, height: 2 }),
  });
});

test("縦横のどちらでも揃うときは、軸ごとに線が 1 本ずつ出る", () => {
  const alongX: CanvasBounds = { left: 104, top: 300, width: 200, height: 20 };
  const alongY: CanvasBounds = { left: 500, top: 95, width: 40, height: 200 };

  const guides = SideSnap.toSnapped(
    SideSnap.create(Moving, [alongX, alongY]),
  ).guides;

  expect([guides.horizontal.some, guides.vertical.some]).toEqual([true, true]);
});

test("線の範囲は、もう一方の軸の寄せも畳んだ位置で決まる", () => {
  const alongX: CanvasBounds = { left: 104, top: 300, width: 200, height: 20 };
  const alongY: CanvasBounds = { left: 500, top: 95, width: 40, height: 200 };

  /*
   * 縦の寄せ（-5）を畳まずに範囲を決めると、縦線の上端が 95 ではなく 100 になる。
   * 横の寄せ（+4）についても同じで、横線の左端が 104 ではなく 100 になる。
   */
  expect(
    SideSnap.toSnapped(SideSnap.create(Moving, [alongX, alongY])).guides,
  ).toEqual({
    horizontal: Option.some({ left: 103, top: 95, width: 2, height: 225 }),
    vertical: Option.some({ left: 104, top: 94, width: 436, height: 2 }),
  });
});
