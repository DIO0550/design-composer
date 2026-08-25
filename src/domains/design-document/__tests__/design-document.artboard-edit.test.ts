import { expect, test } from "vitest";
import { Artboard } from "@/domains/artboard";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";

/**
 * 既に 1 枚あり、その 1 枚が子を持つドキュメント。
 *
 * 空のドキュメントを起点にすると「末尾に足す」も「子を持たない」も入力から
 * 自明になり、先頭へ足す実装でも末尾の子を引き継ぐ実装でも通ってしまう。
 */
function setupDocument(): DesignDocument {
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

function artboardNames(document: DesignDocument): readonly string[] {
  return document.artboards.map((artboard) => artboard.name);
}

test("artboard を末尾へ挿すと既にある1枚の後ろに並ぶ", () => {
  const document = setupDocument();

  const added = Result.unwrap(
    DesignDocument.insertArtboard(
      document,
      document.artboards.length,
      Artboard.createInitial("artboard"),
    ),
  );

  expect(artboardNames(added)).toEqual(["home", "artboard"]);
});

test("追加直後の artboard は子を持たない", () => {
  const document = setupDocument();

  const added = Result.unwrap(
    DesignDocument.insertArtboard(
      document,
      document.artboards.length,
      Artboard.createInitial("artboard"),
    ),
  );

  expect(
    Option.unwrap(DesignDocument.findArtboard(added, "artboard")).children,
  ).toEqual([]);
});

test("採番の元にする名前が既に使われていると連番が付く", () => {
  const document = DesignDocument.create({
    artboards: [Artboard.createInitial(Artboard.BaseName)],
  });

  const name = DesignDocument.uniqueName(
    Artboard.BaseName,
    DesignDocument.usedNames(document),
  );

  expect(name).not.toBe(Artboard.BaseName);
});

test("名前で指したものが artboard のときはその1枚が配下ごと消える", () => {
  const removed = Result.unwrap(DesignDocument.remove(setupDocument(), "home"));

  expect(DesignDocument.usedNames(removed).has("home-title")).toBe(false);
});

test("名前で指したものがノードのときは載せている artboard が残る", () => {
  const removed = Result.unwrap(
    DesignDocument.remove(setupDocument(), "home-title"),
  );

  expect(artboardNames(removed)).toEqual(["home"]);
});

test("名前で指したものがノードのときはそのノードだけが消える", () => {
  const removed = Result.unwrap(
    DesignDocument.remove(setupDocument(), "home-title"),
  );

  expect(
    Option.unwrap(DesignDocument.findArtboard(removed, "home")).children,
  ).toEqual([]);
});
