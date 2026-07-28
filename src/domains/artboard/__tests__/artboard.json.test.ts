import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { Artboard } from "../index";

test("artboard は name・サイズ・children から読み込まれる", () => {
  const artboard = Result.unwrap(
    Artboard.fromJson(
      { name: "screen", width: 375, height: 812, children: [] },
      "artboards[0]",
    ),
  );

  expect(artboard).toEqual({
    name: "screen",
    width: 375,
    height: 812,
    children: [],
  });
});

test("children が欠けている artboard は読み込めない", () => {
  const result = Artboard.fromJson(
    { name: "screen", width: 375, height: 812 },
    "artboards[0]",
  );

  expect(result.ok).toBe(false);
});

test("artboard は仕様の定義順で書き出される", () => {
  const written = Artboard.toJson({
    name: "screen",
    width: 375,
    height: 812,
    props: { gap: "md" },
    children: [],
  });

  expect(Object.keys(written)).toEqual([
    "name",
    "width",
    "height",
    "props",
    "children",
  ]);
});

test("children は空でも必須フィールドとして書き出される", () => {
  const written = Artboard.toJson({
    name: "screen",
    width: 375,
    height: 812,
    children: [],
  });

  expect(written).toEqual({
    name: "screen",
    width: 375,
    height: 812,
    children: [],
  });
});
