import { expect, test } from "vitest";
import { CommandKey } from "../CommandKey";

test("⌘ が押されていればコマンドキーの押下として扱う", () => {
  expect(CommandKey.isHeld({ metaKey: true, ctrlKey: false })).toBe(true);
});

test("Ctrl が押されていてもコマンドキーの押下として扱う", () => {
  expect(CommandKey.isHeld({ metaKey: false, ctrlKey: true })).toBe(true);
});

test("どちらも押されていなければコマンドキーの押下ではない", () => {
  expect(CommandKey.isHeld({ metaKey: false, ctrlKey: false })).toBe(false);
});
