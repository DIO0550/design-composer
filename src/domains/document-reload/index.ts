import type { DesignDocument } from "@/domains/design-document";
import { DocumentError } from "@/domains/document-error";
import type { Result } from "@/utils/Result";

/**
 * 外部変更で届いた内容を取り込んだ結果（docs/05-architecture.md「外部編集の検知」）。
 *
 * 取り込めたときはドキュメントだけ、拒んだときはエラー一覧だけを持つ。
 * 「ドキュメントもエラーも持つ」中間状態を作らないのは、不正なファイルでは
 * 表示を差し替えず最後に正常だった状態を保つため（docs/03-schema.md「不正ファイル時の挙動」）。
 *
 * `errors` に入る拒む理由は、スキーマ検証由来なら 0 件のときに `reloaded` になり、
 * テキストの解釈由来なら解釈した側が返した失敗をそのまま持つ。非空タプルでは縛っていない。
 * `fromParsed` が受け取るエラー一覧が非空であることは型に出ておらず、縛ると解釈する側に
 * 「起こらない空配列」のフォールバックを書く羽目になるため
 * （rules/coding.md「対で縛るコストが釣り合わない場合」）。
 */
export type DocumentReload =
  | Readonly<{ kind: "reloaded"; document: DesignDocument }>
  | Readonly<{ kind: "rejected"; errors: readonly DocumentError[] }>;

export const DocumentReload = {
  /**
   * 解釈した結果を、描画に使えるドキュメントか、画面に出すエラー一覧に振り分ける。
   *
   * テキストの解釈そのものを持たないのは、テキストの読み方が外部フォーマットの知識で
   * `libs/` の担当だから（rules/architecture.md）。ここが足すのはスキーマ検証だけで、
   * 解釈に失敗していればその時点で返す（ドキュメントが組み立っておらず、
   * スキーマ検証を走らせる相手がいないため）。仕様上どちらも「エラー」で警告という
   * 中間区分は無い（docs/03-schema.md「バリデーション仕様」）ので、検出できたエラーは
   * すべて 1 本の一覧にまとめて返す。
   *
   * @param parsed テキストを解釈した結果。成功ならドキュメント、失敗なら画面に出す
   *   エラー一覧
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
