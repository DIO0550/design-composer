import type { ValueOf } from "@/types/ValueOf";

/**
 * ファイルとの同期ができなかった理由。
 *
 * 外の世界（Rust の `DocumentIoError` と Tauri の IPC）が持つ語彙をそのまま流さず、
 * ドメイン側の語彙として持ち直すための union（腐敗防止層）。詰め替えは
 * `libs/document-ipc` の `toDocumentSyncFailure` が行う。対応関係はそちらの doc にある。
 *
 * Why: 外の語彙のまま持つと、Rust 側が種別を足したときにドメインの語彙が
 * 「詰め替える判断」を通らずに増える。ここに無い理由は境界で必ず既存のどれかへ寄せる。
 */
export const DocumentSyncFailureReasons = {
  /** 読み書きする相手が無い。 */
  Missing: "missing",
  /** 読み書きを許されていない。 */
  NotPermitted: "notPermitted",
  /** パスとして使えない。 */
  UnusablePath: "unusablePath",
  /** テキストとして読めない。 */
  UndecodableText: "undecodableText",
  /** 読み書き自体が失敗した。 */
  StorageFailed: "storageFailed",
  /** アプリ内部の受け渡しが届かなかった。 */
  Undelivered: "undelivered",
} as const;

/** `DocumentSyncFailureReasons` が挙げている理由のどれか。 */
export type DocumentSyncFailureReason = ValueOf<
  typeof DocumentSyncFailureReasons
>;

/**
 * ファイルとの同期ができなかった理由と、診断用の原文
 * （docs/05-architecture.md「保存モデル: 自動保存」「外部編集の検知」）。
 *
 * 自動保存・監視・書き戻しで 1 つの型を共有する理由は `DocumentSyncFailureList` にある。
 */
export type DocumentSyncFailure = Readonly<{
  reason: DocumentSyncFailureReason;
  message: string;
}>;

export const DocumentSyncFailure = {
  /**
   * 同期できなかったことを、理由と原文の対にする。
   *
   * Why: ドメインの語彙で組み立てる入口に名前を与えるために置く。構造的型付けなので
   * リテラルでも同じ値は作れる（ここを通らないと作れない、という保証にはならない）。
   *
   * @param reason 同期できなかった理由
   * @param message 診断用の原文（外の世界がそのまま返した文言）
   * @returns その理由と原文を持つ失敗
   */
  create(
    reason: DocumentSyncFailureReason,
    message: string,
  ): DocumentSyncFailure {
    return { reason, message };
  },
} as const;
