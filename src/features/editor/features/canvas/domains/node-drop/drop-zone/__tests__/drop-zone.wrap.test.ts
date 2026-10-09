import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { DropZone } from "../index";

/**
 * 幅 300・高さ 130 の親に、80×50 の子が 1 行目に 3 つ、2 行目に 1 つ折り返して並ぶ。
 * 親の内側の余白は 10、行の間は 10 空く（1 行目は y 10〜60、2 行目は y 70〜120）。
 *
 * @param wraps 親が子を折り返すか
 * @returns その配置の落とし先
 */
function setupRowZone(wraps: boolean): DropZone {
  const children: readonly CanvasBounds[] = [
    { left: 10, top: 10, width: 80, height: 50 },
    { left: 90, top: 10, width: 80, height: 50 },
    { left: 170, top: 10, width: 80, height: 50 },
    { left: 10, top: 70, width: 80, height: 50 },
  ];
  return DropZone.create(
    { name: "grid", direction: "row", wraps },
    { left: 0, top: 0, width: 300, height: 130 },
    children,
  );
}

/** `setupRowZone(true)` を縦横入れ替えた、縦並びで 2 列に折り返す親。 */
function setupColumnZone(): DropZone {
  const children: readonly CanvasBounds[] = [
    { left: 10, top: 10, width: 50, height: 80 },
    { left: 10, top: 90, width: 50, height: 80 },
    { left: 10, top: 170, width: 50, height: 80 },
    { left: 70, top: 10, width: 50, height: 80 },
  ];
  return DropZone.create(
    { name: "grid", direction: "column", wraps: true },
    { left: 0, top: 0, width: 130, height: 300 },
    children,
  );
}

/**
 * キャンバスをパンして負の座標にある、折り返す横並びの親。1 行目の 2 つの子の間に非表示の
 * 子（描かれないので実測が `0,0,0,0`）が挟まり、2 行目に子が 1 つある
 * （1 行目は y -190〜-140、2 行目は y -130〜-80）。
 */
function setupPannedZoneWithHiddenChild(): DropZone {
  const children: readonly CanvasBounds[] = [
    { left: 10, top: -190, width: 80, height: 50 },
    { left: 0, top: 0, width: 0, height: 0 },
    { left: 90, top: -190, width: 80, height: 50 },
    { left: 10, top: -130, width: 80, height: 50 },
  ];
  return DropZone.create(
    { name: "grid", direction: "row", wraps: true },
    { left: 0, top: -200, width: 300, height: 130 },
    children,
  );
}

test("折り返した横並びの親では、2 行目の先頭の子の中点より手前で離すと 2 行目の先頭の子の位置になる", () => {
  const target = DropZone.targetAt(setupRowZone(true), { x: 20, y: 90 });

  expect(target.position).toEqual({ parentName: "grid", index: 3 });
});

test("折り返した横並びの親では、1 行目の最後の子の中点より奥で離すと 1 行目の末尾の位置になる", () => {
  const target = DropZone.targetAt(setupRowZone(true), { x: 240, y: 30 });

  expect(target.position).toEqual({ parentName: "grid", index: 3 });
});

test("1 行目の末尾の線は、最後の子の後ろに親の上端から行の境目まで引かれる", () => {
  const target = DropZone.targetAt(setupRowZone(true), { x: 240, y: 30 });

  // 行の境目は 1 行目の下端（60）と 2 行目の上端（70）の中央
  expect(target.marker).toEqual({ left: 249, top: 0, width: 2, height: 65 });
});

test("折り返した横並びの親では、2 行目の最後の子の中点より奥で離すと末尾の位置になる", () => {
  const target = DropZone.targetAt(setupRowZone(true), { x: 200, y: 100 });

  expect(target.position).toEqual({ parentName: "grid", index: 4 });
});

test("末尾の行の線は、行の境目から親の下端まで引かれる", () => {
  const target = DropZone.targetAt(setupRowZone(true), { x: 200, y: 100 });

  expect(target.marker).toEqual({ left: 89, top: 65, width: 2, height: 65 });
});

test("行の間の隙間では、境目より上で離すと前の行に落ちる", () => {
  const target = DropZone.targetAt(setupRowZone(true), { x: 240, y: 64 });

  expect(target.position).toEqual({ parentName: "grid", index: 3 });
});

test("行の間の隙間では、境目を越えて離すと次の行に落ちる", () => {
  const target = DropZone.targetAt(setupRowZone(true), { x: 240, y: 66 });

  expect(target.position).toEqual({ parentName: "grid", index: 4 });
});

test("折り返した縦並びの親では、2 列目の先頭の子の中点より上で離すと 2 列目の先頭の子の位置になる", () => {
  const target = DropZone.targetAt(setupColumnZone(), { x: 90, y: 20 });

  expect(target.position).toEqual({ parentName: "grid", index: 3 });
});

test("折り返した縦並びの親では、2 列目の線は列の境目から親の右端まで横向きに引かれる", () => {
  const target = DropZone.targetAt(setupColumnZone(), { x: 90, y: 20 });

  expect(target.marker).toEqual({ left: 65, top: 9, width: 65, height: 2 });
});

test("折り返した縦並びの親では、1 列目の最後の子の中点より下で離すと 1 列目の末尾の位置になる", () => {
  const target = DropZone.targetAt(setupColumnZone(), { x: 30, y: 240 });

  expect(target.position).toEqual({ parentName: "grid", index: 3 });
});

test("折り返した縦並びの親では、1 列目の末尾の線は親の左端から列の境目まで引かれる", () => {
  const target = DropZone.targetAt(setupColumnZone(), { x: 30, y: 240 });

  expect(target.marker).toEqual({ left: 0, top: 249, width: 65, height: 2 });
});

test("折り返さない親では、子が行をまたいで見える配置でも 1 行として扱い、線は親の高さいっぱいに引かれる", () => {
  const target = DropZone.targetAt(setupRowZone(false), { x: 20, y: 90 });

  expect(target.marker).toEqual({ left: 9, top: 0, width: 2, height: 130 });
});

test("親が負の座標にあっても、非表示の子で行が割れない", () => {
  const target = DropZone.targetAt(setupPannedZoneWithHiddenChild(), {
    x: 160,
    y: -170,
  });

  // 1 行目の 3 つ（非表示の子を含む）の中点をすべて越えている
  expect(target.position).toEqual({ parentName: "grid", index: 3 });
});

test("非表示の子は行の境目の位置を動かさない", () => {
  // 境目は 1 行目の下端（-140）と 2 行目の上端（-130）の中央（-135）
  const target = DropZone.targetAt(setupPannedZoneWithHiddenChild(), {
    x: 20,
    y: -110,
  });

  expect(target.position).toEqual({ parentName: "grid", index: 3 });
});

test("隣の子の外接矩形が前の子へはみ出していても、交差軸で前の子より先へ進んでいなければ同じ行として扱う", () => {
  // 2 つ目の子は回転して外接矩形が 1 つ目の右端（90）と上端（10）の外へ 5 ずつはみ出している
  const zone = DropZone.create(
    { name: "grid", direction: "row", wraps: true },
    { left: 0, top: 0, width: 300, height: 130 },
    [
      { left: 10, top: 10, width: 80, height: 50 },
      { left: 85, top: 5, width: 90, height: 60 },
    ],
  );

  const target = DropZone.targetAt(zone, { x: 150, y: 30 });

  expect(target.position).toEqual({ parentName: "grid", index: 2 });
});

test("行の中に非表示の子があっても、線は見えている隣り合う子の隙間に引かれる", () => {
  // 1 つ目の子（10〜90）と 3 つ目の子（90〜170）の間。非表示の子の端（0）は使わない
  const target = DropZone.targetAt(setupPannedZoneWithHiddenChild(), {
    x: 60,
    y: -170,
  });

  expect(target.marker.left).toBe(89);
});

test("行の末尾に非表示の子があっても、線は見えている最後の子の後ろに引かれる", () => {
  const zone = DropZone.create(
    { name: "grid", direction: "row", wraps: true },
    { left: 0, top: 0, width: 300, height: 130 },
    [
      { left: 10, top: 10, width: 80, height: 50 },
      { left: 90, top: 10, width: 80, height: 50 },
      { left: 0, top: 0, width: 0, height: 0 },
      { left: 10, top: 70, width: 80, height: 50 },
    ],
  );

  const target = DropZone.targetAt(zone, { x: 240, y: 30 });

  expect(target.marker.left).toBe(169);
});

test("折り返さない親では、非表示の子も今までどおり並びの位置に数える", () => {
  const zone = DropZone.create(
    { name: "row", direction: "row", wraps: false },
    { left: 0, top: 0, width: 300, height: 70 },
    [
      { left: 10, top: 10, width: 80, height: 50 },
      { left: 90, top: 10, width: 80, height: 50 },
      { left: 0, top: 0, width: 0, height: 0 },
    ],
  );

  // 末尾の非表示の子（中点 0）も越えたものとして数える
  const target = DropZone.targetAt(zone, { x: 200, y: 30 });

  expect(target.position).toEqual({ parentName: "row", index: 3 });
});

test("行の間に隙間が無くても、前の行の下端から始まる子を次の行の先頭として扱う", () => {
  const zone = DropZone.create(
    { name: "grid", direction: "row", wraps: true },
    { left: 0, top: 0, width: 200, height: 100 },
    [
      { left: 0, top: 0, width: 100, height: 50 },
      { left: 100, top: 0, width: 100, height: 50 },
      { left: 0, top: 50, width: 100, height: 50 },
    ],
  );

  const target = DropZone.targetAt(zone, { x: 10, y: 80 });

  expect(target.position).toEqual({ parentName: "grid", index: 2 });
});

test("同じ行で上端が前の子より下にずれた子（中央揃えなど）も同じ行として扱う", () => {
  const zone = DropZone.create(
    { name: "grid", direction: "row", wraps: true },
    { left: 0, top: 0, width: 200, height: 160 },
    [
      { left: 0, top: 0, width: 100, height: 100 },
      { left: 100, top: 25, width: 100, height: 50 },
      { left: 0, top: 110, width: 100, height: 50 },
    ],
  );

  const target = DropZone.targetAt(zone, { x: 160, y: 50 });

  expect(target.position).toEqual({ parentName: "grid", index: 2 });
});

test("行の境目は、行でいちばん背の高い子の下端から測る", () => {
  // 1 行目の下端は 2 つ目の子の 100。境目は 2 行目の上端 110 との中央の 105
  const zone = DropZone.create(
    { name: "grid", direction: "row", wraps: true },
    { left: 0, top: 0, width: 200, height: 160 },
    [
      { left: 0, top: 0, width: 100, height: 50 },
      { left: 100, top: 0, width: 100, height: 100 },
      { left: 0, top: 110, width: 100, height: 50 },
    ],
  );

  const target = DropZone.targetAt(zone, { x: 190, y: 90 });

  expect(target.position).toEqual({ parentName: "grid", index: 2 });
});

test("折り返す親に子がいなければ、最初の子の位置になる", () => {
  const zone = DropZone.create(
    { name: "grid", direction: "row", wraps: true },
    { left: 10, top: 20, width: 100, height: 100 },
    [],
  );

  const target = DropZone.targetAt(zone, { x: 50, y: 90 });

  expect(target.position).toEqual({ parentName: "grid", index: 0 });
});

test("折り返す親に子がいなければ、線は親の内側の先頭に親の高さいっぱいで引かれる", () => {
  const zone = DropZone.create(
    { name: "grid", direction: "row", wraps: true },
    { left: 10, top: 20, width: 100, height: 100 },
    [],
  );

  const target = DropZone.targetAt(zone, { x: 50, y: 90 });

  expect(target.marker).toEqual({ left: 9, top: 20, width: 2, height: 100 });
});
