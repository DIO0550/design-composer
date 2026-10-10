import { DesignDocument } from "@/domains/dcmp/design-document";
import type { TokenKind } from "@/domains/dcmp/token";
import { TokenSelection } from "@/domains/session/token-selection";
import {
  type GradientSpec,
  gradientDocumentOf,
} from "@/features/editor/features/tokens/__tests__/gradient-documents";
import {
  type GradientControl,
  TokenControl,
  type TokenControlField,
} from "@/features/editor/features/tokens/domains/token-control";
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
 * 選択したトークンの編集欄の並び。
 *
 * @throws 値の欄が上から並べる編集欄でない（グラデーション）とき。テストを落とすため
 */
export function fieldsOf(
  kind: TokenKind,
  name: string,
): readonly TokenControlField[] {
  const { valueFields } = Option.unwrap(
    TokenControl.forSelection(selectionOf(kind, name)),
  );
  if (valueFields.kind !== "fields") {
    throw new Error(
      `${kind}/${name} の値の欄は ${valueFields.kind} で、並べる欄ではない`,
    );
  }
  return valueFields.fields;
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

/** 並んだ欄から見出しで 1 行を引く。 */
export function fieldLabeled(
  fields: readonly TokenControlField[],
  label: string,
): TokenControlField {
  return Option.unwrap(
    Option.fromNullable(fields.find((field) => field.label === label)),
  );
}

/** 見出しで編集欄の1行を引く。 */
export function fieldOf(
  kind: TokenKind,
  name: string,
  label: string,
): TokenControlField {
  return fieldLabeled(fieldsOf(kind, name), label);
}
