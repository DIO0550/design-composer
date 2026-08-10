import type { DocumentIpcError } from "@/libs/document-ipc";
import { Option } from "@/utils/Option";

/**
 * 画面のドキュメントとファイルの一致（docs/05-architecture.md「保存モデル: 自動保存」）。
 *
 * 「失敗しているのに保存済み」のような食い違いを作れないよう直和で列挙する
 * （`{ saved: boolean; failure: Option<DocumentIpcError> }` の形だと矛盾が書ける）。
 */
export type DocumentSaveState =
  | Readonly<{ kind: "saved" }>
  | Readonly<{ kind: "saving" }>
  | Readonly<{ kind: "failed"; error: DocumentIpcError }>;

/** 状態を持たない枝は生成せず 1 つを共有する。 */
const SAVED: DocumentSaveState = Object.freeze({ kind: "saved" });
const SAVING: DocumentSaveState = Object.freeze({ kind: "saving" });

export const DocumentSaveState = {
  SAVED,
  SAVING,

  /**
   * 書き込みが失敗している状態。
   *
   * @param error 書き込みを拒んだ理由
   * @returns その理由を抱えた失敗の状態
   */
  fromError(error: DocumentIpcError): DocumentSaveState {
    return { kind: "failed", error };
  },

  /**
   * 直近の書き込みの失敗。
   *
   * @param state 今の保存状態
   * @returns 失敗していればその理由。保存済み・保存中なら `none`
   */
  failure(state: DocumentSaveState): Option<DocumentIpcError> {
    return state.kind === "failed" ? Option.some(state.error) : Option.none;
  },
} as const;
