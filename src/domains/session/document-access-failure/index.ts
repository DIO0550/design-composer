import type { ValueOf } from "@/types/ValueOf";

/**
 * ドキュメントのファイルとのやりとりが成り立たなかった理由。読み書きが届かなかった場合
 * だけでなく、届いたが読めない（`undecodableText`）と、変更通知の購読が張れなかった（`undelivered`）
 * も同じ語彙で表す。
 *
 * 仕様書は「読み書き」と書く（docs/01-file-format.md / docs/05-architecture.md）が、こ
 * の 2 つは読み書きの成否に収まらないため、届かなかったことを指す `Access` を採った。
 *
 * 外の世界（Rust の `DocumentIoError` と Tauri の IPC）の語彙をそのまま流さないのは、
 * Rust 側が種別を足したときにドメインの語彙が「詰め替える判断」を通らずに増えるため（こ
 * こに無い理由は境界で必ず既存のどれかへ寄せる）。詰め替えは `libs/document-ipc` の
 * `toDocumentAccessFailure` が行い、対応関係はそちらの doc にある。
 */
export const DocumentAccessFailureReasons = {
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

/** `DocumentAccessFailureReasons` が挙げている理由のどれか。 */
export type DocumentAccessFailureReason = ValueOf<
  typeof DocumentAccessFailureReasons
>;

/**
 * ドキュメントの中身へ届かなかった理由と、診断用の原文（docs/01-file-format.md「ファイ
 * ル」/ docs/05-architecture.md「Tauri IPC」「保存モデル: 自動保存」「外部編集の検知」）。
 *
 * **この型を共有する経路の一覧はここを正とする**（他の doc はここを指すだけにする）: 開
 * く / 自動保存 / 外部変更の監視 / ファイルへの書き戻しの 4 つ。
 *
 * 届かなかった理由の語彙はどの経路でも同じで、**どの出来事で起きたか**は受け取る側が持
 * つ。
 */
export type DocumentAccessFailure = Readonly<{
  reason: DocumentAccessFailureReason;
  message: string;
}>;

export const DocumentAccessFailure = {
  /**
   * 届かなかったことを、理由と原文の対にする。ドメインの語彙で組み立てる入口に名前を与
   * えるために置く（構造的型付けなのでリテラルでも同じ値は作れる）。
   *
   * @param reason ドキュメントの中身へ届かなかった理由
   * @param message 診断用の原文（外の世界がそのまま返した文言）
   * @returns その理由と原文を持つ失敗
   */
  create(
    reason: DocumentAccessFailureReason,
    message: string,
  ): DocumentAccessFailure {
    return { reason, message };
  },
} as const;
