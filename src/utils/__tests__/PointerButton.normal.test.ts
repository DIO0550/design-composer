import { expect, test } from "vitest";
import { PointerButton, PointerButtons } from "../PointerButton";

test("主ボタンで押された操作は主ボタンの押下として扱う", () => {
  expect(PointerButton.isPrimary({ button: PointerButtons.Primary })).toBe(
    true,
  );
});

test("中ボタンで押された操作は主ボタンの押下ではない", () => {
  expect(PointerButton.isPrimary({ button: PointerButtons.Middle })).toBe(
    false,
  );
});

test("中ボタンで押された操作は中ボタンの押下として扱う", () => {
  expect(PointerButton.isMiddle({ button: PointerButtons.Middle })).toBe(true);
});

test("副ボタンで押された操作は主ボタンでも中ボタンでもない", () => {
  expect([
    PointerButton.isPrimary({ button: PointerButtons.Secondary }),
    PointerButton.isMiddle({ button: PointerButtons.Secondary }),
  ]).toEqual([false, false]);
});
