import type { ValueOf } from "@/types/ValueOf";

/**
 * 割り当ての綴りを分ける単位での、アプリが動いている OS。
 *
 * Linux も Windows と同じ `Other` に入れる。どちらも割り当ての綴りが `Ctrl` 側で同じで、
 * 2 つを区別して使う側が無い。
 * `libs/` に置くのは、この値に付く規則が外部の値（`navigator.platform`）の解釈だけだから。
 */
export const OperatingSystems = {
  MacOs: "mac-os",
  Other: "other",
} as const;

/** アプリが動いている OS（`OperatingSystems` のどれか）。 */
export type OperatingSystem = ValueOf<typeof OperatingSystems>;

/** OS の判定に使う、`navigator` のうちの 1 項目。 */
export type NavigatorPlatform = Readonly<{ platform: string }>;

/** 動いている OS の判定。 */
export const OperatingSystem = {
  /**
   * `navigator.platform` から、動いている OS を判定する。
   *
   * `navigator.platform` は lib.dom で `@deprecated` だが使う。代わりの `userAgentData` は
   * lib.dom に型が無く、WebKit 系の webview（macOS / Linux）が持っていない。
   *
   * @param navigatorPlatform 判定に使う `platform` を持つもの。省くと実物の `navigator`
   * @returns `platform` が `Mac` で始まれば `MacOs`、それ以外は `Other`
   */
  fromNavigator(
    navigatorPlatform: NavigatorPlatform = navigator,
  ): OperatingSystem {
    return navigatorPlatform.platform.startsWith("Mac")
      ? OperatingSystems.MacOs
      : OperatingSystems.Other;
  },
} as const;
