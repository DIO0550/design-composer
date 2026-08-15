import { DesignDocument } from "@/domains/design-document";
import type { TokenKind } from "@/domains/token";
import { EditorState } from "@/features/editor/domains/editor-state";
import {
  TokenControl,
  type TokenControlField,
} from "@/features/editor/domains/token-control";
import { Option } from "@/utils/Option";

/**
 * 5 種別すべてに 1 件ずつ持つドキュメントの編集状態。
 *
 * 色は 3 通りを持たせている。`primary` は alpha 無し、`veil` は alpha 付きで
 * 不透明度の既定（100%）と違う答えになるもの、`broken` は hex として読めない値
 * （`ColorToken` は `string` で、検証は編集の入口にしか無いので実在しうる）。
 */
export function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: {
        colors: { primary: "#3b82f6", veil: "#3b82f680", broken: "RED" },
        spacing: { lg: 24 },
        radius: { md: 8 },
        shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
        typography: {
          body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
        },
      },
    }),
  );
}

/** 選択したトークンの編集欄の並び。 */
export function fieldsOf(
  kind: TokenKind,
  name: string,
): readonly TokenControlField[] {
  const state = EditorState.selectToken(setupState(), { kind, name });
  return Option.unwrap(TokenControl.forSelection(state)).fields;
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
