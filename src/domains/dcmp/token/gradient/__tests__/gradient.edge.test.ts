import { expect, test } from "vitest";
import { Json } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { GradientToken } from "../index";

/** `stops` だけを差し替えた、他は正しいグラデーションを読んだ結果。 */
function decodeWithStops(stops: unknown) {
  return GradientToken.fromJson(
    Json.create({ shape: "linear", angle: 90, stops }, "brand"),
  );
}

test("shape が欠けたグラデーションは読み込めない", () => {
  const result = GradientToken.fromJson(
    Json.create(
      { angle: 90, stops: [{ color: "#3b82f6", ratio: 0 }] },
      "brand",
    ),
  );

  expect(Result.isOk(result)).toBe(false);
});

test("angle が欠けたグラデーションは読み込めない", () => {
  const result = GradientToken.fromJson(
    Json.create(
      { shape: "linear", stops: [{ color: "#3b82f6", ratio: 0 }] },
      "brand",
    ),
  );

  expect(Result.isOk(result)).toBe(false);
});

test("stops が欠けたグラデーションは読み込めない", () => {
  const result = GradientToken.fromJson(
    Json.create({ shape: "linear", angle: 90 }, "brand"),
  );

  expect(Result.isOk(result)).toBe(false);
});

test("知らないフィールドを持つグラデーションは読み込めない", () => {
  const result = GradientToken.fromJson(
    Json.create(
      {
        shape: "linear",
        angle: 90,
        stops: [{ color: "#3b82f6", ratio: 0 }],
        spread: 4,
      },
      "brand",
    ),
  );

  expect(Result.isOk(result)).toBe(false);
});

test("shape が linear 以外のグラデーションは読み込めない", () => {
  const result = GradientToken.fromJson(
    Json.create(
      { shape: "radial", angle: 90, stops: [{ color: "#3b82f6", ratio: 0 }] },
      "brand",
    ),
  );

  expect(Result.isOk(result)).toBe(false);
});

test("angle が数値でないグラデーションは読み込めない", () => {
  const result = GradientToken.fromJson(
    Json.create(
      { shape: "linear", angle: "90", stops: [{ color: "#3b82f6", ratio: 0 }] },
      "brand",
    ),
  );

  expect(Result.isOk(result)).toBe(false);
});

test("stops が配列でないグラデーションは読み込めない", () => {
  expect(Result.isOk(decodeWithStops({ first: { color: "#3b82f6" } }))).toBe(
    false,
  );
});

test("color を欠く stop を持つグラデーションは読み込めない", () => {
  expect(Result.isOk(decodeWithStops([{ ratio: 0 }]))).toBe(false);
});

test("ratio を欠く stop を持つグラデーションは読み込めない", () => {
  expect(Result.isOk(decodeWithStops([{ color: "#3b82f6" }]))).toBe(false);
});

test("知らないフィールドを持つ stop があるグラデーションは読み込めない", () => {
  expect(
    Result.isOk(
      decodeWithStops([{ color: "#3b82f6", ratio: 0, position: 0.5 }]),
    ),
  ).toBe(false);
});

test("失敗した stop の位置は配列の添字つきで報告される", () => {
  const result = decodeWithStops([
    { color: "#3b82f6", ratio: 0 },
    { color: "#1d4ed8" },
  ]);

  expect(Json.errorsOf(result).map((error) => error.path)).toEqual([
    "brand.stops[1].ratio",
  ]);
});

test("ratio が 0〜1 の外にあるグラデーションも読み込める", () => {
  const gradient = Result.unwrap(
    decodeWithStops([
      { color: "#3b82f6", ratio: -0.5 },
      { color: "#1d4ed8", ratio: 2 },
    ]),
  );

  expect(gradient.stops.map((stop) => stop.ratio)).toEqual([-0.5, 2]);
});

test("stop が 1 件しかないグラデーションも読み込める", () => {
  const gradient = Result.unwrap(
    decodeWithStops([{ color: "#3b82f6", ratio: 0 }]),
  );

  expect(gradient.stops).toHaveLength(1);
});

test("stops が空のグラデーションも読み込める", () => {
  const gradient = Result.unwrap(decodeWithStops([]));

  expect(gradient.stops).toEqual([]);
});

test("値域を外れた ratio はそのままの位置で CSS の値になる", () => {
  const gradient = Result.unwrap(
    decodeWithStops([
      { color: "#3b82f6", ratio: -0.5 },
      { color: "#1d4ed8", ratio: 2 },
    ]),
  );

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(90deg, #3b82f6 -50%, #1d4ed8 200%)",
  );
});

test("stop が 2 件に満たないグラデーションは色の並びが足りないまま綴られる", () => {
  const gradient = Result.unwrap(
    decodeWithStops([{ color: "#3b82f6", ratio: 0 }]),
  );

  expect(GradientToken.cssValue(gradient)).toBe(
    "linear-gradient(90deg, #3b82f6 0%)",
  );
});

test("stops が空のグラデーションは色の並びを持たないまま綴られる", () => {
  const gradient = Result.unwrap(decodeWithStops([]));

  expect(GradientToken.cssValue(gradient)).toBe("linear-gradient(90deg, )");
});
