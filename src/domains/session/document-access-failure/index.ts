import type { ValueOf } from "@/types/ValueOf";

/**
 * ドキュメントの中身へ届かなかった理由。
 *
 * 6 つとも「ファイルの中身を読めた / 書けた」に至らなかった理由で、
 * 相手が無い・許されない・指定が壊れている・読み書きが失敗した、に加えて、
 * 届いたが読めない（`undecodableText`）と、そもそも受け渡しが途切れた
 * （`undelivered`）もここに含む。
 *
 * 外の世界（Rust の `DocumentIoError` と Tauri の IPC）が持つ語彙をそのまま流さず、
 * ドメイン側の語彙として持ち直すための union（腐敗防止層）。詰め替えは
 * `libs/document-ipc` の `toDocumentAccessFailure` が行う。対応関係はそちらの doc にある。
 *
 * Why: 外の語彙のまま持つと、Rust 側が種別を足したときにドメインの語彙が
 * 「詰め替える判断」を通らずに増える。ここに無い理由は境界で必ず既存のどれかへ寄せる。
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
 * ドキュメントの中身へ届かなかった理由と、診断用の原文
 * （docs/01-file-format.md「ファイル」/ docs/05-architecture.md「Tauri IPC」
 * 「保存モデル: 自動保存」「外部編集の検知」）。
 *
 * 開く・自動保存・監視・書き戻しの 4 経路で 1 つの型を共有する。
 * Why: 届かなかった理由の語彙はどの経路でも同じで、**どの出来事で起きたか**は
 * 受け取る側（`DocumentOpenFailure` の枝 / `DocumentSyncFailureList` の経路ラベル）が持つ。
 */
export type DocumentAccessFailure = Readonly<{
  reason: DocumentAccessFailureReason;
  message: string;
}>;

export const DocumentAccessFailure = {
  /**
   * 届かなかったことを、理由と原文の対にする。
   *
   * Why: ドメインの語彙で組み立てる入口に名前を与えるために置く。構造的型付けなので
   * リテラルでも同じ値は作れる（ここを通らないと作れない、という保証にはならない）。
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
