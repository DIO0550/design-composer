import { Artboard } from "@/domains/artboard";
import { DesignDocument } from "@/domains/design-document";
import type { OpenedDocument } from "@/domains/opened-document";
import { DocumentJson } from "@/libs/document-json";

/** artboard を 1 枚だけ持つドキュメント。名前の違いがドキュメントの違いになる。 */
export function artboardDocument(name: string): DesignDocument {
  return DesignDocument.create({
    artboards: [Artboard.create({ name, width: 360, height: 240 })],
  });
}

/**
 * ファイルに載っている状態の `artboardDocument`。
 *
 * ここだけ `libs/` に触れるのは、「ファイルに載っている綴り」がまさに外部フォーマットの
 * 境界だから（`src/domains/` の production からの libs 依存は 0 件のまま）。
 *
 * @param name 収める artboard の名前
 * @returns そのドキュメントを保存したときのファイルの中身
 */
export function artboardContent(name: string): string {
  return DocumentJson.serialize(artboardDocument(name));
}

/**
 * 保存先だけが違う、開いているドキュメント。
 * パスの分解（`OpenedDocument.fileName` / `folderName`）と上部バーの表示は
 * どちらも中身に依らないので、同じものを両方から使う。
 *
 * @param path 保存先のパス
 * @returns そのパスに置かれている、中身が固定のドキュメント
 */
export function openedAt(path: string): OpenedDocument {
  return { path, document: artboardDocument("home") };
}
