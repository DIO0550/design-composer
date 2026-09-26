import type { GradientToken } from "@/domains/dcmp/token";

/**
 * 2 色の直線グラデーション。値そのものは見ず、gradients の名前を置くためだけに使う。
 *
 * 名前の衝突・参照・検証のテストが `token` と `design-document` にまたがるので、同じ値を
 * それぞれに書かず共有する（rules/testing.md「同じヘルパーを 2 つ以上のテストファイルに
 * 書いたら共通化する」）。
 */
export const Fade: GradientToken = {
  shape: "linear",
  angle: 90,
  stops: [
    { color: "#3b82f6", ratio: 0 },
    { color: "#1d4ed8", ratio: 1 },
  ],
};
