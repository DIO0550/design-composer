import { expect, test } from "vitest";
import { DesignDocument } from "../index";
import { documentWithText } from "./text-node-setup";

test("配置と座標を書いたノードはエラーにならない", () => {
  const document = documentWithText({ placement: "absolute", x: 40, y: 24 });

  expect(DesignDocument.collectErrors(document)).toEqual([]);
});

test("座標に文字列を書くと literal-type-mismatch エラーになる", () => {
  const document = documentWithText({ placement: "absolute", x: "40", y: 24 });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "literal-type-mismatch",
      nodeName: "plain",
      prop: "x",
    }),
  ]);
});

test("知らない配置のモードを書くと enum-violation エラーになる", () => {
  const document = documentWithText({ placement: "sticky" });

  expect(DesignDocument.collectErrors(document)).toEqual([
    expect.objectContaining({
      kind: "enum-violation",
      nodeName: "plain",
      prop: "placement",
    }),
  ]);
});
