import {
  DesignDocument,
  type DesignDocumentValidationError,
  type DesignDocumentValidationErrorKind,
} from "@/domains/dcmp/design-document";
import type { JsonDecodeErrorKind } from "@/utils/Json";
import { Option } from "@/utils/Option";

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

export const DocumentErrorLocation = {
  /**
   * その場所が指しているノードの名前。エラー行から飛べる先があるかの判断に使う。
   *
   * @param location エラーが指している場所
   * @returns ノードを指しているならその名前。テキストの文字位置・ドキュメント内の
   *   パス・ファイル全体を指すものは、飛べるノードが決まらないので `none`
   */
  nodeName(location: DocumentErrorLocation): Option<string> {
    return location.kind === "node"
      ? Option.some(location.nodeName)
      : Option.none;
  },
} as const;

/**
 * 画面に出すエラーの種別。テキストの解釈由来とスキーマ検証由来の両方を含む。
 *
 * 字句スキャン（`syntax-error` / `duplicate-key`）と版の解決（`unsupported-*` 以下 3 つ）の
 * 綴りを直接並べているのは、それらを報告する `libs/` をドメインから import できないため。
 * 一致は `libs/document-json` 側の型テスト（`document-json.type.test.ts`）が固定する。
 *
 * Why not: 出どころから導出する（`json-lexical-scanner` / `document-migration` の kind ごと
 * `src/domains/` へ移す）ことはしない。libs の境界の掃除（#247）の範囲を超えるため。
 */
export type DocumentErrorKind =
  | "syntax-error"
  | "duplicate-key"
  | "unsupported-format-version"
  | "missing-migration-step"
  | "migration-step-failed"
  | JsonDecodeErrorKind
  | DesignDocumentValidationErrorKind;

/**
 * 不正なファイルを画面に出すための 1 件のエラー（docs/03-schema.md「不正ファイル時の挙動」）。
 *
 * テキストの解釈（`libs/document-json`）とスキーマ検証（`DesignDocument.collectErrors`）は
 * 別々の形で失敗を返すが、仕様が画面に求めるのは 1 本の「エラー一覧」なので、
 * 表示側が 2 系統に分岐しなくて済むよう、どちらもこの形へ揃えてから渡す。
 * 揃える処理は失敗を報告する側が持つ（テキストの解釈は `libs/document-json`、
 * スキーマ検証は `collectFrom`）。
 */
export type DocumentError = Readonly<{
  kind: DocumentErrorKind;
  message: string;
  location: DocumentErrorLocation;
}>;

/**
 * スキーマ検証の失敗は、どのノードの（あれば）どの prop かを指す。
 *
 * @param errors スキーマ検証が報告した失敗の並び
 * @returns ノードを指すエラーの並び
 */
function fromValidationErrors(
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
}

export const DocumentError = {
  /**
   * 組み立て済みのドキュメント自身の不正を集める。
   *
   * テキストの解釈を挟まないので、ファイルから読んだ内容にも、アプリ内の編集で
   * 作ったドキュメントにも同じように使える（#128）。
   * `from*` ではなく `collect*` なのは、変換ではなく走査して集めるため。
   *
   * @param document 不正を集める対象のドキュメント
   * @returns 見つかった不正の並び。不正が無ければ空
   */
  collectFrom(document: DesignDocument): readonly DocumentError[] {
    return fromValidationErrors(DesignDocument.collectErrors(document));
  },
} as const;
