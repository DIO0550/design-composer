import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { DocumentError } from "@/domains/session/document-error";
import { ArrayEx } from "@/utils/ArrayEx";
import type { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * パスの区切り。動かす OS の綴りで届く（Windows は `\`）ため両方を区切りとして扱う。
 */
const PathSeparator = /[\\/]/;

/**
 * パスを区切りで割った並び。
 *
 * @param path 割る対象のパス
 * @returns 空の要素を落とした並び（区切りの連続・先頭の区切りで空が生まれる）
 */
function pathSegments(path: string): readonly string[] {
  return path.split(PathSeparator).filter((segment) => segment.length > 0);
}

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
   * `{ path, document }` の対を組み立てる場所が `createFromTemplate` と 2 箇所に割れる。
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
   *   ルート直下（`/app.dcmp`）にはフォルダの名前が無いので `none`。
   *   Windows のドライブ直下（`C:\app.dcmp`）はドライブ名（`C:`）を返す
   *   （区切りで割った 2 番目という規則をドライブ名だけ例外にすると、
   *   仕様に無い正規化をドメインへ持ち込むことになるため）
   */
  folderName(opened: OpenedDocument): Option<string> {
    return ArrayEx.last(ArrayEx.dropLast(pathSegments(opened.path)));
  },
} as const;
