import { Artboard } from "@/domains/artboard";
import { DesignDocument } from "@/domains/design-document";

/** artboard を 1 枚だけ持つドキュメント。名前の違いがドキュメントの違いになる。 */
export function artboardDocument(name: string): DesignDocument {
  return DesignDocument.create({
    artboards: [Artboard.create({ name, width: 360, height: 240 })],
  });
}
