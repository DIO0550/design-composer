import { expect, test } from "vitest";
import { Json } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { Artboard } from "../index";

/**
 * 座標以外は同じ artboard の JSON。
 * 座標の有無だけが答えを分けることを、各テストの入力から読めるようにする。
 *
 * @param canvasPosition 足す `x` / `y`。省略すると座標を持たない JSON になる
 * @returns `Artboard.fromJson` に渡せる JSON
 */
function artboardJson(canvasPosition?: Readonly<Record<string, number>>) {
  return {
    name: "screen",
    width: 375,
    height: 812,
    ...canvasPosition,
    children: [],
  };
}

test("x と y を持つ artboard はキャンバス上の位置を持って読み込まれる", () => {
  const artboard = Result.unwrap(
    Artboard.fromJson(Json.create(artboardJson({ x: 900, y: 300 }), "a[0]")),
  );

  expect(artboard.canvasPosition).toEqual({ x: 900, y: 300 });
});

test("x が負の artboard も読み込める（原点より左へ置ける）", () => {
  const artboard = Result.unwrap(
    Artboard.fromJson(Json.create(artboardJson({ x: -120, y: -40 }), "a[0]")),
  );

  expect(artboard.canvasPosition).toEqual({ x: -120, y: -40 });
});

test("x も y も無い artboard はキャンバス上の位置を持たない", () => {
  const artboard = Result.unwrap(
    Artboard.fromJson(Json.create(artboardJson(), "a[0]")),
  );

  expect(artboard.canvasPosition).toBeUndefined();
});

test("x だけを持つ artboard は読み込めない", () => {
  const result = Artboard.fromJson(
    Json.create(artboardJson({ x: 900 }), "a[0]"),
  );

  expect(result.ok).toBe(false);
});

test("y だけを持つ artboard は読み込めない", () => {
  const result = Artboard.fromJson(
    Json.create(artboardJson({ y: 300 }), "a[0]"),
  );

  expect(result.ok).toBe(false);
});

test("x が数値でない artboard は読み込めない", () => {
  const result = Artboard.fromJson(
    Json.create({ ...artboardJson(), x: "900", y: 300 }, "a[0]"),
  );

  expect(result.ok).toBe(false);
});

test("キャンバス上の位置を持つ artboard は x と y を書き出す", () => {
  const written = Artboard.toJson(
    Artboard.create({
      name: "screen",
      width: 375,
      height: 812,
      canvasPosition: { x: 900, y: 300 },
    }),
  );

  expect(written).toMatchObject({ x: 900, y: 300 });
});

test("キャンバス上の位置を持たない artboard は x も y も書き出さない", () => {
  const written = Artboard.toJson(
    Artboard.create({ name: "screen", width: 375, height: 812 }),
  );

  expect(Object.keys(written)).not.toContain("x");
  expect(Object.keys(written)).not.toContain("y");
});

test("キャンバス上の位置を持つ artboard も仕様の定義順で書き出される", () => {
  const written = Artboard.toJson(
    Artboard.create({
      name: "screen",
      width: 375,
      height: 812,
      canvasPosition: { x: 900, y: 300 },
      props: { gap: "md" },
    }),
  );

  expect(Object.keys(written)).toEqual([
    "name",
    "width",
    "height",
    "x",
    "y",
    "props",
    "children",
  ]);
});

test("読み込んで書き出すとキャンバス上の位置が元のまま残る", () => {
  const artboard = Result.unwrap(
    Artboard.fromJson(Json.create(artboardJson({ x: 900, y: 300 }), "a[0]")),
  );

  expect(Artboard.toJson(artboard)).toMatchObject({ x: 900, y: 300 });
});
