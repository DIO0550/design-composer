import { expect, test } from "vitest";
import { Json } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { GradientToken } from "../index";

test("shape / angle / stops を持つグラデーションを読むとそのまま値になる", () => {
  const gradient = Result.unwrap(
    GradientToken.fromJson(
      Json.create(
        {
          shape: "linear",
          angle: 90,
          stops: [
            { color: "#3b82f6", ratio: 0 },
            { color: "#1d4ed8", ratio: 1 },
          ],
        },
        "brand",
      ),
    ),
  );

  expect(gradient).toEqual({
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#3b82f6", ratio: 0 },
      { color: "#1d4ed8", ratio: 1 },
    ],
  });
});

test("大文字で書かれた stop の色は読み込んだ時点で小文字になる", () => {
  const gradient = Result.unwrap(
    GradientToken.fromJson(
      Json.create(
        {
          shape: "linear",
          angle: 90,
          stops: [{ color: "#3B82F6", ratio: 0 }],
        },
        "brand",
      ),
    ),
  );

  expect(gradient.stops[0]?.color).toBe("#3b82f6");
});

test("書き出したグラデーションは仕様のフィールド順で並ぶ", () => {
  const written = GradientToken.toJson({
    shape: "linear",
    angle: 90,
    stops: [{ color: "#3b82f6", ratio: 0 }],
  });

  expect(Object.keys(written)).toEqual(["shape", "angle", "stops"]);
});

test("読んで書き戻すと stop の並びが保たれる", () => {
  /* ratio を降順にしておく。昇順だと ratio で並べ替える実装と区別が付かない。 */
  const source = {
    shape: "linear",
    angle: 45,
    stops: [
      { color: "#111111", ratio: 1 },
      { color: "#222222", ratio: 0.75 },
      { color: "#333333", ratio: 0.25 },
      { color: "#444444", ratio: 0 },
    ],
  };

  const written = GradientToken.toJson(
    Result.unwrap(GradientToken.fromJson(Json.create(source, "brand"))),
  );

  expect(written).toEqual(source);
});
