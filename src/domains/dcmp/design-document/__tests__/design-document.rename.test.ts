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

test("ドキュメントで使われていない名前はそのまま使える", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "screen", width: 375, height: 812, children: [] }],
  });

  expect(DesignDocument.uniqueName(document, "login-form")).toBe("login-form");
});

test("artboard 名と衝突する名前には連番が付く", () => {
  const document = DesignDocument.create({
    artboards: [{ name: "login-form", width: 375, height: 812, children: [] }],
  });

  expect(DesignDocument.uniqueName(document, "login-form")).toBe(
    "login-form-2",
  );
});
