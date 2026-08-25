import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ReorderDrag } from "@/utils/ReorderDrag";

test("掴んだだけでは落ちる先を持たない", () => {
  expect(ReorderDrag.release(ReorderDrag.hold(1))).toEqual(Option.none);
});

test("別の位置へ入って離すとその位置への移動になる", () => {
  const dragging = ReorderDrag.enter(ReorderDrag.hold(1), 2);

  expect(ReorderDrag.release(dragging)).toEqual(
    Option.some({ fromIndex: 1, toIndex: 2 }),
  );
});

test("掴んだ位置へ入り直すと落ちる先が無くなる", () => {
  const returned = ReorderDrag.enter(
    ReorderDrag.enter(ReorderDrag.hold(1), 2),
    1,
  );

  expect(ReorderDrag.release(returned)).toEqual(Option.none);
});

test("掴んでいないときに行へ入っても何も起きない", () => {
  const entered = ReorderDrag.enter(ReorderDrag.create(), 2);

  expect(ReorderDrag.release(entered)).toEqual(Option.none);
});

test("取り消すと掴んでいない状態へ戻る", () => {
  expect(ReorderDrag.release(ReorderDrag.cancel())).toEqual(Option.none);
});

test("掴んでいる行はそれと分かる", () => {
  expect(ReorderDrag.isHeld(ReorderDrag.hold(1), 1)).toBe(true);
});

test("掴んでいない行は掴んでいる行として扱われない", () => {
  expect(ReorderDrag.isHeld(ReorderDrag.hold(1), 2)).toBe(false);
});

test("動かしている間は入った行が落ちる先になる", () => {
  const dragging = ReorderDrag.enter(ReorderDrag.hold(1), 2);

  expect(ReorderDrag.isDropTarget(dragging, 2)).toBe(true);
});

test("掴んだだけの間はどの行も落ちる先にならない", () => {
  expect(ReorderDrag.isDropTarget(ReorderDrag.hold(1), 1)).toBe(false);
});

/*
 * `ArrayEx.moveWithin` は間を詰めるので、前へ動かすと入った行の手前に、
 * 後ろへ動かすと入った行の後ろに落ちる。線を引く側はその向きで決まる。
 */
test("前へ動かしているときは入った行の手前に落ちる", () => {
  const dragging = ReorderDrag.enter(ReorderDrag.hold(2), 0);

  expect(ReorderDrag.dropSide(dragging)).toEqual(Option.some("before"));
});

test("後ろへ動かしているときは入った行の後ろに落ちる", () => {
  const dragging = ReorderDrag.enter(ReorderDrag.hold(0), 2);

  expect(ReorderDrag.dropSide(dragging)).toEqual(Option.some("after"));
});

test("動かしていない間はどちら側かが決まらない", () => {
  expect(ReorderDrag.dropSide(ReorderDrag.hold(0))).toEqual(Option.none);
});
