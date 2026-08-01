import { expect, test } from "vitest";
import { FormatVersion } from "@/domains/format-version";
import { TEXT_SCHEMA } from "@/domains/primitive-schema";
import { TokenSet } from "@/domains/token";
import { DesignDocument, DocumentTemplate } from "../index";

test("テンプレートから作った新規ドキュメントは artboard を1つも持たない", () => {
  const document = DesignDocument.createFromTemplate(DocumentTemplate.DEFAULT);

  expect(document.artboards).toEqual([]);
});

test("テンプレートから作った新規ドキュメントはテンプレートのトークンを引き継ぐ", () => {
  const template = DocumentTemplate.DEFAULT;

  const document = DesignDocument.createFromTemplate(template);

  expect(document.tokens).toEqual(template.tokens);
});

test("テンプレートから作った新規ドキュメントはテンプレートの部品を引き継ぐ", () => {
  const template = DocumentTemplate.DEFAULT;

  const document = DesignDocument.createFromTemplate(template);

  expect(document.components).toEqual(template.components);
});

test("テンプレートから作った新規ドキュメントは現在の formatVersion を名乗る", () => {
  const document = DesignDocument.createFromTemplate(DocumentTemplate.DEFAULT);

  expect(document.formatVersion).toEqual(FormatVersion.CURRENT);
});

test("既定のテンプレートから作った新規ドキュメントはバリデーションを通る", () => {
  const document = DesignDocument.createFromTemplate(DocumentTemplate.DEFAULT);

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("Text の typography デフォルトが指すトークンは既定のテンプレートに存在する", () => {
  const { tokens } = DocumentTemplate.DEFAULT;
  const definition = TEXT_SCHEMA.props.typography;

  expect(TokenSet.has(tokens, definition.tokenKind, definition.default)).toBe(
    true,
  );
});

test("Text の color デフォルトが指すトークンは既定のテンプレートに存在する", () => {
  const { tokens } = DocumentTemplate.DEFAULT;
  const definition = TEXT_SCHEMA.props.color;

  expect(TokenSet.has(tokens, definition.tokenKind, definition.default)).toBe(
    true,
  );
});
