import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { DocumentError } from "@/features/editor/domains/document-error";
import { DocumentReload } from "@/features/editor/domains/document-reload";
import { ArrayEx } from "@/utils/ArrayEx";
import type { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * パスの区切り。動かす OS の綴りで届く（Windows は `\`）ため両方を区切りとして扱う。
 */
const PATH_SEPARATOR = /[\\/]/;

/**
 * パスを区切りで割った並び。
 *
 * @param path 割る対象のパス
 * @returns 空の要素を落とした並び（区切りの連続・先頭の区切りで空が生まれる）
 */
function pathSegments(path: string): readonly string[] {
  return path.split(PATH_SEPARATOR).filter((segment) => segment.length > 0);
}

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

  /**
   * 保存先のファイルの名前。
   *
   * 綴りではなく構造（どのファイルか）だけを答える。区切りをどう見せるかは表示側の関心事。
   *
   * @param opened 名前を知りたい、開いているドキュメント
   * @returns パスの末尾の要素。パスに要素が 1 つも無ければ `none`
   */
  fileName(opened: OpenedDocument): Option<string> {
    return ArrayEx.last(pathSegments(opened.path));
  },

  /**
   * 保存先のファイルを収めているフォルダの名前。
   *
   * @param opened 収め先を知りたい、開いているドキュメント
   * @returns パスの末尾から 2 番目の要素。相対パスのファイル名だけ（`app.dcmp`）や
   *   ルート直下（`/app.dcmp`）にはフォルダの名前が無いので `none`
   */
  folderName(opened: OpenedDocument): Option<string> {
    return ArrayEx.last(ArrayEx.dropLast(pathSegments(opened.path)));
  },
} as const;
