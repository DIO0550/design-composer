import { expectTypeOf, test } from "vitest";
import type { ArtboardBoxProps } from "../index";

test("artboard のサイズは型の上でも fixed に固定される", () => {
  expectTypeOf<ArtboardBoxProps["widthMode"]>().toEqualTypeOf<"fixed">();
  expectTypeOf<ArtboardBoxProps["heightMode"]>().toEqualTypeOf<"fixed">();
});

test("artboard は長さを必ず数値で持つ", () => {
  expectTypeOf<ArtboardBoxProps["width"]>().toEqualTypeOf<number>();
  expectTypeOf<ArtboardBoxProps["height"]>().toEqualTypeOf<number>();
});
