import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("artboard の名前を指すとその artboard が得られる", () => {
  const home = { name: "home", width: 375, height: 812, children: [] };
  const document = DesignDocument.create({
    artboards: [
      home,
      { name: "settings", width: 375, height: 812, children: [] },
    ],
  });

  const found = DesignDocument.findArtboard(document, "home");

  expect(found).toEqual({ some: true, value: home });
});

test("artboard に無い名前を指すと見つからない", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "home", width: 375, height: 812, children: [] }],
  });

  const found = DesignDocument.findArtboard(document, "settings");

  expect(found.some).toBe(false);
});

test("artboard 配下のノード名は artboard としては見つからない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [{ name: "title", type: "Text" }],
      },
    ],
  });

  const found = DesignDocument.findArtboard(document, "title");

  expect(found.some).toBe(false);
});

test("並んでいる artboard の名前を配列順のまま返す", () => {
  // 名前の綴りではなく配列順で返ることを見たいので、辞書順と逆に並べる
  const document = DesignDocument.create({
    artboards: [
      { name: "settings", width: 375, height: 812, children: [] },
      { name: "home", width: 375, height: 812, children: [] },
    ],
  });

  expect(DesignDocument.collectArtboardNames(document)).toEqual([
    "settings",
    "home",
  ]);
});

test("artboard が 1 枚も無ければ名前は 1 つも返らない", () => {
  const document = DesignDocument.create({ artboards: [] });

  expect(DesignDocument.collectArtboardNames(document)).toEqual([]);
});
