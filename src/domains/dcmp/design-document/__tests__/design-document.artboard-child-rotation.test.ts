import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("回した artboard 直下の子は、その子に書いた角度で並ぶ", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "card", type: "Box", props: { rotation: 30 } }],
      },
    ],
  });

  expect(DesignDocument.collectArtboardChildRotations(document)).toEqual([
    { name: "card", rotation: 30 },
  ]);
});

test("回していない artboard 直下の子は、角度 0 で並ぶ", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "label", type: "Text", props: {} }],
      },
    ],
  });

  expect(DesignDocument.collectArtboardChildRotations(document)).toEqual([
    { name: "label", rotation: 0 },
  ]);
});

test("artboard の並び順・子の並び順のまま並び、孫は入らない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "card",
            type: "Box",
            props: { rotation: 10 },
            children: [{ name: "badge", type: "Text", props: { rotation: 5 } }],
          },
          { name: "footer", type: "Text", props: { rotation: 20 } },
        ],
      },
      {
        name: "about",
        width: 360,
        height: 240,
        children: [{ name: "title", type: "Text", props: { rotation: 30 } }],
      },
    ],
  });

  expect(DesignDocument.collectArtboardChildRotations(document)).toEqual([
    { name: "card", rotation: 10 },
    { name: "footer", rotation: 20 },
    { name: "title", rotation: 30 },
  ]);
});

test("参照先の部品が無いインスタンスは、向きが決まらないので並びに入らない", () => {
  // 対照を 1 件置く。`[]` を期待すると何も返さない実装でも通る
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "orphan", ref: "missing" },
          { name: "label", type: "Text", props: { rotation: 15 } },
        ],
      },
    ],
  });

  expect(DesignDocument.collectArtboardChildRotations(document)).toEqual([
    { name: "label", rotation: 15 },
  ]);
});
