import { DesignDocument } from "@/domains/dcmp/design-document";
import type { TokenKind } from "@/domains/dcmp/token";
import { TokenSelection } from "@/domains/session/token-selection";
import {
  type GradientSpec,
  gradientDocumentOf,
} from "@/features/editor/features/tokens/__tests__/gradient-documents";
import {
  type GradientControl,
  type HexColorControl,
  type TokenColorControl,
  TokenControl,
  type TokenControlFieldOf,
  type TokenControlRow,
} from "@/features/editor/features/tokens/domains/token-control";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * 6 種別すべてに 1 件以上持つドキュメント。
 *
 * 色は 3 通りを持たせている。`primary` は alpha 無し、`veil` は alpha 付きで
 * 不透明度の既定（100%）と違う答えになるもの、`broken` は hex として読めない値
 * （`ColorToken` は `string` で、検証は編集の入口にしか無いので実在しうる）。
 */
export function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: {
      colors: { primary: "#3b82f6", veil: "#3b82f680", broken: "RED" },
      spacing: { lg: 24 },
      radius: { md: 8 },
      shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
      typography: {
        body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
      },
      gradients: {
        brand: {
          shape: "linear",
          angle: 90,
          stops: [
            { color: "#3b82f6", ratio: 0 },
            { color: "#1d4ed8", ratio: 1 },
          ],
        },
      },
    },
  });
}

/** そのトークンを選んでいる状態。 */
export function selectionOf(kind: TokenKind, name: string): TokenSelection {
  return TokenSelection.create(setupDocument(), Option.some({ kind, name }));
}

/**
 * 選択したトークンの値の欄に並ぶ行。
 *
 * @throws 値の欄が上から並べる行でない（グラデーション）とき。テストを落とすため
 */
export function rowsOf(
  kind: TokenKind,
  name: string,
): readonly TokenControlRow[] {
  const { valueFields } = Option.unwrap(
    TokenControl.forSelection(selectionOf(kind, name)),
  );
  if (valueFields.kind !== "rows") {
    throw new Error(
      `${kind}/${name} の値の欄は ${valueFields.kind} で、並べる行ではない`,
    );
  }
  return valueFields.rows;
}

/** グラデーション `brand` を選んでいる状態。 */
export function gradientSelectionOf(gradient: GradientSpec): TokenSelection {
  return TokenSelection.create(
    gradientDocumentOf(gradient),
    Option.some({ kind: "gradients", name: "brand" }),
  );
}

/**
 * 選択したグラデーションの値の欄。
 *
 * @throws 値の欄がグラデーションのものでないとき。テストを落とすため
 */
export function gradientOf(selection: TokenSelection): GradientControl {
  const { valueFields } = Option.unwrap(TokenControl.forSelection(selection));
  if (valueFields.kind !== "gradient") {
    throw new Error(
      `値の欄は ${valueFields.kind} で、グラデーションのものではない`,
    );
  }
  return valueFields.gradient;
}

/** 数値・文言の欄の行から、見出しで 1 つを引く。 */
export function fieldOf(
  kind: TokenKind,
  name: string,
  label: string,
): TokenControlFieldOf<"number" | "text"> {
  const fields = ArrayEx.filterMap(rowsOf(kind, name), (row) =>
    row.kind === "field" ? Option.some(row.field) : Option.none,
  );
  return Option.unwrap(
    Option.fromNullable(fields.find((field) => field.label === label)),
  );
}

/** 選択したトークンの値の欄に並ぶ、色の欄（箱か、読めない色のテキスト欄）。 */
export function colorControlsIn(
  kind: TokenKind,
  name: string,
): readonly TokenColorControl[] {
  return ArrayEx.filterMap(rowsOf(kind, name), (row) =>
    row.kind === "color" ? Option.some(row.color) : Option.none,
  );
}

/**
 * 選択したトークンの色の欄。
 *
 * @throws 色の行を持たないとき。テストを落とすため
 */
export function selectedColorControl(
  kind: TokenKind,
  name: string,
): TokenColorControl {
  return Option.unwrap(ArrayEx.first(colorControlsIn(kind, name)));
}

/**
 * hex として読めた色の箱。
 *
 * @throws 色が読めずテキスト欄になっているとき。テストを落とすため
 */
export function hexControlOf(color: TokenColorControl): HexColorControl {
  if (color.kind !== "hex") {
    throw new Error(`色の欄は ${color.kind} で、箱ではない`);
  }
  return color;
}

/** 選択したトークンの、hex として読めた色の箱。 */
export function selectedHexControl(
  kind: TokenKind,
  name: string,
): HexColorControl {
  return hexControlOf(selectedColorControl(kind, name));
}
