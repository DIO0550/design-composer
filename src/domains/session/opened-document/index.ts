import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { DocumentError } from "@/domains/session/document-error";
import { FilePath } from "@/utils/FilePath";
import type { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * 開いているドキュメントと、その保存先（docs/05-architecture.md「保存モデル: 自動保存」）。
 *
 * 自動保存も外部変更の監視も「どのパスの、どのドキュメントか」が揃って初めて決まる。
 * 片方だけでは何も書き出せず何も監視できないため、対を 1 つの型にして名前を付ける。
 *
 * **ここが運ぶドキュメントはスキーマ検証を通っていない**（docs/03-schema.md
 * 「不正ファイル時の挙動」の「開く時」）。取り込みの `DocumentReload.reloaded` が
 * 検証済みを運ぶのと非対称で、その違いは型に出ない。消費側は `DocumentError.collectFrom`
 * で自分で集める前提で書く。
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
      document: DesignDocument.createFromTemplate(DocumentTemplate.Default),
    };
  },

  /**
   * 解釈した結果に保存先を添えて、開いた状態にする。
   *
   * **スキーマ検証はしない。** 組み立てられたドキュメントは、不正でもそのまま開いて
   * エラー一覧として画面に出す（docs/03-schema.md「不正ファイル時の挙動」の「開く時」）。
   * Why: 自動保存は画面の内容をそのまま書き出すので、アプリ内の編集で作った不正は
   * ファイルにも載る。ここで落とすと、それを直す手段が外部エディタにしか無くなる（#158）。
   *
   * Why not: 取り込みと同じ `DocumentReload` へ委ねない。開いている最中の外部変更は
   * 「最後に正常だった状態を保つ」という別の規定に従うので、判定を共有できなくなった。
   * Why not: `create(path, document)` を公開して `Result.map` を呼び出し側へ出さない。
   * 「解釈できたならそのまま開く」という線引きが呼び出し側へ移り、開く経路が増えるたびに
   * そこで決め直すことになる。
   *
   * @param path このドキュメントの保存先
   * @param parsed 読み込んだ中身を解釈した結果
   * @returns 解釈できていれば保存先と対にしたドキュメント。解釈に失敗していれば
   *   その理由（載せる相手のドキュメントが組み立っていないので開けない）
   */
  fromParsed(
    path: string,
    parsed: Result<DesignDocument, readonly DocumentError[]>,
  ): Result<OpenedDocument, readonly DocumentError[]> {
    return Result.map(parsed, (document) => ({ path, document }));
  },

  /**
   * 保存先のファイルの名前。
   *
   * 綴りではなく構造（どのファイルか）だけを答える。区切りをどう見せるかは表示側の関心事。
   * 規則そのものは `FilePath` が持つ（最近使ったファイルの一覧はパスしか持たず、
   * ここを通れないため）。
   *
   * @param opened 名前を知りたい、開いているドキュメント
   * @returns パスの末尾の要素。パスに要素が 1 つも無ければ `none`
   */
  fileName(opened: OpenedDocument): Option<string> {
    return FilePath.fileName(opened.path);
  },

  /**
   * 保存先のファイルを収めているフォルダの名前。
   *
   * @param opened 収め先を知りたい、開いているドキュメント
   * @returns パスの末尾から 2 番目の要素。フォルダの名前が無い場合と Windows の
   *   ドライブ直下の扱いは `FilePath.folderName` が決める
   */
  folderName(opened: OpenedDocument): Option<string> {
    return FilePath.folderName(opened.path);
  },
} as const;
