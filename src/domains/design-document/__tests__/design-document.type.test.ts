import { expectTypeOf, test } from "vitest";
import type { DesignDocument, DesignDocumentV1 } from "../index";

test("ドキュメントの型は自分の版以外の major を名乗れない", () => {
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

test("アプリが扱うドキュメントは現在の版のドキュメントを指す", () => {
  expectTypeOf<DesignDocument>().toEqualTypeOf<DesignDocumentV1>();
});
