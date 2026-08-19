import { Artboard } from "@/domains/artboard";
import { DesignDocument } from "@/domains/design-document";
import { DocumentJson } from "@/libs/document-json";

/** artboard を 1 枚だけ持つドキュメント。外部変更の前後の違いを名前で表す。 */
export function artboardDocument(name: string): DesignDocument {
  return DesignDocument.create({
    artboards: [Artboard.create({ name, width: 360, height: 240 })],
  });
}

/** 外部エディタが書いたファイルの中身として、正しいドキュメントのテキストを作る。 */
export function artboardContent(name: string): string {
  return DocumentJson.serialize(artboardDocument(name));
}

/**
 * 正しいドキュメントの JSON 表現。
 * 不正な内容のテストは、これを 1 箇所だけ壊してファイルの中身を作る。
 */
export function artboardJson(): Record<string, unknown> {
  return {
    formatVersion: "1.0",
    tokens: {},
    components: {},
    artboards: [{ name: "home", width: 360, height: 240, children: [] }],
  };
}

/** JSON をファイルの中身のテキストにする。 */
export function contentOf(document: unknown): string {
  return `${JSON.stringify(document, null, 2)}\n`;
}
