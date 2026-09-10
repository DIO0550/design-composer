import type { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentError } from "@/domains/session/document-error";
import type { Result } from "@/utils/Result";

/**
 * 外部変更で届いた内容を取り込んだ結果（docs/05-architecture.md「外部編集の検知」）。取
 * り込めたときはドキュメントだけ、拒んだときはエラー一覧だけを持つ。
 *
 * 「ドキュメントもエラーも持つ」中間状態を作らないのは、不正なファイルでは表示を差し替
 * えず最後に正常だった状態を保つため（docs/03-schema.md「不正ファイル時の挙動」）。
 *
 * `errors` を非空タプルで縛らないのは、`fromParsed` が受け取るエラー一覧が非空であるこ
 * とは型に出ておらず、縛ると解釈する側に「起こらない空配列」のフォールバックを書く羽目
 * になるため。
 */
export type DocumentReload =
  | Readonly<{ kind: "reloaded"; document: DesignDocument }>
  | Readonly<{ kind: "rejected"; errors: readonly DocumentError[] }>;

export const DocumentReload = {
  /**
   * 解釈した結果を、描画に使えるドキュメントか、画面に出すエラー一覧に振り分ける。
   *
   * テキストの解釈そのものを持たないのは、読み方が外部フォーマットの知識で `libs/` の担
   * 当だから。ここが足すのはスキーマ検証だけで、解釈に失敗していればその時点で返す（検
   * 証を走らせる相手がいない）。警告という中間区分は無い（docs/03-schema.md「バリデーシ
   * ョン仕様」）ので、検出できたエラーは 1 本の一覧にまとめて返す。
   *
   * @param parsed テキストを解釈した結果。成功ならドキュメント、失敗なら画面に
   *   出すエラー一覧
   * @returns 解釈にもスキーマ検証にも通れば取り込んだ状態、どちらかで落ちれば
   *   その理由を持つ拒んだ状態
   */
  fromParsed(
    parsed: Result<DesignDocument, readonly DocumentError[]>,
  ): DocumentReload {
    if (!parsed.ok) {
      return { kind: "rejected", errors: parsed.error };
    }

    const validationErrors = DocumentError.collectFrom(parsed.value);
    if (validationErrors.length > 0) {
      return { kind: "rejected", errors: validationErrors };
    }
    return { kind: "reloaded", document: parsed.value };
  },
} as const;
