import { expect, test } from "vitest";
import { DesignDocument } from "../index";

test("使用中の名前を収集すると artboard 名が含まれる", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });
  expect(DesignDocument.usedNames(document).has("screen")).toBe(true);
});

test("使用中の名前を収集するとノードの name が含まれる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "label", type: "Text" }],
      },
    ],
  });
  expect(DesignDocument.usedNames(document).has("label")).toBe(true);
});

test("使用中の名前を収集すると部品名が含まれる", () => {
  const document = DesignDocument.create({
    components: { "primary-button": { type: "Box" } },
  });
  expect(DesignDocument.usedNames(document).has("primary-button")).toBe(true);
});

test("未使用の名前を渡すとそのままの名前が返る", () => {
  const usedNames = new Set(["screen"]);
  expect(DesignDocument.uniqueName("login-form", usedNames)).toBe("login-form");
});

test("使用中の名前を渡すと連番を付与した名前が返る", () => {
  const usedNames = new Set(["login-form"]);
  expect(DesignDocument.uniqueName("login-form", usedNames)).toBe(
    "login-form-2",
  );
});

test("連番の名前も使用中の場合はさらに次の連番を付与した名前が返る", () => {
  const usedNames = new Set(["login-form", "login-form-2"]);
  expect(DesignDocument.uniqueName("login-form", usedNames)).toBe(
    "login-form-3",
  );
});

test("使用中の名前と衝突しないノードはリネームされない", () => {
  const node = { name: "label", type: "Text" };
  const usedNames = new Set(["screen"]);

  const result = DesignDocument.renameSubtree([node], usedNames);

  expect(result.nodes).toEqual([node]);
  expect(result.renameMap).toEqual({ label: "label" });
});

test("使用中の名前と衝突するノードは連番付きの名前にリネームされる", () => {
  const node = { name: "label", type: "Text" };
  const usedNames = new Set(["label"]);

  const result = DesignDocument.renameSubtree([node], usedNames);

  expect(result.nodes).toEqual([{ name: "label-2", type: "Text" }]);
  expect(result.renameMap).toEqual({ label: "label-2" });
});

test("サブツリー内の子孫ノードもまとめてリネームされる", () => {
  const node = {
    name: "box-1",
    type: "Box",
    children: [{ name: "label", type: "Text" }],
  };
  const usedNames = new Set(["box-1", "label"]);

  const result = DesignDocument.renameSubtree([node], usedNames);

  expect(result.nodes).toEqual([
    {
      name: "box-1-2",
      type: "Box",
      children: [{ name: "label-2", type: "Text" }],
    },
  ]);
  expect(result.renameMap).toEqual({
    "box-1": "box-1-2",
    label: "label-2",
  });
});

test("同名を持つ複数ノードをリネームすると互いに衝突しない名前になる", () => {
  const first = { name: "label", type: "Text" };
  const second = { name: "label-2", type: "Text" };
  const usedNames = new Set(["label", "label-2"]);

  const result = DesignDocument.renameSubtree([first, second], usedNames);

  expect(result.nodes).toEqual([
    { name: "label-3", type: "Text" },
    { name: "label-2-2", type: "Text" },
  ]);
});

test("renameSubtree は渡したノードを変更しない", () => {
  const node = { name: "label", type: "Text" };
  const usedNames = new Set(["label"]);

  DesignDocument.renameSubtree([node], usedNames);

  expect(node).toEqual({ name: "label", type: "Text" });
});
