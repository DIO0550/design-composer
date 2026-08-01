import { expectTypeOf, test } from "vitest";
import type { DesignDocument, DesignDocumentV1 } from "../index";

test("アプリが扱うドキュメントは現在の版のドキュメントを指す", () => {
  expectTypeOf<DesignDocument>().toEqualTypeOf<DesignDocumentV1>();
});
