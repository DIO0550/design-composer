import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { DocumentError } from "@/features/editor/domains/document-error";
import { DocumentReload } from "@/features/editor/domains/document-reload";
import { Result } from "@/utils/Result";

/**
 * 開いているドキュメントと、その保存先（docs/05-architecture.md「保存モデル: 自動保存」）。
 *
 * 自動保存も外部変更の監視も「どのパスの、どのドキュメントか」が揃って初めて決まる。
 * 片方だけでは何も書き出せず何も監視できないため、対を 1 つの型にして名前を付ける。
 */
export type OpenedDocument = Readonly<{
  path: string;
  document: DesignDocument;
}>;

export const OpenedDocument = {
  /**
   * 新規作成のドキュメント（docs/04-tokens.md「新規ドキュメントテンプレート」）。
   * 空のドキュメントから始めないのは、トークンが無いと見た目の prop を 1 つも
   * 設定できないため（雛形の同梱理由は `DocumentTemplate` を参照）。
   */
  createFromTemplate(path: string): OpenedDocument {
    return {
      path,
      document: DesignDocument.createFromTemplate(DocumentTemplate.DEFAULT),
    };
  },

  /**
   * 読み込んだ中身を、開いたドキュメントか、画面に出すエラー一覧として解釈する。
   *
   * 解釈の規則（テキストの検証 → 版の解決 → 形の検証 → スキーマ検証）は外部変更の
   * 取り込みと同一なので `DocumentReload` に委ね、ここは保存先と対にするだけにする。
   * 同じ判定を 2 つ持つと、仕様が動いたときに片方だけ追従して食い違うため。
   */
  fromContent(
    path: string,
    content: string,
  ): Result<OpenedDocument, readonly DocumentError[]> {
    const reload = DocumentReload.fromContent(content);
    switch (reload.kind) {
      case "reloaded":
        return Result.ok({ path, document: reload.document });
      case "rejected":
        return Result.err(reload.errors);
    }
  },
} as const;
