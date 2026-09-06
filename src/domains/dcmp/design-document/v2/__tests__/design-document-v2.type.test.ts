import { expectTypeOf, test } from "vitest";
import type { DesignDocumentV2 } from "../index";

test("この版のドキュメントは自分の major 以外を名乗れない", () => {
  type Version = DesignDocumentV2["formatVersion"];

  expectTypeOf<{ major: 2; minor: number }>().toExtend<Version>();
  expectTypeOf<{ major: 1; minor: number }>().not.toExtend<Version>();
  expectTypeOf<{ major: 3; minor: number }>().not.toExtend<Version>();
});

test("同じ major の中で minor は幅を持つ", () => {
  type Version = DesignDocumentV2["formatVersion"];

  expectTypeOf<{ major: 2; minor: 0 }>().toExtend<Version>();
  expectTypeOf<{ major: 2; minor: 7 }>().toExtend<Version>();
});
