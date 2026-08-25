import { expect, test } from "vitest";
import { Artboard } from "@/domains/artboard";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";
import { documentWithOneArtboard } from "./artboard-edit-setup";

function artboardNames(document: DesignDocument): readonly string[] {
  return document.artboards.map((artboard) => artboard.name);
}

test("artboard を末尾へ挿すと既にある1枚の後ろに並ぶ", () => {
  const document = documentWithOneArtboard();

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
  const document = documentWithOneArtboard();

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
  const removed = Result.unwrap(
    DesignDocument.remove(documentWithOneArtboard(), "home"),
  );

  expect(DesignDocument.usedNames(removed).has("home-title")).toBe(false);
});

test("名前で指したものがノードのときは載せている artboard が残る", () => {
  const removed = Result.unwrap(
    DesignDocument.remove(documentWithOneArtboard(), "home-title"),
  );

  expect(artboardNames(removed)).toEqual(["home"]);
});

test("名前で指したものがノードのときはそのノードだけが消える", () => {
  const removed = Result.unwrap(
    DesignDocument.remove(documentWithOneArtboard(), "home-title"),
  );

  expect(
    Option.unwrap(DesignDocument.findArtboard(removed, "home")).children,
  ).toEqual([]);
});
