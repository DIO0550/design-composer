import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { Option } from "@/utils/Option";

/**
 * `home` の直下に `panel`（中にロックした `sealed` > ロックした `inner` > ロックしていないと
 * 書いた Box の `nested`、その後ろに Text の `after`）、子を 1 つ持つ `open`、ロックした Text の
 * `locked-title`、ロックした部品インスタンスの `login` が並ぶ。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "panel",
            type: "Box",
            children: [
              {
                name: "sealed",
                type: "Box",
                props: { locking: "locked" },
                children: [
                  {
                    name: "inner",
                    type: "Box",
                    props: { locking: "locked" },
                    children: [
                      {
                        name: "nested",
                        type: "Box",
                        props: { locking: "unlocked" },
                      },
                    ],
                  },
                ],
              },
              { name: "after", type: "Text" },
            ],
          },
          {
            name: "open",
            type: "Box",
            children: [{ name: "open-title", type: "Text" }],
          },
          {
            name: "locked-title",
            type: "Text",
            props: { locking: "locked" },
          },
          { name: "login", ref: "primary-button", locking: "locked" },
        ],
      },
    ],
  });
}

test("ロックした Box を起点に足す位置は、その Box の直後になる", () => {
  expect(DesignDocument.insertPositionOf(setupDocument(), "sealed")).toEqual(
    Option.some({ parentName: "panel", index: 1 }),
  );
});

test("ロックした Box の中のロックした Box を起点に足す位置は、最も外側のロックの直後になる", () => {
  expect(DesignDocument.insertPositionOf(setupDocument(), "inner")).toEqual(
    Option.some({ parentName: "panel", index: 1 }),
  );
});

test("祖先がロックしている Box は、自身にロックしていないと書いてあっても最も外側のロックの直後になる", () => {
  expect(DesignDocument.insertPositionOf(setupDocument(), "nested")).toEqual(
    Option.some({ parentName: "panel", index: 1 }),
  );
});

test("ロックしていない Box を起点に足す位置は、その Box の子の末尾になる", () => {
  expect(DesignDocument.insertPositionOf(setupDocument(), "open")).toEqual(
    Option.some({ parentName: "open", index: 1 }),
  );
});

test("artboard を起点に足す位置は、artboard の子の末尾になる", () => {
  expect(DesignDocument.insertPositionOf(setupDocument(), "home")).toEqual(
    Option.some({ parentName: "home", index: 4 }),
  );
});

test("ロックした Text には、子を持てないので足す位置が無い", () => {
  expect(
    DesignDocument.insertPositionOf(setupDocument(), "locked-title"),
  ).toEqual(Option.none);
});

test("ロックした部品インスタンスには、子を持てないので足す位置が無い", () => {
  expect(DesignDocument.insertPositionOf(setupDocument(), "login")).toEqual(
    Option.none,
  );
});

test("ドキュメントに無い名前には足す位置が無い", () => {
  expect(DesignDocument.insertPositionOf(setupDocument(), "missing")).toEqual(
    Option.none,
  );
});
