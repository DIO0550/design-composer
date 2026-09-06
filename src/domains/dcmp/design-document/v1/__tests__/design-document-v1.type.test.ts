import { expectTypeOf, test } from "vitest";
import type { DesignDocumentV1 } from "../index";

test("この版のドキュメントは自分の major 以外を名乗れない", () => {
  type Version = DesignDocumentV1["formatVersion"];

  expectTypeOf<{ major: 1; minor: number }>().toExtend<Version>();
  expectTypeOf<{ major: 0; minor: number }>().not.toExtend<Version>();
  expectTypeOf<{ major: 2; minor: number }>().not.toExtend<Version>();
});

test("同じ major の中で minor は幅を持つ", () => {
  type Version = DesignDocumentV1["formatVersion"];

  expectTypeOf<{ major: 1; minor: 0 }>().toExtend<Version>();
  expectTypeOf<{ major: 1; minor: 7 }>().toExtend<Version>();
});
