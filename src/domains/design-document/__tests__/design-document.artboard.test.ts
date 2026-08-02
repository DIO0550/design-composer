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
