import { expect, test } from "vitest";
import { Json } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { GradientToken } from "../index";

/** 読み込めるグラデーションの形。各テストが 1 箇所だけ崩して使う。 */
function setupJson(): Record<string, unknown> {
  return {
    shape: "linear",
    angle: 90,
    stops: [
      { color: "#3b82f6", ratio: 0 },
      { color: "#1d4ed8", ratio: 1 },
    ],
  };
}

function decode(value: unknown) {
  return GradientToken.fromJson(Json.create(value, "gradients.brand"));
}

test("知らないフィールドがあると読み込めない", () => {
  const result = decode({ ...setupJson(), center: 0.5 });

  expect(Result.isOk(result)).toBe(false);
});

test("色の変わり目に知らないフィールドがあると読み込めない", () => {
  const result = decode({
    ...setupJson(),
    stops: [
      { color: "#3b82f6", ratio: 0, hint: 0.3 },
      { color: "#1d4ed8", ratio: 1 },
    ],
  });

  expect(Result.isOk(result)).toBe(false);
});

test("linear でない形は読み込めない", () => {
  const result = decode({ ...setupJson(), shape: "radial" });

  expect(Result.isOk(result)).toBe(false);
});

test("形が欠けていると読み込めない", () => {
  const { shape: _shape, ...rest } = setupJson();

  expect(Result.isOk(decode(rest))).toBe(false);
});

test("角度が欠けていると読み込めない", () => {
  const { angle: _angle, ...rest } = setupJson();

  expect(Result.isOk(decode(rest))).toBe(false);
});

test("色の変わり目が欠けていると読み込めない", () => {
  const { stops: _stops, ...rest } = setupJson();

  expect(Result.isOk(decode(rest))).toBe(false);
});

test("色の変わり目が配列でないと読み込めない", () => {
  const result = decode({ ...setupJson(), stops: { from: "#3b82f6" } });

  expect(Result.isOk(result)).toBe(false);
});

test("色の変わり目の色が欠けていると読み込めない", () => {
  const result = decode({ ...setupJson(), stops: [{ ratio: 0 }] });

  expect(Result.isOk(result)).toBe(false);
});

test("色の変わり目が0件でも読み込める", () => {
  /* 値域は編集で課し、読み込みでは見ない（docs/04-tokens.md「値域の扱い」）。 */
  const gradient = Result.unwrap(decode({ ...setupJson(), stops: [] }));

  expect(gradient.stops).toEqual([]);
});

test("色の変わり目が1件でも読み込める", () => {
  const gradient = Result.unwrap(
    decode({ ...setupJson(), stops: [{ color: "#3b82f6", ratio: 0 }] }),
  );

  expect(gradient.stops).toEqual([{ color: "#3b82f6", ratio: 0 }]);
});

test("比率が0〜1の外でも読み込める", () => {
  const gradient = Result.unwrap(
    decode({
      ...setupJson(),
      stops: [
        { color: "#3b82f6", ratio: -0.5 },
        { color: "#1d4ed8", ratio: 2 },
      ],
    }),
  );

  expect(gradient.stops.map((stop) => stop.ratio)).toEqual([-0.5, 2]);
});

test("hex として読めない色の変わり目の色も読み込める", () => {
  /* 色の形式の検証はバリデーションの担当（`ColorToken.fromJson` と同じ扱い）。 */
  const gradient = Result.unwrap(
    decode({
      ...setupJson(),
      stops: [
        { color: "red", ratio: 0 },
        { color: "#1d4ed8", ratio: 1 },
      ],
    }),
  );

  expect(gradient.stops[0]?.color).toBe("red");
});
