import { expect, test } from "vitest";
import { type CanvasBounds, type DropParent, DropZone } from "../index";

/** 高さ 100 の子が縦に3つ並ぶ、高さ 300 の親。 */
function setupColumnZone(): DropZone {
  const parent: DropParent = { name: "body", direction: "column" };
  const children: readonly CanvasBounds[] = [
    { left: 0, top: 0, width: 100, height: 100 },
    { left: 0, top: 100, width: 100, height: 100 },
    { left: 0, top: 200, width: 100, height: 100 },
  ];
  return DropZone.create(
    parent,
    { left: 0, top: 0, width: 100, height: 300 },
    children,
  );
}

/** 幅 100 の子が横に3つ並ぶ、幅 300 の親。 */
function setupRowZone(): DropZone {
  const parent: DropParent = { name: "row", direction: "row" };
  const children: readonly CanvasBounds[] = [
    { left: 0, top: 0, width: 100, height: 100 },
    { left: 100, top: 0, width: 100, height: 100 },
    { left: 200, top: 0, width: 100, height: 100 },
  ];
  return DropZone.create(
    parent,
    { left: 0, top: 0, width: 300, height: 100 },
    children,
  );
}

test("縦に並ぶ親では、先頭の子の中点より上で離すと先頭の子になる", () => {
  const target = DropZone.targetAt(setupColumnZone(), { x: 50, y: 10 });

  expect(target.position).toEqual({ parentName: "body", index: 0 });
});

test("縦に並ぶ親では、子の中点を越えるたびに1つ後ろの位置になる", () => {
  const target = DropZone.targetAt(setupColumnZone(), { x: 50, y: 120 });

  expect(target.position).toEqual({ parentName: "body", index: 1 });
});

test("縦に並ぶ親では、最後の子の中点より下で離すと末尾の位置になる", () => {
  const target = DropZone.targetAt(setupColumnZone(), { x: 50, y: 260 });

  expect(target.position).toEqual({ parentName: "body", index: 3 });
});

test("横に並ぶ親では、位置は上下ではなく左右で決まる", () => {
  const target = DropZone.targetAt(setupRowZone(), { x: 160, y: 90 });

  expect(target.position).toEqual({ parentName: "row", index: 2 });
});

test("子がいない親ではどこで離しても最初の子の位置になる", () => {
  const zone = DropZone.create(
    { name: "empty", direction: "column" },
    { left: 10, top: 20, width: 100, height: 100 },
    [],
  );

  const target = DropZone.targetAt(zone, { x: 50, y: 90 });

  expect(target.position).toEqual({ parentName: "empty", index: 0 });
});

test("縦に並ぶ親では、挿入位置の線は親の幅いっぱいに横向きで引かれる", () => {
  const target = DropZone.targetAt(setupColumnZone(), { x: 50, y: 120 });

  // 先頭の子の下端（100）と2番目の子の上端（100）の中央
  expect(target.marker).toEqual({
    left: 0,
    top: 99,
    width: 100,
    height: 2,
  });
});

test("横に並ぶ親では、挿入位置の線は親の高さいっぱいに縦向きで引かれる", () => {
  const target = DropZone.targetAt(setupRowZone(), { x: 160, y: 90 });

  expect(target.marker).toEqual({
    left: 199,
    top: 0,
    width: 2,
    height: 100,
  });
});

test("先頭の位置では、線は先頭の子の手前に引かれる", () => {
  const target = DropZone.targetAt(setupColumnZone(), { x: 50, y: 10 });

  expect(target.marker.top).toBe(-1);
});

test("末尾の位置では、線は最後の子の後ろに引かれる", () => {
  const target = DropZone.targetAt(setupColumnZone(), { x: 50, y: 260 });

  expect(target.marker.top).toBe(299);
});

test("子がいない親では、線は親の内側の先頭に引かれる", () => {
  const zone = DropZone.create(
    { name: "empty", direction: "column" },
    { left: 10, top: 20, width: 100, height: 100 },
    [],
  );

  const target = DropZone.targetAt(zone, { x: 50, y: 90 });

  expect(target.marker).toEqual({ left: 10, top: 19, width: 100, height: 2 });
});
