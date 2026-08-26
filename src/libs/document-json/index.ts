import { DesignDocument } from "@/domains/dcmp/design-document";
import type { DocumentError } from "@/domains/document-error";
import {
  DocumentMigration,
  DocumentMigrationError,
} from "@/libs/document-migration";
import {
  JsonLexicalScanner,
  type JsonScanError,
} from "@/libs/json-lexical-scanner";
import { Json, type JsonDecodeError, type JsonValue } from "@/utils/Json";
import { Result } from "@/utils/Result";

type Parsed = Result<DesignDocument, readonly DocumentError[]>;

/**
 * 字句スキャンの失敗は、テキストの何文字目かを指す。
 *
 * @param errors 字句スキャンが報告した失敗の並び
 * @returns 文字位置を指すエラーの並び
 */
function fromScanErrors(
  errors: readonly JsonScanError[],
): readonly DocumentError[] {
  return errors.map((error) => ({
    kind: error.kind,
    message: error.message,
    location: { kind: "text-position", position: error.position },
  }));
}

/**
 * 版の解決の失敗はテキスト内の位置もドキュメント内の位置も持たないので、ファイル全体を指す。
 *
 * @param error 版の解決が報告した失敗
 * @returns ファイル全体を指すエラー 1 件の並び
 */
function fromMigrationError(
  error: DocumentMigrationError,
): readonly DocumentError[] {
  return [
    {
      kind: error.kind,
      message: DocumentMigrationError.message(error),
      location: { kind: "whole-document" },
    },
  ];
}

/**
 * 形の検証の失敗は、ドキュメント内のどのパスで起きたかを指す。
 *
 * @param errors デコードが報告した失敗の並び
 * @returns ドキュメント内のパスを指すエラーの並び
 */
function fromDecodeErrors(
  errors: readonly JsonDecodeError[],
): readonly DocumentError[] {
  return errors.map((error) => ({
    kind: error.kind,
    message: error.message,
    location: { kind: "document-path", path: error.path },
  }));
}

/**
 * 字句スキャンを通っていれば `JSON.parse` は成功するが、
 * 「例外を散らさない」ために失敗も値として扱う。
 *
 * Why: `JsonLexicalScanner` が受理する文法は `JSON.parse` と同じなので、
 * スキャンを通った後にここが失敗することは実際には無い（外部 API を境界で握る保険）。
 * 位置をファイル全体にしているのはそのためで、投げられた例外からは
 * テキストの何文字目かが分からない（`rules/coding.md` の「既定値へフォールバックしない」）。
 *
 * @param text 読み込む JSON のテキスト
 * @returns 読み込んだ値。`JSON.parse` が投げたら、ファイル全体を指す `syntax-error` の失敗
 */
function parseJson(text: string): Result<unknown, readonly DocumentError[]> {
  try {
    const value: unknown = JSON.parse(text);
    return Result.ok(value);
  } catch (error) {
    return Result.err([
      {
        kind: "syntax-error",
        message: error instanceof Error ? error.message : String(error),
        location: { kind: "whole-document" },
      },
    ]);
  }
}

const IndentWidth = 2;

/**
 * ドキュメントと JSON テキストの相互変換。
 *
 * この層が持つのは「テキスト ⇄ JSON のデータモデル」と、その解釈が失敗したときの
 * 「失敗 → 画面に出す 1 件（`DocumentError`）」への変換だけで、
 * 「データモデル ⇄ ドメインオブジェクト」は各ドメインオブジェクトの
 * `fromJson` / `toJson` が持つ（表現の規則はその値自身の知識のため）。
 * フォーマットを差し替えるときに変わるのはこのファイルに閉じる。
 *
 * 失敗の変換をここに置くのは、これが外部世界とドメインの間の変換そのものだから。
 * 変換元（`JsonScanError` / `DocumentMigrationError` / `JsonDecodeError`）の
 * コンパニオンへ置くと、汎用の JSON スキャナがドキュメントのドメインを知ることになる。
 */
export const DocumentJson = {
  /**
   * JSON テキストをドキュメントへ読み込む。
   * 不正入力はエラーの一覧として返し、例外は投げない。
   *
   * 読み込みは「テキストの検証 → 版の解決 → 形の検証」の順で進む。
   * 版の解決をデコードより前に置くのは、旧 major のファイルが今のデコーダでは
   * 読めない形になっている（それが major の定義）ため。
   */
  parse(text: string): Parsed {
    const scanErrors = JsonLexicalScanner.scan(text);
    if (scanErrors.length > 0) {
      return Result.err(fromScanErrors(scanErrors));
    }
    return Result.flatMap(parseJson(text), (value) =>
      Result.flatMap(
        Result.mapErr(DocumentMigration.toCurrent(value), fromMigrationError),
        (migrated) =>
          Result.mapErr(
            DesignDocument.fromJson(Json.create(migrated)),
            fromDecodeErrors,
          ),
      ),
    );
  },

  /**
   * ドキュメントを JSON テキストへ書き出す。
   * 書き出すのは常に現在の形式（旧形式へのダウングレード書き出しは持たない）。
   * 末尾に改行を1つ入れ、Git diff の `\ No newline at end of file` を避ける。
   */
  serialize(document: DesignDocument): string {
    const value: JsonValue = DesignDocument.toJson(
      DesignDocument.withCurrentFormatVersion(document),
    );
    return `${JSON.stringify(value, null, IndentWidth)}\n`;
  },
} as const;
