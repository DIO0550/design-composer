import type { DocumentSyncFailure } from "@/domains/session/document-sync-failure";
import { Option } from "@/utils/Option";

/**
 * 画面のドキュメントとファイルの一致（docs/05-architecture.md「保存モデル: 自動保存」）。
 *
 * 「失敗しているのに保存済み」のような食い違いを作れないよう直和で列挙する
 * （`{ saved: boolean; failure: Option<DocumentSyncFailure> }` の形だと矛盾が書ける）。
 */
export type DocumentSaveState =
  | Readonly<{ kind: "saved" }>
  | Readonly<{ kind: "saving" }>
  | Readonly<{ kind: "failed"; failure: DocumentSyncFailure }>;

/** 状態を持たない枝は生成せず 1 つを共有する。 */
const Saved: DocumentSaveState = Object.freeze({ kind: "saved" });
const Saving: DocumentSaveState = Object.freeze({ kind: "saving" });

export const DocumentSaveState = {
  Saved,
  Saving,

  /**
   * 書き込みが失敗している状態。
   *
   * @param failure 書き込みができなかった理由
   * @returns その理由を抱えた失敗の状態
   */
  failed(failure: DocumentSyncFailure): DocumentSaveState {
    return { kind: "failed", failure };
  },

  /**
   * 書き出しの最中か。
   * ボタンを `disabled` にして二重に書かせないために読む（rules/hooks.md）。
   *
   * @param state 今の保存状態
   * @returns 書き出し待ち・書き出し中なら真
   */
  isSaving(state: DocumentSaveState): boolean {
    return state.kind === "saving";
  },

  /**
   * 直近の書き込みの失敗。
   *
   * @param state 今の保存状態
   * @returns 失敗していればその理由。保存済み・保存中なら `none`
   */
  failure(state: DocumentSaveState): Option<DocumentSyncFailure> {
    return state.kind === "failed" ? Option.some(state.failure) : Option.none;
  },
} as const;
