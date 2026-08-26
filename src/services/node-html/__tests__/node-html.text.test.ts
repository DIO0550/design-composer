import { expect, test } from "vitest";
import type { ExpandedNode } from "@/domains/dcmp/expanded-node";
import { Result } from "@/utils/Result";
import { type CompiledElement, NodeHtml } from "../index";

function compile(node: ExpandedNode): CompiledElement {
  return Result.unwrap(NodeHtml.compile(node));
}

test("Text は typography トークンを各 CSS プロパティへ展開する", () => {
  const compiled = compile({
    name: "title",
    type: "Text",
    props: { typography: "heading" },
  });

  expect(compiled.style["font-size"]).toBe(
    "var(--typography-heading-font-size)",
  );
  expect(compiled.style["line-height"]).toBe(
    "var(--typography-heading-line-height)",
  );
  expect(compiled.style["font-weight"]).toBe(
    "var(--typography-heading-font-weight)",
  );
  expect(compiled.style["font-family"]).toBe(
    "var(--typography-heading-font-family)",
  );
});

test("Text の色はトークンを参照する color になる", () => {
  const compiled = compile({
    name: "label",
    type: "Text",
    props: { color: "primary" },
  });

  expect(compiled.style.color).toBe("var(--colors-primary)");
});

test("Text の align は text-align になる", () => {
  const compiled = compile({
    name: "label",
    type: "Text",
    props: { align: "center" },
  });

  expect(compiled.style["text-align"]).toBe("center");
});

test("Text の content は要素のテキストとして出力される", () => {
  const compiled = compile({
    name: "label",
    type: "Text",
    props: { content: "こんにちは" },
  });

  expect(compiled.kind === "text" && compiled.content).toBe("こんにちは");
});

test("content を指定しない Text は空文字になる", () => {
  const compiled = compile({ name: "label", type: "Text" });

  expect(compiled.kind === "text" && compiled.content).toBe("");
});

test("未指定の Text はスキーマのデフォルトトークンで出力される", () => {
  const compiled = compile({ name: "label", type: "Text" });

  expect(compiled.style).toEqual({
    "font-size": "var(--typography-body-font-size)",
    "line-height": "var(--typography-body-line-height)",
    "font-weight": "var(--typography-body-font-weight)",
    "font-family": "var(--typography-body-font-family)",
    color: "var(--colors-gray-900)",
    "text-align": "left",
  });
});

test("Text は flex コンテナにはならない", () => {
  const compiled = compile({ name: "label", type: "Text" });

  expect(compiled.style).not.toHaveProperty("display");
});
