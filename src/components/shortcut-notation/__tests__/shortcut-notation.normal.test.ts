import { expect, test } from "vitest";
import { ShortcutNotation } from "@/components/shortcut-notation";
import { OperatingSystem } from "@/libs/operating-system";
import {
  LinuxNavigatorPlatform,
  MacOsNavigatorPlatform,
  WindowsNavigatorPlatform,
} from "@/libs/operating-system/fake";

const MacOs = OperatingSystem.fromNavigator(MacOsNavigatorPlatform);
const Windows = OperatingSystem.fromNavigator(WindowsNavigatorPlatform);
const Linux = OperatingSystem.fromNavigator(LinuxNavigatorPlatform);

test("macOS で動いているとき、コマンドキー付きの割り当ては ⌘C と綴る", () => {
  expect(
    ShortcutNotation.toText(
      { kind: "command", key: "C", withShiftKey: false },
      MacOs,
    ),
  ).toBe("⌘C");
});

test("macOS で動いているとき、Shift とコマンドキー付きの割り当ては Shift+⌘G と綴る", () => {
  expect(
    ShortcutNotation.toText(
      { kind: "command", key: "G", withShiftKey: true },
      MacOs,
    ),
  ).toBe("Shift+⌘G");
});

test("Windows で動いているとき、コマンドキー付きの割り当ては Ctrl+C と綴る", () => {
  expect(
    ShortcutNotation.toText(
      { kind: "command", key: "C", withShiftKey: false },
      Windows,
    ),
  ).toBe("Ctrl+C");
});

test("Linux で動いているとき、コマンドキー付きの割り当ては Ctrl+C と綴る", () => {
  expect(
    ShortcutNotation.toText(
      { kind: "command", key: "C", withShiftKey: false },
      Linux,
    ),
  ).toBe("Ctrl+C");
});

test("Windows・Linux で動いているとき、Shift とコマンドキー付きの割り当ては Ctrl を先にして Ctrl+Shift+G と綴る", () => {
  expect(
    ShortcutNotation.toText(
      { kind: "command", key: "G", withShiftKey: true },
      Windows,
    ),
  ).toBe("Ctrl+Shift+G");
});

test("修飾の無い割り当ては、macOS でもキーの綴りのまま出る", () => {
  expect(ShortcutNotation.toText({ kind: "plain", key: "Delete" }, MacOs)).toBe(
    "Delete",
  );
});

test("修飾の無い割り当ては、Windows でもキーの綴りのまま出る", () => {
  expect(
    ShortcutNotation.toText({ kind: "plain", key: "Delete" }, Windows),
  ).toBe("Delete");
});
