import { expect, test } from "vitest";
import type { DesignDocument } from "@/domains/design-document";
import type { Result } from "@/utils/Result";
import type { DocumentJsonError } from "../index";
import { DocumentJson } from "../index";

function errorsOf(
  result: Result<DesignDocument, readonly DocumentJsonError[]>,
): readonly DocumentJsonError[] {
  return result.ok ? [] : result.error;
}

function kindsOf(
  result: Result<DesignDocument, readonly DocumentJsonError[]>,
): readonly string[] {
  return errorsOf(result).map((error) => error.kind);
}

function pathsOf(
  result: Result<DesignDocument, readonly DocumentJsonError[]>,
): readonly (string | undefined)[] {
  return errorsOf(result).map((error) => error.path);
}

test("JSON として壊れているテキストは構文エラーとして報告される", () => {
  const result = DocumentJson.parse(`{ "formatVersion": "1.0", }`);

  expect(kindsOf(result)).toContain("syntax-error");
});

test("キーが重複しているテキストは重複キーとして報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": { "card": { "type": "Box" }, "card": { "type": "Text" } }, "artboards": [] }`;

  const result = DocumentJson.parse(text);

  expect(kindsOf(result)).toEqual(["duplicate-key"]);
});

test("必須のトップレベルフィールドが欠けていると欠落として報告される", () => {
  const result = DocumentJson.parse(`{ "formatVersion": "1.0" }`);

  expect(errorsOf(result)).toEqual([
    { kind: "missing-field", path: "tokens", message: '"tokens" is required' },
    {
      kind: "missing-field",
      path: "components",
      message: '"components" is required',
    },
    {
      kind: "missing-field",
      path: "artboards",
      message: '"artboards" is required',
    },
  ]);
});

test("フィールドの型が違うと不正な型として報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": {} }`;

  const result = DocumentJson.parse(text);

  expect(errorsOf(result)).toEqual([
    {
      kind: "invalid-type",
      path: "artboards",
      message: "expected array but got object",
    },
  ]);
});

test("formatVersion が major.minor 形式でないと不正な型として報告される", () => {
  const text = `{ "formatVersion": "1", "tokens": {}, "components": {}, "artboards": [] }`;

  const result = DocumentJson.parse(text);

  expect(errorsOf(result)).toEqual([
    {
      kind: "invalid-type",
      path: "formatVersion",
      message: 'expected "major.minor" but got "1"',
    },
  ]);
});

test("知らないフィールドは黙って捨てずにエラーとして報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": [], "canvasZoom": 1.5 }`;

  const result = DocumentJson.parse(text);

  expect(errorsOf(result)).toEqual([
    {
      kind: "unknown-field",
      path: "canvasZoom",
      message: 'unknown field "canvasZoom"',
    },
  ]);
});

test("type も ref も持たないノードは欠落として報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": [ { "name": "screen", "width": 100, "height": 200, "children": [ { "name": "orphan" } ] } ] }`;

  const result = DocumentJson.parse(text);

  expect(errorsOf(result)).toEqual([
    {
      kind: "missing-field",
      path: "artboards[0].children[0]",
      message: 'node must have either "type" or "ref"',
    },
  ]);
});

test("prop の値が文字列・数値・真偽値のいずれでもないと不正な型として報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": [ { "name": "screen", "width": 100, "height": 200, "children": [ { "name": "box", "type": "Box", "props": { "gap": { "value": 16 } } } ] } ] }`;

  const result = DocumentJson.parse(text);

  expect(errorsOf(result)).toEqual([
    {
      kind: "invalid-type",
      path: "artboards[0].children[0].props.gap",
      message: "expected string, number or boolean but got object",
    },
  ]);
});

test("離れた場所にある複数の不正はまとめて一覧で報告される", () => {
  const text = `{
    "formatVersion": "1.0",
    "tokens": { "spacing": { "md": "16px" } },
    "components": { "card": { "props": { "gap": "md" } } },
    "artboards": [
      { "name": "screen", "width": "100", "height": 200, "children": [] }
    ]
  }`;

  const result = DocumentJson.parse(text);

  expect(pathsOf(result)).toEqual([
    "tokens.spacing.md",
    "components.card.type",
    "artboards[0].width",
  ]);
});

test("同じオブジェクト内の複数の不正もまとめて報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": [ { "width": 100, "children": [] } ] }`;

  const result = DocumentJson.parse(text);

  expect(pathsOf(result)).toEqual(["artboards[0].name", "artboards[0].height"]);
});

test("不正なテキストを渡しても例外は投げられない", () => {
  expect(() => DocumentJson.parse("not json at all")).not.toThrow();
});

test("部品の binding に node と prop が揃っていないと欠落として報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": { "card": { "type": "Box", "publicProps": { "title": { "node": "card-title" } } } }, "artboards": [] }`;

  const result = DocumentJson.parse(text);

  expect(errorsOf(result)).toEqual([
    {
      kind: "missing-field",
      path: "components.card.publicProps.title.prop",
      message: '"prop" is required',
    },
  ]);
});

test("shadows トークンに必須フィールドが欠けていると欠落として報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": { "shadows": { "sm": { "x": 0, "y": 1 } } }, "components": {}, "artboards": [] }`;

  const result = DocumentJson.parse(text);

  expect(pathsOf(result)).toEqual([
    "tokens.shadows.sm.blur",
    "tokens.shadows.sm.color",
  ]);
});
