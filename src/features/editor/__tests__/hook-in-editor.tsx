import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect } from "vitest";
import type { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import {
  type Editor,
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import { EditorState } from "@/features/editor/domains/editor-state";

/** フックの戻り値と、同じ Provider が配っているエディタの状態・dispatch。 */
export type HookInEditor<T> = Readonly<{ hook: T; editor: Editor }>;

/** 描いた直後に置いておく前提。 */
export type EditorPremise = Readonly<{
  /** 開いておくドキュメント。 */
  document: DesignDocument;
  /** 最初に選んでおく artboard / ノードの名前（この順で選ばれる）。 */
  selected: readonly string[];
}>;

/** 描いたフックの、今の戻り値とエディタを読む手続き。 */
export type RenderedHookInEditor<T> = Readonly<{
  current: () => HookInEditor<T>;
}>;

/**
 * 実物の `EditorProvider` の内側でフックを描き、前提の選択を範囲選択の経路で置く。
 *
 * 文書に無い名前・部品定義の中のノード・artboard・ロック中のノードは範囲選択で選べないので、
 * 渡すとテストが落ちる。範囲選択の経路を使うのは、名前の並びを受けて複数選択を作れる
 * アクションが `select_in_range` しか無いため。
 *
 * @param useHook 描くフック
 * @param premise 開くドキュメントと、最初に選んでおく名前
 * @returns 今のフックの戻り値とエディタを読む手続き
 */
export function renderHookInEditor<T>(
  useHook: () => T,
  { document, selected }: EditorPremise,
): RenderedHookInEditor<T> {
  const { result } = renderHook(
    (): HookInEditor<T> => ({ hook: useHook(), editor: useEditor() }),
    {
      wrapper: ({ children }: Readonly<{ children: ReactNode }>) => (
        <EditorProvider initialDocument={document}>{children}</EditorProvider>
      ),
    },
  );

  act(() =>
    result.current.editor.dispatch({
      type: "select_in_range",
      names: selected,
    }),
  );
  expect(
    DocumentSelection.names(
      EditorState.documentSelection(result.current.editor.state),
    ),
  ).toEqual(selected);

  return { current: () => result.current };
}
