import { DesignDocument } from "@/domains/dcmp/design-document";
import { type GradientToken, TokenSet } from "@/domains/dcmp/token";

/*
 * 値の欄の組み立て（`token-control`）と、それを描くエディタ（`token-editor`）のテストが同じ
 * グラデーションを使うので、それぞれに書かず共有する（rules/testing.md「同じヘルパーを 2 つ以上の
 * テストファイルに書いたら共通化する」）。
 */

/** 黒から白への 2 件。− で消せない最小の件数。 */
export const TwoStops = [
  { color: "#000000", ratio: 0 },
  { color: "#ffffff", ratio: 1 },
] as const;

/** 黒・灰・白の 3 件。− で消せる最小の件数。 */
export const ThreeStops = [
  { color: "#000000", ratio: 0 },
  { color: "#888888", ratio: 0.5 },
  { color: "#ffffff", ratio: 1 },
] as const;

/** 角度と色の変わり目の並びの指定。角度を省くと 90。 */
export type GradientSpec = Readonly<{
  angle?: number;
  stops: GradientToken["stops"];
}>;

/** グラデーション `brand` を 1 つだけ持つドキュメント。 */
export function gradientDocumentOf(gradient: GradientSpec): DesignDocument {
  return DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      gradients: {
        brand: {
          shape: "linear",
          angle: gradient.angle ?? 90,
          stops: gradient.stops,
        },
      },
    },
  });
}
