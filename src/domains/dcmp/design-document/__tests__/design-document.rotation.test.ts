import { expect, test } from "vitest";
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
