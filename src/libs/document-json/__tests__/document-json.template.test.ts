import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { Result } from "@/utils/Result";
import { DocumentJson } from "../index";

test("新規ドキュメントは書き出して読み戻しても同じ内容になる", () => {
  const document = DesignDocument.createFromTemplate(
    DocumentTemplate.default(),
  );

  const restored = DocumentJson.parse(DocumentJson.serialize(document));

  expect(Result.unwrap(restored)).toEqual(document);
});

test("読み戻した新規ドキュメントもバリデーションを通る", () => {
  const document = DesignDocument.createFromTemplate(
    DocumentTemplate.default(),
  );

  const restored = DocumentJson.parse(DocumentJson.serialize(document));

  expect(DesignDocument.collectErrors(Result.unwrap(restored))).toEqual([]);
});
