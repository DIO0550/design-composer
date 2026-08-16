import { expect, test } from "vitest";
import { Artboard } from "@/domains/artboard";
import { Result } from "@/utils/Result";
import { DocumentJson } from "../index";

/*
 * 旧版のテキストが「読み込むと最新形になっている」ことを、パース経路を通して確かめる。
 * `libs/document-migration` の単体だけを揃えると、変換ステップの登録を落としても
 * 全テストが緑になる。
 */

function setupText(props: string): string {
  return `{
    "formatVersion": "1.0",
    "tokens": { "spacing": { "md": 16, "lg": 20 } },
    "components": {},
    "artboards": [
      {
        "name": "home",
        "width": 375,
        "height": 812,
        "children": [{ "name": "box", "type": "Box", "props": ${props} }]
      }
    ]
  }`;
}

function propsOfBox(text: string): unknown {
  const document = Result.unwrap(DocumentJson.parse(text));
  const artboard = document.artboards[0];
  const node =
    artboard === undefined ? undefined : Artboard.findNode(artboard, "box");
  if (node?.some !== true || !("props" in node.value)) {
    return undefined;
  }
  return node.value.props;
}

test("1.0 のテキストを読むと paddingX が左右の2辺になっている", () => {
  expect(propsOfBox(setupText(`{ "paddingX": "lg" }`))).toEqual({
    paddingLeft: "lg",
    paddingRight: "lg",
  });
});

test("1.0 のテキストを読むと paddingY が上下の2辺になっている", () => {
  expect(propsOfBox(setupText(`{ "paddingY": "md" }`))).toEqual({
    paddingTop: "md",
    paddingBottom: "md",
  });
});

test("読み込んだドキュメントは現在の版を名乗る", () => {
  const document = Result.unwrap(
    DocumentJson.parse(setupText(`{ "paddingX": "lg" }`)),
  );

  expect(document.formatVersion).toEqual({ major: 2, minor: 0 });
});

test("公開 prop が paddingX へ binding されたファイルは読み込めない", () => {
  const text = `{
    "formatVersion": "1.0",
    "tokens": {},
    "components": {
      "card": {
        "publicProps": { "pad": { "node": "card", "prop": "paddingX" } },
        "type": "Box"
      }
    },
    "artboards": []
  }`;

  const result = DocumentJson.parse(text);

  expect(result.ok ? [] : result.error).toEqual([
    expect.objectContaining({ kind: "migration-step-failed" }),
  ]);
});
