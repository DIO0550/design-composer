import { expect, test } from "vitest";
import { LinuxNavigator, MacOsNavigator, WindowsNavigator } from "../fake";
import { OperatingSystem, OperatingSystems } from "../index";

test("macOS の webview が返す platform からは macOS と判定する", () => {
  expect(OperatingSystem.fromNavigator(MacOsNavigator)).toBe(
    OperatingSystems.MacOs,
  );
});

test("Windows の webview が返す platform からは macOS 以外と判定する", () => {
  expect(OperatingSystem.fromNavigator(WindowsNavigator)).toBe(
    OperatingSystems.Other,
  );
});

test("Linux の webview が返す platform からは macOS 以外と判定する", () => {
  expect(OperatingSystem.fromNavigator(LinuxNavigator)).toBe(
    OperatingSystems.Other,
  );
});
