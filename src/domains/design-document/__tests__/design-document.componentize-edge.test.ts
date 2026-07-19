import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("存在しないノード名を指定して部品化しようとするとエラーになる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  expect(() =>
    DesignDocument.createComponent(document, "missing", "card"),
  ).toThrow();
});

test("既存の部品名と衝突する名前を指定して部品化しようとするとエラーになる", () => {
  const box = { name: "box-1", type: "Box" };
  const document = DesignDocument.create({
    components: { card: { type: "Box" } },
    artboards: [{ name: "screen", width: 375, height: 812, children: [box] }],
  });

  expect(() =>
    DesignDocument.createComponent(document, "box-1", "card"),
  ).toThrow();
});

test("既存のノード名と衝突する名前を指定して部品化しようとするとエラーになる", () => {
  const box = { name: "box-1", type: "Box" };
  const label = { name: "label", type: "Text" };
  const document = DesignDocument.create({
    artboards: [
      { name: "screen", width: 375, height: 812, children: [box, label] },
    ],
  });

  expect(() =>
    DesignDocument.createComponent(document, "box-1", "label"),
  ).toThrow();
});

test("既存の artboard 名と衝突する名前を指定して部品化しようとするとエラーになる", () => {
  const box = { name: "box-1", type: "Box" };
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [box] }],
  });

  expect(() =>
    DesignDocument.createComponent(document, "box-1", "screen"),
  ).toThrow();
});

test("ref ノードを部品化しようとするとエラーになる", () => {
  const document = DesignDocument.create({
    components: { button: { type: "Box" } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "button-1", ref: "button" }],
      },
    ],
  });

  expect(() =>
    DesignDocument.createComponent(document, "button-1", "card"),
  ).toThrow();
});
