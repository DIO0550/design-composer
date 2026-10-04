import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";

/**
 * `home` の直下に、ロックした Box の `locked-panel`（中に `inner` Box、その中に `unlocked-title`
 * と書いた Text）と、ロックしていない兄弟 `free-title`、部品 `primary-button` のインスタンス
 * `login` が並ぶ。
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
            name: "locked-panel",
            type: "Box",
            props: { locking: "locked" },
            children: [
              {
                name: "inner",
                type: "Box",
                children: [
                  {
                    name: "unlocked-title",
                    type: "Text",
                    props: { locking: "unlocked" },
                  },
                ],
              },
            ],
          },
          { name: "free-title", type: "Text" },
          { name: "login", ref: "primary-button" },
        ],
      },
    ],
  });
}

test("ロックと書いたノードはロックされている", () => {
  expect(DesignDocument.isLocked(setupDocument(), "locked-panel")).toBe(true);
});

test("ロックした Box の子孫はロックされている", () => {
  expect(DesignDocument.isLocked(setupDocument(), "inner")).toBe(true);
});

test("祖先がロックしていれば、自身にロックしていないと書いてもロックされている", () => {
  expect(DesignDocument.isLocked(setupDocument(), "unlocked-title")).toBe(true);
});

test("ロックしたノードの兄弟はロックされていない", () => {
  expect(DesignDocument.isLocked(setupDocument(), "free-title")).toBe(false);
});

test("artboard の名前とドキュメントに無い名前はロックされていないとして答える", () => {
  const document = setupDocument();

  expect([
    DesignDocument.isLocked(document, "home"),
    DesignDocument.isLocked(document, "missing"),
  ]).toEqual([false, false]);
});

test("選びうる名前からはロック中のノードとその子孫が落ち、残りは渡した順のまま残る", () => {
  const names = DesignDocument.collectUnlockedNodeNames(setupDocument(), [
    "login",
    "unlocked-title",
    "inner",
    "locked-panel",
    "free-title",
  ]);

  expect(names).toEqual(["login", "free-title"]);
});

test("選びうる名前からは artboard 自身・部品定義の中のノード・無い名前も落ちる", () => {
  const names = DesignDocument.collectUnlockedNodeNames(setupDocument(), [
    "primary-button-label",
    "missing",
    "free-title",
    "home",
  ]);

  expect(names).toEqual(["free-title"]);
});
