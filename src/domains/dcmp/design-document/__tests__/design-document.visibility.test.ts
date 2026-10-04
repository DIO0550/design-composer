import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";

/**
 * 表示の `home` の直下に、非表示の Box の `hidden-panel`（中に `visible` と書いた Text の
 * `visible-title` と、部品 `primary-button` のインスタンス `hidden-login`）、非表示の子
 * `hidden-badge` を持つ表示の Box の `shown-panel` が並ぶ。非表示の artboard `draft` の
 * 直下には `draft-title` がある。`home` の直下には、根が非表示の部品 `ghost` のインスタンス
 * `ghost-instance` と、根が表示の部品 `primary-button` のインスタンス `shown-login` もある。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: {
      ...DocumentTemplate.Default.components,
      ghost: { type: "Box", props: { visibility: "hidden" }, children: [] },
    },
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "hidden-panel",
            type: "Box",
            props: { visibility: "hidden" },
            children: [
              {
                name: "visible-title",
                type: "Text",
                props: { visibility: "visible" },
              },
              { name: "hidden-login", ref: "primary-button" },
            ],
          },
          {
            name: "shown-panel",
            type: "Box",
            children: [
              {
                name: "hidden-badge",
                type: "Text",
                props: { visibility: "hidden" },
              },
            ],
          },
          { name: "ghost-instance", ref: "ghost" },
          { name: "shown-login", ref: "primary-button" },
        ],
      },
      {
        name: "draft",
        width: 360,
        height: 240,
        props: { visibility: "hidden" },
        children: [{ name: "draft-title", type: "Text" }],
      },
    ],
  });
}

test("非表示と書いたノードは非表示である", () => {
  expect(DesignDocument.isHidden(setupDocument(), "hidden-panel")).toBe(true);
});

test("非表示の Box の子孫は、自身に表示と書いていても非表示である", () => {
  expect(DesignDocument.isHidden(setupDocument(), "visible-title")).toBe(true);
});

test("非表示の子を持つ表示の Box は非表示ではない", () => {
  expect(DesignDocument.isHidden(setupDocument(), "shown-panel")).toBe(false);
});

test("非表示の artboard の中のノードは非表示である", () => {
  expect(DesignDocument.isHidden(setupDocument(), "draft-title")).toBe(true);
});

test("非表示の artboard は、artboard 自身も非表示として答える", () => {
  expect(DesignDocument.isHidden(setupDocument(), "draft")).toBe(true);
});

test("非表示の Box の中の部品インスタンスは非表示である", () => {
  expect(DesignDocument.isHidden(setupDocument(), "hidden-login")).toBe(true);
});

test("根が非表示の部品のインスタンスは非表示である", () => {
  expect(DesignDocument.isHidden(setupDocument(), "ghost-instance")).toBe(true);
});

test("根が表示の部品のインスタンスは非表示ではない", () => {
  expect(DesignDocument.isHidden(setupDocument(), "shown-login")).toBe(false);
});

/**
 * 根の表示 / 非表示を `shown` として公開した部品 `toggle`（根は `rootVisibility`）を、
 * `shown` を上書きした `instance` 1 つで置いたドキュメント。
 *
 * @param rootVisibility 部品の根に書く表示 / 非表示
 * @param shown インスタンスが `shown` に書く上書き
 * @returns そのドキュメント
 */
function setupOverriddenInstance(
  rootVisibility: "visible" | "hidden",
  shown: "visible" | "hidden",
): DesignDocument {
  return DesignDocument.create({
    components: {
      toggle: {
        type: "Box",
        props: { visibility: rootVisibility },
        children: [],
        publicProps: { shown: { node: "toggle", prop: "visibility" } },
      },
    },
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "instance", ref: "toggle", overrides: { shown } }],
      },
    ],
  });
}

test("根を上書きで非表示にしたインスタンスは非表示である", () => {
  expect(
    DesignDocument.isHidden(
      setupOverriddenInstance("visible", "hidden"),
      "instance",
    ),
  ).toBe(true);
});

test("非表示の根を上書きで表示にしたインスタンスは非表示ではない", () => {
  expect(
    DesignDocument.isHidden(
      setupOverriddenInstance("hidden", "visible"),
      "instance",
    ),
  ).toBe(false);
});

test("参照先の部品が無いインスタンスは非表示ではないとして答える", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "orphan", ref: "no-such-component" }],
      },
    ],
  });

  expect(DesignDocument.isHidden(document, "orphan")).toBe(false);
});

test("表示の artboard の直下にある、何も書いていないノードは非表示ではない", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: "title", type: "Text" }],
      },
    ],
  });

  expect(DesignDocument.isHidden(document, "title")).toBe(false);
});

test("ドキュメントに無い名前は非表示ではないとして答える", () => {
  expect(DesignDocument.isHidden(setupDocument(), "missing")).toBe(false);
});
