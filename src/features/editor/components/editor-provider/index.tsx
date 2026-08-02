import {
  type ActionDispatch,
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import type { DesignDocument } from "@/domains/design-document";
import type { EditorState } from "@/features/editor/domains/editor-state";
import {
  type EditorAction,
  useEditorReducer,
} from "@/features/editor/hooks/use-editor-reducer";
import { Option } from "@/utils/Option";

/** ペインが読む値。状態と更新手段は常に対で必要になるため 1 つにまとめる。 */
export type Editor = Readonly<{
  state: EditorState;
  dispatch: ActionDispatch<[action: EditorAction]>;
}>;

const EditorContext = createContext<Option<Editor>>(Option.none);

/**
 * 3 つのペインが同じ状態を読むための Provider（rules/components.md）。
 * 状態の生存期間を Provider に閉じるため、reducer もここで持つ。
 */
export function EditorProvider({
  initialDocument,
  children,
}: Readonly<{ initialDocument: DesignDocument; children: ReactNode }>) {
  const [state, dispatch] = useEditorReducer(initialDocument);
  const editor = useMemo(
    () => Option.some({ state, dispatch }),
    [state, dispatch],
  );

  return <EditorContext value={editor}>{children}</EditorContext>;
}

/**
 * Provider の外では none を返す。
 * 既定のエディタ状態を作って返すと Provider の付け忘れを画面が隠してしまうため、
 * 「無い」をそのまま呼び出し側へ渡す。
 */
export function useEditor(): Option<Editor> {
  return useContext(EditorContext);
}
