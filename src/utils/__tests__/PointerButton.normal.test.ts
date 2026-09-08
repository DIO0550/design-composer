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

test("割り当てのない副ボタンはどちらの押下でもない", () => {
  const secondaryButton = 2;

  expect(PointerButton.isPrimary({ button: secondaryButton })).toBe(false);
  expect(PointerButton.isMiddle({ button: secondaryButton })).toBe(false);
});
