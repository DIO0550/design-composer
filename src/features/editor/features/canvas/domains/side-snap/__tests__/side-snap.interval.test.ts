import { expect, test } from "vitest";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { Option } from "@/utils/Option";
import { SideSnap } from "../index";

/** 横に間隔 20 で並ぶ兄弟（左右 0〜40 と 60〜100、上下はどちらも 0〜20）。 */
const HorizontalRow: readonly CanvasBounds[] = [
  { left: 0, top: 0, width: 40, height: 20 },
  { left: 60, top: 0, width: 40, height: 20 },
];

/**
 * 列の右端（100）から 20 先の 120 の 3px 手前に左辺がある、運んでいるもの。
 * 横に 3 寄れば列の間隔に揃う。縦は中心線（10）が列の中心線と重なっている。
 */
const NearRowEnd: CanvasBounds = { left: 117, top: 5, width: 30, height: 10 };

/**
 * 左辺の位置だけで横の寄せ先を決める揃え先。縦は遠いので、横の判定にだけ効く。
 *
 * @param left 左辺の位置
 * @returns 左辺がその位置にある、列から縦に離れた矩形
 */
function edgeAt(left: number): CanvasBounds {
  return { left, top: 300, width: 200, height: 20 };
}

test("兄弟の列の端から同じ間隔になる位置の近くにあると、その位置へ寄る", () => {
  const snap = SideSnap.withSiblings(
    SideSnap.create(NearRowEnd, []),
    HorizontalRow,
  );

  expect(SideSnap.toSnapped(snap).offset).toEqual({ x: 3, y: 0 });
});

test("兄弟を渡さず揃え先として並べただけでは、列の間隔には寄らない", () => {
  // 同じ矩形を兄弟として渡せば 3 寄る（上のテスト）。辺も中心線も横には 6 より遠い
  const snap = SideSnap.create(NearRowEnd, HorizontalRow);

  expect(SideSnap.toSnapped(snap).offset.x).toBe(0);
});

test("兄弟の辺にも揃う", () => {
  // 左辺 103 が列の右端（100）の 3px 先。列の間隔の位置（120）は 17 離れていて届かない
  const moving: CanvasBounds = { left: 103, top: 5, width: 30, height: 10 };
  const snap = SideSnap.withSiblings(
    SideSnap.create(moving, []),
    HorizontalRow,
  );

  expect(SideSnap.toSnapped(snap).offset.x).toBe(-3);
});

test("列の間隔の位置のほうが辺より近ければ、列の間隔へ寄る", () => {
  // 揃え先の左辺 122 とは 5 離れている（列の間隔の位置とは 3）
  const snap = SideSnap.withSiblings(
    SideSnap.create(NearRowEnd, [edgeAt(122)]),
    HorizontalRow,
  );

  expect(SideSnap.toSnapped(snap).offset.x).toBe(3);
});

test("辺のほうが列の間隔の位置より近ければ、辺へ寄る", () => {
  // 揃え先の左辺 118 とは 1 離れている（列の間隔の位置とは 3）
  const snap = SideSnap.withSiblings(
    SideSnap.create(NearRowEnd, [edgeAt(118)]),
    HorizontalRow,
  );

  expect(SideSnap.toSnapped(snap).offset.x).toBe(1);
});

test("辺と列の間隔の位置が同じ距離なら、辺へ寄る", () => {
  // 揃え先の左辺 114 は左へ 3、列の間隔の位置は右へ 3。どちらへ寄ったかが向きで分かる
  const snap = SideSnap.withSiblings(
    SideSnap.create(NearRowEnd, [edgeAt(114)]),
    HorizontalRow,
  );

  expect(SideSnap.toSnapped(snap).offset.x).toBe(-3);
});

test("縦に並ぶ兄弟の列でも、列の端から同じ間隔になる位置へ寄る", () => {
  const column: readonly CanvasBounds[] = [
    { left: 0, top: 0, width: 20, height: 40 },
    { left: 0, top: 60, width: 20, height: 40 },
  ];
  // 上辺 117 が列の下端（100）から 20 先の 120 の 3px 手前。横は中心線（10）が揃っている
  const moving: CanvasBounds = { left: 5, top: 117, width: 10, height: 30 };
  const snap = SideSnap.withSiblings(SideSnap.create(moving, []), column);

  expect(SideSnap.toSnapped(snap).offset).toEqual({ x: 0, y: 3 });
});

test("列の間隔へ寄った軸にはガイド線が出ない", () => {
  const snap = SideSnap.withSiblings(
    SideSnap.create(NearRowEnd, []),
    HorizontalRow,
  );

  expect(SideSnap.toSnapped(snap).guides.horizontal).toEqual(Option.none);
});

test("列の間隔へ寄った軸と別の軸が辺か中心線に揃えば、そちらの軸にはガイド線が出る", () => {
  // 縦は中心線どうし（10）が揃っている
  const snap = SideSnap.withSiblings(
    SideSnap.create(NearRowEnd, []),
    HorizontalRow,
  );

  expect(Option.isSome(SideSnap.toSnapped(snap).guides.vertical)).toBe(true);
});
