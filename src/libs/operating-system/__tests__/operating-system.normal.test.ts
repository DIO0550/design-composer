import { expect, test } from "vitest";
import {
  LinuxNavigatorPlatform,
  MacOsNavigatorPlatform,
  WindowsNavigatorPlatform,
} from "../fake";
import { OperatingSystem, OperatingSystems } from "../index";

test("macOS の webview が返す platform からは macOS と判定する", () => {
  expect(OperatingSystem.fromNavigator(MacOsNavigatorPlatform)).toBe(
    OperatingSystems.MacOs,
  );
});

test("Windows の webview が返す platform からは macOS 以外と判定する", () => {
  expect(OperatingSystem.fromNavigator(WindowsNavigatorPlatform)).toBe(
    OperatingSystems.Other,
  );
});

test("Linux の webview が返す platform からは macOS 以外と判定する", () => {
  expect(OperatingSystem.fromNavigator(LinuxNavigatorPlatform)).toBe(
    OperatingSystems.Other,
  );
});
