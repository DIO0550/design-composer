import { DesignDocument } from "@/domains/design-document";
import type { TokenKind } from "@/domains/token";
import { TokenSelection } from "@/domains/token-selection";
import {
  TokenControl,
  type TokenControlField,
} from "@/features/tokens/domains/token-control";
import { Option } from "@/utils/Option";

/**
 * 5 種別すべてに 1 件ずつ持つドキュメント。
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
    },
  });
}

/** そのトークンを選んでいる状態。 */
export function selectionOf(kind: TokenKind, name: string): TokenSelection {
  return TokenSelection.create(setupDocument(), Option.some({ kind, name }));
}

/** 選択したトークンの編集欄の並び。 */
export function fieldsOf(
  kind: TokenKind,
  name: string,
): readonly TokenControlField[] {
  return Option.unwrap(TokenControl.forSelection(selectionOf(kind, name)))
    .fields;
}

/** 見出しで編集欄の1行を引く。 */
export function fieldOf(
  kind: TokenKind,
  name: string,
  label: string,
): TokenControlField {
  return Option.unwrap(
    Option.fromNullable(
      fieldsOf(kind, name).find((field) => field.label === label),
    ),
  );
}
