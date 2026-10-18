import { expect, test } from "vitest";
import { Angle } from "@/domains/unit/angle";
import { Option } from "@/utils/Option";
import { DesignDocument } from "../index";

/**
 * 30 度回した `card` の中に、さらに 15 度回した `badge` と、回していない `label` が
 * 入っているドキュメント。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: {
      tilted: { type: "Box", props: { rotation: 45 }, children: [] },
    },
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "card",
            type: "Box",
            props: { rotation: 30 },
            children: [
              { name: "badge", type: "Text", props: { rotation: 15 } },
              { name: "label", type: "Text", props: {} },
            ],
          },
          { name: "instance", ref: "tilted" },
        ],
      },
    ],
  });
}

test("回したノードの向きは、そのノードに書いた角度になる", () => {
  expect(DesignDocument.rotationOf(setupDocument(), "card")).toEqual(
    Option.some(30),
  );
});

test("部品インスタンスの向きは、部品の根に書いた角度になる", () => {
  expect(DesignDocument.rotationOf(setupDocument(), "instance")).toEqual(
    Option.some(45),
  );
});

test("artboard は回っていない", () => {
  expect(DesignDocument.rotationOf(setupDocument(), "home")).toEqual(
    Option.some(0),
  );
});

test("ドキュメントに無い名前の向きは引けない", () => {
  expect(DesignDocument.rotationOf(setupDocument(), "missing")).toEqual(
    Option.none,
  );
});

test("回った Box の中で自分も回した子は、親と自分の角度の合計だけ回って描かれる", () => {
  expect(DesignDocument.totalRotationOf(setupDocument(), "badge")).toEqual(
    Option.some(45),
  );
});

test("回った Box の中の回していない子は、親の角度だけ回って描かれる", () => {
  expect(DesignDocument.totalRotationOf(setupDocument(), "label")).toEqual(
    Option.some(30),
  );
});

test("ドキュメントに無い名前の画面上の向きは引けない", () => {
  expect(DesignDocument.totalRotationOf(setupDocument(), "missing")).toEqual(
    Option.none,
  );
});

test("3 段の入れ子で角度の合計が 1 回りの倍数になるノードは、回っていない向きになる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "outer",
            type: "Box",
            props: { rotation: -0.1 },
            children: [
              {
                name: "parent",
                type: "Box",
                props: { rotation: -0.2 },
                children: [
                  { name: "self", type: "Text", props: { rotation: 0.3 } },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  // 合計は丸めで -0 になりうるので、0 との toEqual ではなく 360 度の倍数かで見る
  expect(
    Option.map(
      DesignDocument.totalRotationOf(document, "self"),
      Angle.isWholeTurns,
    ),
  ).toEqual(Option.some(true));
});

test("-128.3 度の子と 15.8 度の Box の合計は、端数の無い -112.5 度になる", () => {
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
            props: { rotation: 15.8 },
            children: [
              { name: "badge", type: "Text", props: { rotation: -128.3 } },
            ],
          },
        ],
      },
    ],
  });

  expect(DesignDocument.totalRotationOf(document, "badge")).toEqual(
    Option.some(-112.5),
  );
});
