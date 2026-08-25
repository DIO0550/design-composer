import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ReorderDrag } from "@/utils/ReorderDrag";

test("掴んだだけでは移動が起きない", () => {
  expect(ReorderDrag.releasedMove(ReorderDrag.grab(1))).toEqual(Option.none);
});

test("別の位置へ入って離すとその位置への移動になる", () => {
  const dragging = ReorderDrag.enter(ReorderDrag.grab(1), 2);

  expect(ReorderDrag.releasedMove(dragging)).toEqual(
    Option.some({ fromIndex: 1, toIndex: 2 }),
  );
});

test("掴んだ位置へ入り直すと移動が起きなくなる", () => {
  const returned = ReorderDrag.enter(
    ReorderDrag.enter(ReorderDrag.grab(1), 2),
    1,
  );

  expect(ReorderDrag.releasedMove(returned)).toEqual(Option.none);
});

test("掴んでいないときに行へ入っても何も起きない", () => {
  const entered = ReorderDrag.enter(ReorderDrag.create(), 2);

  expect(ReorderDrag.releasedMove(entered)).toEqual(Option.none);
});

test("掴んでいる行はそれと分かる", () => {
  expect(ReorderDrag.isHeld(ReorderDrag.grab(1), 1)).toBe(true);
});

/*
 * 運んでいる最中こそ「どれを運んでいるか」が要る。掴んだ直後だけを見ていると、
 * 動き出した瞬間に淡さが消える実装でも通ってしまう。
 */
test("運んでいる間も掴んでいる行はそれと分かる", () => {
  const dragging = ReorderDrag.enter(ReorderDrag.grab(1), 2);

  expect(ReorderDrag.isHeld(dragging, 1)).toBe(true);
});

test("掴んでいない行は掴んでいる行として扱われない", () => {
  expect(ReorderDrag.isHeld(ReorderDrag.grab(1), 2)).toBe(false);
});

test("掴んでいない状態ではどの行も掴まれていない", () => {
  expect(ReorderDrag.isHeld(ReorderDrag.create(), 0)).toBe(false);
});

/*
 * `ArrayEx.moveWithin` は間を詰めるので、前へ動かすと入った行の手前に、
 * 後ろへ動かすと入った行の後ろに落ちる。線を引く側はその向きで決まる。
 */
test("前へ動かしているときは入った行の手前に落ちる", () => {
  const dragging = ReorderDrag.enter(ReorderDrag.grab(2), 0);

  expect(ReorderDrag.dropSideAt(dragging, 0)).toEqual(Option.some("before"));
});

test("後ろへ動かしているときは入った行の後ろに落ちる", () => {
  const dragging = ReorderDrag.enter(ReorderDrag.grab(0), 2);

  expect(ReorderDrag.dropSideAt(dragging, 2)).toEqual(Option.some("after"));
});

test("入っていない行は落ちる先にならない", () => {
  const dragging = ReorderDrag.enter(ReorderDrag.grab(0), 2);

  expect(ReorderDrag.dropSideAt(dragging, 1)).toEqual(Option.none);
});

test("掴んだだけの間はどの行も落ちる先にならない", () => {
  expect(ReorderDrag.dropSideAt(ReorderDrag.grab(0), 0)).toEqual(Option.none);
});
