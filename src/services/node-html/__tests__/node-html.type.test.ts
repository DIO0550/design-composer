import { expectTypeOf, test } from "vitest";
import type { CompiledElement, Direction } from "../index";

test("Direction は Box スキーマの direction が取り得る値と一致する", () => {
  expectTypeOf<Direction>().toEqualTypeOf<"row" | "column">();
});

test("Box の要素は子を持ちテキストを持たない", () => {
  type BoxElement = Extract<CompiledElement, { kind: "box" }>;

  expectTypeOf<BoxElement>().toHaveProperty("children");
  expectTypeOf<BoxElement>().not.toHaveProperty("content");
});

test("Text の要素はテキストを持ち子を持たない", () => {
  type TextElement = Extract<CompiledElement, { kind: "text" }>;

  expectTypeOf<TextElement>().toHaveProperty("content");
  expectTypeOf<TextElement>().not.toHaveProperty("children");
});
