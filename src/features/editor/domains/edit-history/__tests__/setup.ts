import { DesignDocument } from "@/domains/design-document";

/**
 * artboard を 1 枚だけ持つドキュメント。幅の違いで「どの版か」を見分ける。
 *
 * @param width その版を見分けるための artboard の幅
 * @returns その幅の artboard を 1 枚だけ持つドキュメント
 */
export function documentOfWidth(width: number): DesignDocument {
  return DesignDocument.create({
    artboards: [{ name: "home", width, height: 812, children: [] }],
  });
}
