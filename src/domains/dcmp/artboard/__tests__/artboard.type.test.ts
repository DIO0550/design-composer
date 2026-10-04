import { expectTypeOf, test } from "vitest";
import type { ResolvedProps } from "@/domains/dcmp/resolved-props";
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

test("artboard の表示 / 非表示は型の上でも Box と同じく絞られていない", () => {
  expectTypeOf<ArtboardBoxProps["visibility"]>().toEqualTypeOf<
    ResolvedProps<"Box">["visibility"]
  >();
});

test("artboard の回転は型でも回らない値に絞られている", () => {
  expectTypeOf<ArtboardBoxProps["rotation"]>().toEqualTypeOf<0>();
});

test("artboard のロックは型でも unlocked に絞られている", () => {
  expectTypeOf<ArtboardBoxProps["locking"]>().toEqualTypeOf<"unlocked">();
});
