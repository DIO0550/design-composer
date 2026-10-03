import { expect, test } from "vitest";
import { SidePairs } from "@/domains/unit/side";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { Option } from "@/utils/Option";
import { SideSnap, type SnapGuides } from "../index";
import { Moving } from "./moving-bounds";

/*
 * 揃え先との隙間に引く短い線（docs/06-ui.md「キャンバス直接操作」の辺のスナップ）。
 * 短い線も太さのぶんを中心で振り分けるので、位置は重なる範囲の中央より 1 小さくなる。
 */

test("揃え先のほうが狭いとき、縦の隙間の短い線は揃え先と向かい合う範囲の中央に出る", () => {
  /*
   * 左辺どうしが揃い、横に向かい合う範囲は揃え先の幅（104〜124）。中央は 114。
   * 寄せたあとの運んでいるもの（104〜144）の中央で引く実装だと 124 になる。
   */
  const stationary: CanvasBounds = {
    left: 104,
    top: 300,
    width: 20,
    height: 20,
  };

  expect(
    Option.unwrap(
      SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).guides
        .horizontal,
    ).gapLine,
  ).toEqual(Option.some({ left: 113, top: 120, width: 2, height: 180 }));
});

test("揃え先が上に離れているとき、隙間は揃え先の下辺から運んでいるものの上辺まで", () => {
  const stationary: CanvasBounds = {
    left: 104,
    top: 20,
    width: 200,
    height: 30,
  };

  expect(
    Option.unwrap(
      SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).guides
        .horizontal,
    ).gapLine,
  ).toEqual(Option.some({ left: 123, top: 50, width: 2, height: 50 }));
});

test("運んでいるものの左辺が揃え先の右辺と揃うとき、短い線はガイド線と同じ位置に出る", () => {
  // 横に向かい合う範囲は揃った線（97）の上の 1 点だけになる
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
    ).gapLine,
  ).toEqual(Option.some({ left: 96, top: 120, width: 2, height: 180 }));
});

test("上辺どうしが揃い、揃え先が右に離れているとき、横の隙間に短い線が出る", () => {
  // 縦に向かい合う範囲は運んでいるものの高さ（104〜124）。幅と高さを取り違えると縦線になる
  const stationary: CanvasBounds = {
    left: 300,
    top: 104,
    width: 20,
    height: 200,
  };

  expect(
    Option.unwrap(
      SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).guides.vertical,
    ).gapLine,
  ).toEqual(Option.some({ left: 140, top: 113, width: 160, height: 2 }));
});

test("中心線で揃ったときも、隙間は揃え先との間に出る", () => {
  // 揃え先の横の中心は 123。辺どうしはどの組も届かない
  const stationary: CanvasBounds = {
    left: 63,
    top: 300,
    width: 120,
    height: 20,
  };

  expect(
    Option.unwrap(
      SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).guides
        .horizontal,
    ).gapLine,
  ).toEqual(Option.some({ left: 122, top: 120, width: 2, height: 180 }));
});

test("揃え先と縦に重なっているときは、ガイド線は出るが隙間は出ない", () => {
  // 揃え先は縦に 110〜310 で、運んでいるもの（100〜120）と重なる
  const stationary: CanvasBounds = {
    left: 104,
    top: 110,
    width: 200,
    height: 200,
  };

  expect(
    Option.unwrap(
      SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).guides
        .horizontal,
    ).gapLine,
  ).toEqual(Option.none);
});

test("揃え先と辺が接しているときは、隙間は出ない", () => {
  // 揃え先の上辺（120）が運んでいるものの下辺に接する。長さ 0 の隙間を出す実装なら落ちる
  const stationary: CanvasBounds = {
    left: 104,
    top: 120,
    width: 200,
    height: 20,
  };

  expect(
    Option.unwrap(
      SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).guides
        .horizontal,
    ).gapLine,
  ).toEqual(Option.none);
});

test("揃え先が運んでいるものを内側に含むときは、隙間は出ない", () => {
  // 落とし先の親の縁に揃ったときに当たる
  const stationary: CanvasBounds = {
    left: 104,
    top: 50,
    width: 300,
    height: 300,
  };

  expect(
    Option.unwrap(
      SideSnap.toSnapped(SideSnap.create(Moving, [stationary])).guides
        .horizontal,
    ).gapLine,
  ).toEqual(Option.none);
});

test("隙間は、もう一方の軸の寄せも畳んだ位置で測る", () => {
  /*
   * 縦の寄せ（-5）で運んでいるものの下辺は 115 になる。畳まずに測ると隙間は 120 から
   * 始まり、長さは 185 ではなく 180 になる。
   */
  const alongX: CanvasBounds = { left: 104, top: 300, width: 200, height: 20 };
  const alongY: CanvasBounds = { left: 500, top: 95, width: 40, height: 200 };

  expect(
    Option.unwrap(
      SideSnap.toSnapped(SideSnap.create(Moving, [alongX, alongY])).guides
        .horizontal,
    ).gapLine,
  ).toEqual(Option.some({ left: 123, top: 115, width: 2, height: 185 }));
});

test("倍率と実測に端数があっても、外側で辺が揃えば隙間は出る", () => {
  /*
   * 運んでいるものの右辺（約 105.10）が揃え先の左辺（約 103.16）へ寄る。この入力では
   * 寄せたあとの右辺を `left + width` で作り直すと揃え先の左辺より 1 ULP 外へ出るので、
   * 重なりの有無を判定してから短い線を置く実装だと隙間が消える。
   */
  const stationary: CanvasBounds = {
    left: 103.15566384916552,
    top: 0,
    width: 66.20736787884023,
    height: 20,
  };
  const moving: CanvasBounds = {
    left: 51.62436762892905,
    top: 100,
    width: 53.47880232992268,
    height: 20,
  };

  expect(
    Option.isSome(
      Option.unwrap(
        SideSnap.toSnapped(SideSnap.create(moving, [stationary])).guides
          .horizontal,
      ).gapLine,
    ),
  ).toBe(true);
});

test("左右の辺が揃った軸の隙間の数値は、短い線の高さを倍率で割り戻したもの", () => {
  // 線の太さ（2）で測る実装なら 1、割り戻さない実装なら 180 になる
  const guides: SnapGuides = {
    horizontal: Option.some({
      guideLine: { left: 103, top: 100, width: 2, height: 220 },
      gapLine: Option.some({ left: 113, top: 120, width: 2, height: 180 }),
    }),
    vertical: Option.none,
  };

  expect(
    Option.unwrap(
      SideSnap.toGapReadout(guides, SidePairs.Horizontal, {
        ...CanvasView.create(),
        scale: 2,
      }),
    ).length,
  ).toBe(90);
});

test("上下の辺が揃った軸の隙間の数値は、短い線の幅", () => {
  const guides: SnapGuides = {
    horizontal: Option.none,
    vertical: Option.some({
      guideLine: { left: 100, top: 103, width: 220, height: 2 },
      gapLine: Option.some({ left: 140, top: 113, width: 160, height: 2 }),
    }),
  };

  expect(
    Option.unwrap(
      SideSnap.toGapReadout(guides, SidePairs.Vertical, CanvasView.create()),
    ).length,
  ).toBe(160);
});

test("ドキュメント上の px へ丸めると 0 になる隙間は、数値を出さない", () => {
  // 画面上は 0.4 離れているので短い線はある。丸めた 0 をそのまま出す実装なら落ちる
  const guides: SnapGuides = {
    horizontal: Option.some({
      guideLine: { left: 103, top: 100, width: 2, height: 220 },
      gapLine: Option.some({ left: 113, top: 120, width: 2, height: 0.4 }),
    }),
    vertical: Option.none,
  };

  expect(
    SideSnap.toGapReadout(guides, SidePairs.Horizontal, CanvasView.create()),
  ).toEqual(Option.none);
});

test("隙間の数値は、割り戻して端数が出ても最も近い整数で出る", () => {
  // 100 / 1.5 = 66.67。丸めずに出す実装なら 66.666… が出る
  const guides: SnapGuides = {
    horizontal: Option.some({
      guideLine: { left: 103, top: 100, width: 2, height: 220 },
      gapLine: Option.some({ left: 113, top: 120, width: 2, height: 100 }),
    }),
    vertical: Option.none,
  };

  expect(
    Option.unwrap(
      SideSnap.toGapReadout(guides, SidePairs.Horizontal, {
        ...CanvasView.create(),
        scale: 1.5,
      }),
    ).length,
  ).toBe(67);
});
