import { expectTypeOf, test } from "vitest";
import type { Props } from "@/domains/dcmp/node";
import type { PrimitiveType } from "@/domains/dcmp/primitive-schema";
import type { ResolvedProps } from "@/domains/dcmp/resolved-props";
import type { Size } from "../index";

type SizeReaderProps = Parameters<typeof Size.fromProps>[0] &
  Parameters<typeof Size.fixedLengthFromProps>[0] &
  Parameters<typeof Size.declarationsFromProps>[0] &
  Parameters<typeof Size.collectInvertedLimitAxes>[0];

test("既定を当てる前の props のまま流れてきた値は、サイズを組み立てる入口に渡せない", () => {
  expectTypeOf<Props>().not.toExtend<Parameters<typeof Size.fromProps>[0]>();
});

test("既定を当てる前の props のまま流れてきた値は、固定の長さを読む入口に渡せない", () => {
  expectTypeOf<Props>().not.toExtend<
    Parameters<typeof Size.fixedLengthFromProps>[0]
  >();
});

test("既定を当てる前の props のまま流れてきた値は、サイズの宣言を作る入口に渡せない", () => {
  expectTypeOf<Props>().not.toExtend<
    Parameters<typeof Size.declarationsFromProps>[0]
  >();
});

test("既定を当てる前の props のまま流れてきた値は、下限と上限の逆転を集める入口に渡せない", () => {
  expectTypeOf<Props>().not.toExtend<
    Parameters<typeof Size.collectInvertedLimitAxes>[0]
  >();
});

test("既定を当てた props はサイズの読み出しに渡せる", () => {
  expectTypeOf<ResolvedProps<"Box">>().toExtend<SizeReaderProps>();
  expectTypeOf<ResolvedProps<"Ellipse">>().toExtend<SizeReaderProps>();
  expectTypeOf<ResolvedProps<PrimitiveType>>().toExtend<SizeReaderProps>();
});

test("fill を集める・写す入口は、書かれたままの props を受け取る", () => {
  expectTypeOf<Props>().toExtend<Parameters<typeof Size.collectFillAxes>[0]>();
  expectTypeOf<Props>().toExtend<
    Parameters<typeof Size.collectFillPropEdits>[0]
  >();
  expectTypeOf<Props>().toExtend<
    Parameters<typeof Size.collectFillModePropEdits>[0][number]
  >();
  expectTypeOf<Props>().toExtend<
    Parameters<typeof Size.collectFillAxesInFreeParent>[0]
  >();
});
