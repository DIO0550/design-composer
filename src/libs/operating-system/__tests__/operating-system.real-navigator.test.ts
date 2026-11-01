import { afterEach, expect, test } from "vitest";
import { MacOsNavigatorPlatform, WindowsNavigatorPlatform } from "../fake";
import { OperatingSystem, OperatingSystems } from "../index";

/*
 * 引数を省いたときに実物の `navigator` を読むことを確かめる。`navigator` はプロセス外の
 * 境界なので、`platform` だけをテストの中で差し替え、終わったら外して元の値へ戻す。
 */

function replaceNavigatorPlatform(platform: string): void {
  Object.defineProperty(navigator, "platform", {
    value: platform,
    configurable: true,
  });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "platform");
});

test("引数を省くと、実物の navigator が macOS の platform を返すとき macOS と判定する", () => {
  replaceNavigatorPlatform(MacOsNavigatorPlatform.platform);

  expect(OperatingSystem.fromNavigator()).toBe(OperatingSystems.MacOs);
});

test("引数を省くと、実物の navigator が Windows の platform を返すとき macOS 以外と判定する", () => {
  replaceNavigatorPlatform(WindowsNavigatorPlatform.platform);

  expect(OperatingSystem.fromNavigator()).toBe(OperatingSystems.Other);
});
