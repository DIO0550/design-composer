import { expect, test } from "vitest";
import { CompiledElement } from "@/domains/compiled/compiled-element";
import { Result } from "@/utils/Result";
import { NodeHtml } from "../index";
import { styleOf } from "./setup";

test("Box は flex コンテナになり、未指定の prop はスキーマのデフォルトで出力される", () => {
  const style = styleOf({ name: "root", type: "Box" });

  expect(style).toEqual({
    display: "flex",
    position: "relative",
    "flex-direction": "column",
    "align-items": "stretch",
    "justify-content": "start",
    width: "fit-content",
    height: "fit-content",
  });
});

test("direction を row にすると横並びになる", () => {
  const style = styleOf({
    name: "row",
    type: "Box",
    props: { direction: "row" },
  });

  expect(style["flex-direction"]).toBe("row");
});

test("gap はトークンを参照する CSS カスタムプロパティになる", () => {
  const style = styleOf({ name: "box", type: "Box", props: { gap: "md" } });

  expect(style.gap).toBe("var(--spacing-md)");
});

test("4辺の padding は 上 右 下 左 の順で padding 1宣言に合成される", () => {
  const style = styleOf({
    name: "box",
    type: "Box",
    props: {
      paddingTop: "xs",
      paddingRight: "sm",
      paddingBottom: "md",
      paddingLeft: "lg",
    },
  });

  expect(style.padding).toBe(
    "var(--spacing-xs) var(--spacing-sm) var(--spacing-md) var(--spacing-lg)",
  );
});

test("下だけを指定すると残りの3辺は 0 になる", () => {
  const style = styleOf({
    name: "box",
    type: "Box",
    props: { paddingBottom: "lg" },
  });

  expect(style.padding).toBe("0 0 var(--spacing-lg) 0");
});

test("右だけを指定すると残りの3辺は 0 になる", () => {
  const style = styleOf({
    name: "box",
    type: "Box",
    props: { paddingRight: "sm" },
  });

  expect(style.padding).toBe("0 var(--spacing-sm) 0 0");
});

test("padding を指定しなければ padding 宣言は出力されない", () => {
  const style = styleOf({ name: "box", type: "Box" });

  expect(style).not.toHaveProperty("padding");
});

test("align と justify はそれぞれ align-items と justify-content になる", () => {
  const style = styleOf({
    name: "box",
    type: "Box",
    props: { align: "center", justify: "space-between" },
  });

  expect(style["align-items"]).toBe("center");
  expect(style["justify-content"]).toBe("space-between");
});

test("background・radius・shadow はそれぞれの種別のトークン参照になる", () => {
  const style = styleOf({
    name: "card",
    type: "Box",
    props: { background: "primary", radius: "md", shadow: "lg" },
  });

  expect(style.background).toBe("var(--colors-primary)");
  expect(style["border-radius"]).toBe("var(--radius-md)");
  expect(style["box-shadow"]).toBe("var(--shadows-lg)");
});

test("overflow を clip にするとはみ出しが隠れる", () => {
  const style = styleOf({
    name: "box",
    type: "Box",
    props: { overflow: "clip" },
  });

  expect(style.overflow).toBe("hidden");
});

test("overflow が visible のときは overflow 宣言を出力しない", () => {
  const style = styleOf({
    name: "box",
    type: "Box",
    props: { overflow: "visible" },
  });

  expect(style).not.toHaveProperty("overflow");
});

test("style は style 属性へ載せられる宣言の並びに直列化できる", () => {
  const compiled = Result.unwrap(
    NodeHtml.compile({
      name: "box",
      type: "Box",
      props: { direction: "row", gap: "md" },
    }),
  );

  expect(CompiledElement.styleText(compiled)).toBe(
    "display:flex;position:relative;flex-direction:row;gap:var(--spacing-md);align-items:stretch;justify-content:start;width:fit-content;height:fit-content",
  );
});
