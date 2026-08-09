import {
  DesignDocument,
  type DesignDocumentValidationError,
  type DesignDocumentValidationErrorKind,
} from "@/domains/design-document";
import type {
  DocumentJsonError,
  DocumentJsonErrorKind,
} from "@/libs/document-json";

/**
 * エラーが指している場所。
 *
 * 由来ごとに指せる粒度が違う（字句スキャンはテキストの文字位置までしか分からず、
 * スキーマ検証はテキストのどこかを知らない）ため、1 つの形に潰さず直和で持つ。
 * 潰すと「位置が無いのに 0 文字目」のような嘘の位置が画面に出る。
 */
export type DocumentErrorLocation =
  | Readonly<{ kind: "text-position"; position: number }>
  | Readonly<{ kind: "document-path"; path: string }>
  | Readonly<{ kind: "node"; nodeName: string; prop?: string }>
  | Readonly<{ kind: "whole-document" }>;

export type DocumentErrorKind =
  | DocumentJsonErrorKind
  | DesignDocumentValidationErrorKind;

/**
 * 不正なファイルを画面に出すための 1 件のエラー（docs/03-schema.md「不正ファイル時の挙動」）。
 *
 * テキストの解釈（`libs/document-json`）とスキーマ検証（`DesignDocument.collectErrors`）は
 * 別々の形で失敗を返すが、仕様が画面に求めるのは 1 本の「エラー一覧」なので、
 * 表示側が 2 系統に分岐しなくて済む形へここで揃える。
 */
export type DocumentError = Readonly<{
  kind: DocumentErrorKind;
  message: string;
  location: DocumentErrorLocation;
}>;

/**
 * 字句スキャン由来なら `position`、形の検証由来なら `path` が付き、
 * 版の解決の失敗はどちらも持たない（`libs/document-json` の 3 系統に対応する）。
 */
function locationOf(error: DocumentJsonError): DocumentErrorLocation {
  if (error.position !== undefined) {
    return { kind: "text-position", position: error.position };
  }
  if (error.path !== undefined) {
    return { kind: "document-path", path: error.path };
  }
  return { kind: "whole-document" };
}

/*
 * 変換を元の型（`DocumentJsonError` / `DesignDocumentValidationError`）側ではなく
 * ここに置いているのは、`libs/` と `src/domains/` から feature を import できないため。
 * 生成の語彙を `create` に揃えられない代わりに、何から作るかを名前に出している。
 */
export const DocumentError = {
  fromJsonErrors(
    errors: readonly DocumentJsonError[],
  ): readonly DocumentError[] {
    return errors.map((error) => ({
      kind: error.kind,
      message: error.message,
      location: locationOf(error),
    }));
  },

  fromValidationErrors(
    errors: readonly DesignDocumentValidationError[],
  ): readonly DocumentError[] {
    return errors.map((error) => ({
      kind: error.kind,
      message: error.message,
      location: {
        kind: "node",
        nodeName: error.nodeName,
        ...(error.prop !== undefined ? { prop: error.prop } : {}),
      },
    }));
  },

  /**
   * 組み立て済みのドキュメント自身の不正を集める。
   *
   * テキストの解釈を挟まないので、ファイルから読んだ内容にも、アプリ内の編集で
   * 作ったドキュメントにも同じように使える（#128）。
   */
  fromDocument(document: DesignDocument): readonly DocumentError[] {
    return DocumentError.fromValidationErrors(
      DesignDocument.collectErrors(document),
    );
  },
} as const;
