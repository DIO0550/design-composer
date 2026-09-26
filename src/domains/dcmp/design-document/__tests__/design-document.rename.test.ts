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
