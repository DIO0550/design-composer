import { Artboard } from "@/domains/artboard";
import { DesignDocument } from "@/domains/design-document";

/**
 * 既に 1 枚あり、その 1 枚が子を持つドキュメント。
 *
 * 空のドキュメントを起点にすると「末尾に足す」も「子を持たない」も入力から
 * 自明になり、先頭へ足す実装でも末尾の子を引き継ぐ実装でも通ってしまう。
 *
 * @returns 子を 1 つ持つ artboard を 1 枚だけ持つドキュメント
 */
export function documentWithOneArtboard(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      Artboard.create({
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "home-title", type: "Text" }],
      }),
    ],
  });
}
