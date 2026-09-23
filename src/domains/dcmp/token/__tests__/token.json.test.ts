import { expect, test } from "vitest";
import { Json } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { TokenSet } from "../index";

test("書かれていない種別は空として読み込まれる", () => {
  const tokens = Result.unwrap(
    TokenSet.fromJson(Json.create({ spacing: { md: 16 } }, "tokens")),
  );

  expect(tokens).toEqual({
    colors: {},
    spacing: { md: 16 },
    radius: {},
    shadows: {},
    typography: {},
    gradients: {},
  });
});

test("色は読み込んだ時点で小文字の hex に正規化される", () => {
  const tokens = Result.unwrap(
    TokenSet.fromJson(
      Json.create({ colors: { primary: "#3B82F6" } }, "tokens"),
    ),
  );

  expect(tokens.colors.primary).toBe("#3b82f6");
});

test("影の色も読み込んだ時点で小文字の hex に正規化される", () => {
  const shadows = { sm: { x: 0, y: 1, blur: 3, color: "#0000001A" } };

  const tokens = Result.unwrap(
    TokenSet.fromJson(Json.create({ shadows }, "tokens")),
  );

  expect(tokens.shadows.sm.color).toBe("#0000001a");
});

test("知らない種別は読み込めない", () => {
  const result = TokenSet.fromJson(Json.create({ borders: {} }, "tokens"));

  expect(Result.isOk(result)).toBe(false);
});

test("グラデーションの stop の色も読み込んだ時点で小文字の hex に正規化される", () => {
  const gradients = {
    brand: {
      shape: "linear",
      angle: 90,
      stops: [
        { color: "#3B82F6", ratio: 0 },
        { color: "#1D4ED8", ratio: 1 },
      ],
    },
  };

  const tokens = Result.unwrap(
    TokenSet.fromJson(Json.create({ gradients }, "tokens")),
  );

  expect(tokens.gradients.brand.stops.map((stop) => stop.color)).toEqual([
    "#3b82f6",
    "#1d4ed8",
  ]);
});

test("種別は仕様の定義順で書き出される", () => {
  const written = TokenSet.toJson({
    colors: { primary: "#3b82f6" },
    spacing: { md: 16 },
    radius: { md: 8 },
    shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
    typography: { body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 } },
    gradients: {
      brand: {
        shape: "linear",
        angle: 90,
        stops: [
          { color: "#3b82f6", ratio: 0 },
          { color: "#1d4ed8", ratio: 1 },
        ],
      },
    },
  });

  expect(Object.keys(written)).toEqual([
    "colors",
    "spacing",
    "radius",
    "shadows",
    "typography",
    "gradients",
  ]);
});

test("トークンを1つも持たない種別は書き出されない", () => {
  const written = TokenSet.toJson({
    ...TokenSet.empty(),
    colors: { primary: "#3b82f6" },
  });

  expect(written).toEqual({ colors: { primary: "#3b82f6" } });
});

test("トークンは名前の昇順で書き出される", () => {
  const written = TokenSet.toJson({
    ...TokenSet.empty(),
    spacing: { md: 16, xs: 4, lg: 24 },
  });

  expect(Object.keys(written.spacing as object)).toEqual(["lg", "md", "xs"]);
});
