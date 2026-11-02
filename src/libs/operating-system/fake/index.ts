import type { NavigatorPlatform } from "../index";

/*
 * 各 OS の webview が返す `navigator.platform` の綴り（MDN「Navigator: platform property」）。
 */

/** macOS の webview。 */
export const MacOsNavigatorPlatform: NavigatorPlatform = {
  platform: "MacIntel",
};

/** Windows の webview。 */
export const WindowsNavigatorPlatform: NavigatorPlatform = {
  platform: "Win32",
};

/** Linux の webview。 */
export const LinuxNavigatorPlatform: NavigatorPlatform = {
  platform: "Linux x86_64",
};
