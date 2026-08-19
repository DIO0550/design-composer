import type { DesignDocument } from "@/domains/design-document";
import { DocumentError } from "@/domains/document-error";
import { DocumentJson } from "@/libs/document-json";

/**
 * 外部変更で届いた内容を取り込んだ結果（docs/05-architecture.md「外部編集の検知」）。
 *
 * 取り込めたときはドキュメントだけ、拒んだときはエラー一覧だけを持つ。
 * 「ドキュメントもエラーも持つ」中間状態を作らないのは、不正なファイルでは
 * 表示を差し替えず最後に正常だった状態を保つため（docs/03-schema.md「不正ファイル時の挙動」）。
 *
 * `errors` は必ず 1 件以上入る（拒む理由が無ければ `reloaded` になる）が、
 * 非空タプルでは縛っていない。テキストの解釈の失敗（`DocumentJson.parse` の `Err`）が
 * 空配列を返さないことは型に出ておらず、縛ると「起こらない空配列」の分岐を
 * ここで書く羽目になるため（rules/coding.md「対で縛るコストが釣り合わない場合」）。
 */
export type DocumentReload =
  | Readonly<{ kind: "reloaded"; document: DesignDocument }>
  | Readonly<{ kind: "rejected"; errors: readonly DocumentError[] }>;

export const DocumentReload = {
  /**
   * ファイルの中身を、描画に使えるドキュメントか、画面に出すエラー一覧として解釈する。
   *
   * テキストの解釈（`libs/document-json`）に失敗した時点で返すのは、
   * ドキュメントが組み立たっておらずスキーマ検証を走らせる相手がいないため。
   * 仕様上どちらも「エラー」で警告という中間区分は無い（docs/03-schema.md「バリデーション仕様」）ので、
   * 検出できたエラーはすべて 1 本の一覧にまとめて返す。
   */
  fromContent(content: string): DocumentReload {
    const parsed = DocumentJson.parse(content);
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
