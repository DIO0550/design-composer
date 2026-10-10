import { screen } from "@testing-library/react";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { TokenSet } from "@/domains/dcmp/token";
import { EditorState } from "@/features/editor/domains/editor-state";

/*
 * 色トークン `primary` を 1 つだけ持つ文書と、その値の読み方。トークンの値の書き換えを
 * 送る口（`useEditorState` のアクション・`useTokenActions`）の器が共有する。
 */

/** 器が `primary` の値を出す要素の目印。 */
export const PrimaryColorTestId = "primary-color";

/**
 * 色トークン `primary` が `#000000` の文書。書き換えはこの色から始める。
 *
 * @returns 画面構造を持たず、トークンが `primary` だけの文書
 */
export function primaryColorDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: { ...TokenSet.empty(), colors: { primary: "#000000" } },
  });
}

/**
 * 器が描く `primary` の値。
 *
 * @param state 読み先のエディタの状態
 * @returns 文書にある `primary` の値。消えていれば「無し」
 */
export function primaryColorOf(state: EditorState): string {
  return EditorState.document(state).tokens.colors.primary ?? "無し";
}

/**
 * 器が `PrimaryColorTestId` の要素に出している `primary` の値。
 *
 * @returns 画面に出ている文字列
 */
export function primaryColorText(): string {
  return screen.getByTestId(PrimaryColorTestId).textContent ?? "";
}
