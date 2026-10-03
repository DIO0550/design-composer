import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { RangeSelectDrag } from "..";

test("範囲を引いてから離すと、直後の click を飲み込む", () => {
  const drawn = RangeSelectDrag.extendedTo(
    RangeSelectDrag.grab({ x: 100, y: 60 }),
    { x: 180, y: 110 },
  );

  expect(RangeSelectDrag.consumesClick(RangeSelectDrag.release(drawn))).toBe(
    true,
  );
});

test("閾値を超えずに離すと、直後の click を飲み込まない", () => {
  // 1px は閾値（4px）未満なので、押して離しただけのクリックとして扱う
  const trembled = RangeSelectDrag.extendedTo(
    RangeSelectDrag.grab({ x: 100, y: 60 }),
    { x: 101, y: 60 },
  );

  expect(RangeSelectDrag.consumesClick(RangeSelectDrag.release(trembled))).toBe(
    false,
  );
});

test("一度引いたあと掴んだ点まで戻して離しても、直後の click を飲み込む", () => {
  /*
   * 戻した結果の「何も入らない」は選択へ反映されているので、そのあとの click で
   * artboard を選び直すと、縮めて空にした選択が上書きされる。
   */
  const pressed = RangeSelectDrag.grab({ x: 100, y: 60 });
  const returned = RangeSelectDrag.extendedTo(
    RangeSelectDrag.extendedTo(pressed, { x: 180, y: 110 }),
    { x: 100, y: 60 },
  );

  expect(RangeSelectDrag.consumesClick(RangeSelectDrag.release(returned))).toBe(
    true,
  );
});

test("引いている途中でやめると、範囲を持たなくなる", () => {
  const drawing = RangeSelectDrag.extendedTo(
    RangeSelectDrag.grab({ x: 100, y: 60 }),
    { x: 180, y: 110 },
  );

  expect(RangeSelectDrag.range(RangeSelectDrag.stopDrawing(drawing))).toEqual(
    Option.none,
  );
});

test("離したあとにやめても、直後の click は飲み込む", () => {
  // 捕捉は離したあとにも外れるので、そこで飲み込み待ちが消えると引いた直後の click が通る
  const released = RangeSelectDrag.release(
    RangeSelectDrag.extendedTo(RangeSelectDrag.grab({ x: 100, y: 60 }), {
      x: 180,
      y: 110,
    }),
  );

  expect(
    RangeSelectDrag.consumesClick(RangeSelectDrag.stopDrawing(released)),
  ).toBe(true);
});
