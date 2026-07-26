import { expect, test } from "vitest";
import { CssDeclaration, CssDeclarations } from "../index";

test("1宣言は プロパティ:値 の形に直列化される", () => {
  const declaration = CssDeclaration.create("display", "flex");

  expect(CssDeclaration.text(declaration)).toBe("display:flex");
});

test("宣言の並びはプロパティ名から値を引ける形にまとまる", () => {
  const declarations = CssDeclarations.from([
    CssDeclaration.create("display", "flex"),
    CssDeclaration.create("gap", "var(--spacing-md)"),
  ]);

  expect(declarations).toEqual({
    display: "flex",
    gap: "var(--spacing-md)",
  });
});

test("同じプロパティが複数あるときは後の宣言が優先される", () => {
  const declarations = CssDeclarations.from([
    CssDeclaration.create("width", "fit-content"),
    CssDeclaration.create("width", "320px"),
  ]);

  expect(declarations).toEqual({ width: "320px" });
});

test("宣言の並びは ; 区切りで style 属性の形に直列化される", () => {
  const declarations = CssDeclarations.from([
    CssDeclaration.create("display", "flex"),
    CssDeclaration.create("flex-direction", "row"),
  ]);

  expect(CssDeclarations.toStyleText(declarations)).toBe(
    "display:flex;flex-direction:row",
  );
});

test("宣言を持たない style は空文字になる", () => {
  expect(CssDeclarations.toStyleText(CssDeclarations.from([]))).toBe("");
});

test("まとめた宣言は元の並び順のまま取り出せる", () => {
  const source = [
    CssDeclaration.create("display", "flex"),
    CssDeclaration.create("gap", "var(--spacing-md)"),
  ];

  expect(CssDeclarations.entries(CssDeclarations.from(source))).toEqual(source);
});
