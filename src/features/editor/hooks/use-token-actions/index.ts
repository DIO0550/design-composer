import type { TokenRef, TokenValue } from "@/domains/token";
import { useEditor } from "@/features/editor/components/editor-provider";
import type { TokenTemplate } from "@/features/editor/domains/token-template";

/**
 * トークン一覧・トークン編集欄から届く操作
 * （docs/06-ui.md「編集操作の一覧」の tokens 編集 / #42）。
 *
 * 値・名前・削除が対象を受け取らないのは、編集欄が出るのが選択中のトークンだけで、
 * 対象を選択から決めているため（`EditorState.setTokenValue` 等）。
 */
export type TokenActions = Readonly<{
  select: (ref: TokenRef) => void;
  add: (template: TokenTemplate) => void;
  setValue: (value: TokenValue) => void;
  rename: (name: string) => void;
  remove: () => void;
}>;

/** トークン編集の操作をエディタの状態へ仲介する。 */
export function useTokenActions(): TokenActions {
  const { dispatch } = useEditor();

  return {
    select: (ref) => dispatch({ type: "select_token", ref }),
    add: (template) => dispatch({ type: "add_token", template }),
    setValue: (value) => dispatch({ type: "set_token_value", value }),
    rename: (name) => dispatch({ type: "rename_token", name }),
    remove: () => dispatch({ type: "remove_token" }),
  };
}
