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

test("artboard の配置は型でも flow に絞られている", () => {
  expectTypeOf<ArtboardBoxProps["placement"]>().toEqualTypeOf<"flow">();
});

test("artboard の表示 / 非表示は型でも visible に絞られている", () => {
  expectTypeOf<ArtboardBoxProps["visibility"]>().toEqualTypeOf<"visible">();
});
