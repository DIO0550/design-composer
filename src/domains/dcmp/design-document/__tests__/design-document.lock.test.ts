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

test("根がロックした部品のインスタンスは、自身ではロックされていない", () => {
  const document = DesignDocument.create({
    components: {
      frozen: { type: "Box", props: { locking: "locked" }, children: [] },
    },
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "instance", ref: "frozen" }],
      },
    ],
  });

  expect(DesignDocument.isLocked(document, "instance")).toBe(false);
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

/** `home` の直下に、部品 `primary-button` のインスタンスを 1 つ置く。 */
function setupInstanceDocument(
  instance: Readonly<{
    locking?: string;
    overrides?: Readonly<Record<string, string>>;
  }>,
): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "login", ref: "primary-button", ...instance },
          { name: "free-title", type: "Text" },
        ],
      },
    ],
  });
}

test("ロックと書いたインスタンスはロックされている", () => {
  const document = setupInstanceDocument({ locking: "locked" });

  expect(DesignDocument.isLocked(document, "login")).toBe(true);
});

test("公開 prop の上書きにロックと書いたインスタンスはロックされていない", () => {
  const document = setupInstanceDocument({ overrides: { locking: "locked" } });

  expect(DesignDocument.isLocked(document, "login")).toBe(false);
});

test("ロックしたインスタンスは選びうる名前から落ちる", () => {
  const document = setupInstanceDocument({ locking: "locked" });

  expect(
    DesignDocument.collectUnlockedNodeNames(document, ["login", "free-title"]),
  ).toEqual(["free-title"]);
});

test("語彙に無い綴りのロックを書いたインスタンスはロックされていない", () => {
  const document = setupInstanceDocument({ locking: "frozen" });

  expect(DesignDocument.isLocked(document, "login")).toBe(false);
});
