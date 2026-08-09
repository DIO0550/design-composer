import { DesignDocument } from "@/domains/design-document";
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

/**
 * `syntax-error` / `duplicate-key` はテキストの検証（字句スキャン）由来、
 * `unsupported-format-version` などは版の解決（マイグレーション）由来、
 * それ以外は形の検証（デコード）由来。
 * スキーマ検証（未知 type・未知 prop・dangling ref・識別子規則・名前一意性）は
 * `DesignDocument.collectErrors` の担当なのでここには現れない。
 */
export type DocumentJsonErrorKind =
  | JsonScanError["kind"]
  | DocumentMigrationError["kind"]
  | JsonDecodeError["kind"];

/**
 * テキストの解釈が失敗した 1 件。
 * 由来によって分かる位置の粒度が違うので、`path` と `position` はどちらも省略できる。
 */
export type DocumentJsonError = Readonly<{
  kind: DocumentJsonErrorKind;
  message: string;
  /** ドキュメント内の位置（例: `artboards[0].children[1].name`）。形の検証で付く。 */
  path?: string;
  /** テキスト内の位置。字句スキャン由来のエラーで付く。 */
  position?: number;
}>;

type Parsed = Result<DesignDocument, readonly DocumentJsonError[]>;

/** 字句スキャンの失敗を、文字位置つきの形へ揃える。 */
function toDocumentJsonError(error: JsonScanError): DocumentJsonError {
  return {
    kind: error.kind,
    message: error.message,
    position: error.position,
  };
}

/** 版の解決の失敗はテキスト内の位置もドキュメント内の位置も持たない。 */
function toMigrationError(
  error: DocumentMigrationError,
): readonly DocumentJsonError[] {
  return [{ kind: error.kind, message: DocumentMigrationError.message(error) }];
}

/**
 * 字句スキャンを通っていれば `JSON.parse` は成功するが、
 * 「例外を散らさない」ために失敗も値として扱う。
 */
function parseJson(
  text: string,
): Result<unknown, readonly DocumentJsonError[]> {
  try {
    const value: unknown = JSON.parse(text);
    return Result.ok(value);
  } catch (error) {
    return Result.err([
      {
        kind: "syntax-error",
        message: error instanceof Error ? error.message : String(error),
        position: 0,
      },
    ]);
  }
}

const INDENT_WIDTH = 2;

/**
 * ドキュメントと JSON テキストの相互変換。
 *
 * この層が持つのは「テキスト ⇄ JSON のデータモデル」だけで、
 * 「データモデル ⇄ ドメインオブジェクト」は各ドメインオブジェクトの
 * `fromJson` / `toJson` が持つ（表現の規則はその値自身の知識のため）。
 * フォーマットを差し替えるときに変わるのはこのファイルに閉じる。
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
      return Result.err(scanErrors.map(toDocumentJsonError));
    }
    return Result.flatMap(parseJson(text), (value) =>
      Result.flatMap(
        Result.mapErr(DocumentMigration.toCurrent(value), toMigrationError),
        (migrated) => DesignDocument.fromJson(Json.create(migrated)),
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
    return `${JSON.stringify(value, null, INDENT_WIDTH)}\n`;
  },
} as const;
