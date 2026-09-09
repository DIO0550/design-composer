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

test("artboard 直下の子の名前を、artboard の並び順・子の並び順のまま返す", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "settings",
        width: 375,
        height: 812,
        children: [{ name: "toggle", type: "Text", props: { content: "入" } }],
      },
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "header", type: "Box", props: {} },
          { name: "footer", type: "Box", props: {} },
        ],
      },
    ],
  });

  expect(DesignDocument.collectArtboardChildNames(document)).toEqual([
    "toggle",
    "header",
    "footer",
  ]);
});

test("artboard 直下の子の名前に、その孫は含まれない", () => {
  // 孫を混ぜても直下で止まることを見たいので、直下の子を 1 つだけ置いて対照にする
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          {
            name: "card",
            type: "Box",
            props: {},
            children: [
              { name: "label", type: "Text", props: { content: "札" } },
            ],
          },
        ],
      },
    ],
  });

  expect(DesignDocument.collectArtboardChildNames(document)).toEqual(["card"]);
});

test("子を持たない artboard からは名前が 1 つも返らない", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "home", width: 375, height: 812, children: [] }],
  });

  expect(DesignDocument.collectArtboardChildNames(document)).toEqual([]);
});
