import type { TokenKind, TokenRef, TokenValue } from "@/domains/token";
import { useEditor } from "@/features/editor/components/editor-provider";

/**
 * トークン一覧・トークン編集欄から届く操作
 * （docs/06-ui.md「編集操作の一覧」の tokens 編集 / #42）。
 *
 * 値・名前・削除が対象を受け取らないのは、編集欄が出るのが選択中のトークンだけで、
 * 対象を選択から決めているため（`EditorState.setTokenValue` 等）。
 *
 * 追加が受け取るのは種別だけで、追加の指定（`TokenTemplate`）を組むのはここ。
 * 指定は書き込み側（`EditorState.addToken`）の語彙なので、押した見出しの種別しか
 * 知らない一覧へ持ち出さない。
 */
export type TokenActions = Readonly<{
  select: (ref: TokenRef) => void;
  add: (kind: TokenKind) => void;
  setValue: (value: TokenValue) => void;
  rename: (name: string) => void;
  remove: () => void;
}>;

/**
 * トークン編集の操作をエディタの状態へ仲介する。
 *
 * @returns 選択・追加・値の書き換え・改名・削除の操作
 */
export function useTokenActions(): TokenActions {
  const { dispatch } = useEditor();

  return {
    select: (ref) => dispatch({ type: "select_token", ref }),
    add: (kind) => dispatch({ type: "add_token", template: { kind } }),
    setValue: (value) => dispatch({ type: "set_token_value", value }),
    rename: (name) => dispatch({ type: "rename_token", name }),
    remove: () => dispatch({ type: "remove_token" }),
  };
}
