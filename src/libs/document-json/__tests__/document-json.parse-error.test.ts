import { expect, test } from "vitest";
import type { DesignDocument } from "@/domains/dcmp/design-document";
import type { DocumentError } from "@/domains/session/document-error";
import type { Result } from "@/utils/Result";
import { DocumentJson } from "../index";

function errorsOf(
  result: Result<DesignDocument, readonly DocumentError[]>,
): readonly DocumentError[] {
  return result.ok ? [] : result.error;
}

function kindsOf(
  result: Result<DesignDocument, readonly DocumentError[]>,
): readonly string[] {
  return errorsOf(result).map((error) => error.kind);
}

function locationsOf(
  result: Result<DesignDocument, readonly DocumentError[]>,
): readonly DocumentError["location"][] {
  return errorsOf(result).map((error) => error.location);
}

test("JSON として壊れているテキストは構文エラーとして報告される", () => {
  const result = DocumentJson.parse(`{ "formatVersion": "1.0", }`);

  expect(kindsOf(result)).toContain("syntax-error");
});

test("JSON として壊れているテキストは、壊れている文字の位置を指す", () => {
  const result = DocumentJson.parse(`{ "formatVersion": "1.0", }`);

  expect(locationsOf(result)).toEqual([
    { kind: "text-position", position: 26 },
  ]);
});

test("キーが重複しているテキストは重複キーとして報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": { "card": { "type": "Box" }, "card": { "type": "Text" } }, "artboards": [] }`;

  const result = DocumentJson.parse(text);

  expect(kindsOf(result)).toEqual(["duplicate-key"]);
});

test("キーが重複しているテキストは、2 度目のキーの位置を指す", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": { "card": { "type": "Box" }, "card": { "type": "Text" } }, "artboards": [] }`;

  const result = DocumentJson.parse(text);

  expect(locationsOf(result)).toEqual([
    { kind: "text-position", position: 83 },
  ]);
});

test("必須のトップレベルフィールドが欠けていると欠落として報告される", () => {
  const result = DocumentJson.parse(`{ "formatVersion": "1.0" }`);

  expect(errorsOf(result)).toEqual([
    {
      kind: "missing-field",
      message: '"tokens" is required',
      location: { kind: "document-path", path: "tokens" },
    },
    {
      kind: "missing-field",
      message: '"components" is required',
      location: { kind: "document-path", path: "components" },
    },
    {
      kind: "missing-field",
      message: '"artboards" is required',
      location: { kind: "document-path", path: "artboards" },
    },
  ]);
});

test("フィールドの型が違うと不正な型として報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": {} }`;

  const result = DocumentJson.parse(text);

  expect(errorsOf(result)).toEqual([
    {
      kind: "invalid-type",
      message: "expected array but got object",
      location: { kind: "document-path", path: "artboards" },
    },
  ]);
});

test("formatVersion が major.minor 形式でないと不正な型として報告される", () => {
  const text = `{ "formatVersion": "1", "tokens": {}, "components": {}, "artboards": [] }`;

  const result = DocumentJson.parse(text);

  expect(errorsOf(result)).toEqual([
    {
      kind: "invalid-type",
      message: 'expected "major.minor" but got "1"',
      location: { kind: "document-path", path: "formatVersion" },
    },
  ]);
});

test("知らないフィールドは黙って捨てずにエラーとして報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": [], "canvasZoom": 1.5 }`;

  const result = DocumentJson.parse(text);

  expect(errorsOf(result)).toEqual([
    {
      kind: "unknown-field",
      message: 'unknown field "canvasZoom"',
      location: { kind: "document-path", path: "canvasZoom" },
    },
  ]);
});

test("type も ref も持たないノードは欠落として報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": [ { "name": "screen", "width": 100, "height": 200, "children": [ { "name": "orphan" } ] } ] }`;

  const result = DocumentJson.parse(text);

  expect(errorsOf(result)).toEqual([
    {
      kind: "missing-field",
      message: 'node must have either "type" or "ref"',
      location: {
        kind: "document-path",
        path: "artboards[0].children[0]",
      },
    },
  ]);
});

test("prop の値が文字列・数値・真偽値のいずれでもないと不正な型として報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": [ { "name": "screen", "width": 100, "height": 200, "children": [ { "name": "box", "type": "Box", "props": { "gap": { "value": 16 } } } ] } ] }`;

  const result = DocumentJson.parse(text);

  expect(errorsOf(result)).toEqual([
    {
      kind: "invalid-type",
      message: "expected string, number or boolean but got object",
      location: {
        kind: "document-path",
        path: "artboards[0].children[0].props.gap",
      },
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

  expect(locationsOf(result)).toEqual([
    { kind: "document-path", path: "tokens.spacing.md" },
    { kind: "document-path", path: "components.card.type" },
    { kind: "document-path", path: "artboards[0].width" },
  ]);
});

test("同じオブジェクト内の複数の不正もまとめて報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": {}, "components": {}, "artboards": [ { "width": 100, "children": [] } ] }`;

  const result = DocumentJson.parse(text);

  expect(locationsOf(result)).toEqual([
    { kind: "document-path", path: "artboards[0].name" },
    { kind: "document-path", path: "artboards[0].height" },
  ]);
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
      message: '"prop" is required',
      location: {
        kind: "document-path",
        path: "components.card.publicProps.title.prop",
      },
    },
  ]);
});

test("shadows トークンに必須フィールドが欠けていると欠落として報告される", () => {
  const text = `{ "formatVersion": "1.0", "tokens": { "shadows": { "sm": { "x": 0, "y": 1 } } }, "components": {}, "artboards": [] }`;

  const result = DocumentJson.parse(text);

  expect(locationsOf(result)).toEqual([
    { kind: "document-path", path: "tokens.shadows.sm.blur" },
    { kind: "document-path", path: "tokens.shadows.sm.color" },
  ]);
});
