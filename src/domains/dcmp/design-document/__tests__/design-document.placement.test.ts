import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { DesignDocument, DocumentTemplate } from "../index";

/**
 * `home` に絶対配置・フロー・部品インスタンス・壊れた座標のノードが並ぶドキュメント。
 * 座標で動かせるのは 1 つだけ、という形にして、答えられない側を数え分ける。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "badge",
            type: "Box",
            props: { placement: "absolute", x: 40, y: 24 },
            children: [],
          },
          { name: "title", type: "Text", props: { content: "ホーム" } },
          {
            name: "broken",
            type: "Box",
            props: { placement: "absolute", x: "40", y: 24 },
            children: [],
          },
          { name: "login", ref: "primary-button", overrides: {} },
        ],
      },
    ],
  });
}

test("絶対配置のノードは今いる親と、その親から見た座標を答える", () => {
  expect(
    Option.unwrap(DesignDocument.childPlacementOf(setupDocument(), "badge")),
  ).toEqual({
    parentName: "home",
    placement: { mode: "absolute", x: 40, y: 24 },
  });
});

test("フローのノードは座標で動かせないので答えない", () => {
  expect(DesignDocument.childPlacementOf(setupDocument(), "title").some).toBe(
    false,
  );
});

test("絶対配置でも座標が数値でなければ答えない", () => {
  // 手で壊した `.dcmp`。`Placement.fromProps` の `undefined` はここで `none` に潰れる
  expect(DesignDocument.childPlacementOf(setupDocument(), "broken").some).toBe(
    false,
  );
});

test("部品インスタンスは props を持たないので答えない", () => {
  expect(DesignDocument.childPlacementOf(setupDocument(), "login").some).toBe(
    false,
  );
});

test("ドキュメントに無い名前は答えない", () => {
  expect(DesignDocument.childPlacementOf(setupDocument(), "居ない").some).toBe(
    false,
  );
});

test("artboard 自身は親の中の座標を持たないので答えない", () => {
  expect(DesignDocument.childPlacementOf(setupDocument(), "home").some).toBe(
    false,
  );
});
