import { expect, test } from "vitest";
import { DocumentErrorLocation } from "../index";

test("ノードを指す場所からは、そのノードの名前が読める", () => {
  const nodeName = DocumentErrorLocation.nodeName({
    kind: "node",
    nodeName: "home-title",
    prop: "typography",
  });

  expect(nodeName).toStrictEqual({ some: true, value: "home-title" });
});

test("テキストの文字位置を指す場所からは、ノードの名前が読めない", () => {
  const nodeName = DocumentErrorLocation.nodeName({
    kind: "text-position",
    position: 42,
  });

  expect(nodeName.some).toBe(false);
});

test("ドキュメント内のパスを指す場所からは、ノードの名前が読めない", () => {
  const nodeName = DocumentErrorLocation.nodeName({
    kind: "document-path",
    path: "artboards[0].width",
  });

  expect(nodeName.some).toBe(false);
});

test("ファイル全体を指す場所からは、ノードの名前が読めない", () => {
  const nodeName = DocumentErrorLocation.nodeName({ kind: "whole-document" });

  expect(nodeName.some).toBe(false);
});
