import { SampleSyntaxError } from "@/domains/__tests__/document-errors";
import { EditorState } from "@/features/editor/domains/editor-state";
import { ReceivedAt } from "./instants";

/**
 * 外部がファイルを壊し、その読み直しを拒んだあとの状態
 * （画面はファイルと食い違ったまま凍結される / #155）。
 *
 * 凍結で可否が変わることを見るテストは、**凍結する前に**対象（選択・下書き・履歴）を
 * 用意する。用意しないと、凍結のガードを丸ごと消しても通るテストになる。
 *
 * @param state 凍結する前のエディタの状態
 * @returns ファイルが不正になった状態
 */
export function frozen(state: EditorState): EditorState {
  return EditorState.applyReload(
    state,
    { kind: "rejected", errors: [SampleSyntaxError] },
    ReceivedAt,
  );
}
