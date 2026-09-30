import { expect, test } from "vitest";
import { TokenSet } from "../index";

test("正規形の hex でない色トークンだけが、colors の場所として書かれた順に集まる", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { brand: "red", primary: "#3b82f6", accent: "#3B82F6" },
  };

  expect(TokenSet.collectInvalidColorPositions(tokens)).toEqual([
    { kind: "colors", name: "brand" },
    { kind: "colors", name: "accent" },
  ]);
});

test("影の中の hex でない色は影の場所として書かれた順に集まり、正規形の色を持つ影は集まらない", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    shadows: {
      sm: { x: 0, y: 1, blur: 3, color: "red" },
      md: { x: 0, y: 4, blur: 6, color: "#0000001a" },
      lg: { x: 0, y: 8, blur: 12, color: "blue" },
    },
  };

  expect(TokenSet.collectInvalidColorPositions(tokens)).toEqual([
    { kind: "shadows", name: "sm" },
    { kind: "shadows", name: "lg" },
  ]);
});

test("グラデーションの中の hex でない色は stop の添字つきで書かれた順に集まり、正規形の stop だけのグラデーションは集まらない", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    gradients: {
      hero: {
        shape: "linear",
        angle: 90,
        stops: [
          { color: "#3b82f6", ratio: 0 },
          { color: "rgb(0, 0, 0)", ratio: 1 },
        ],
      },
      calm: {
        shape: "linear",
        angle: 0,
        stops: [
          { color: "#ffffff", ratio: 0 },
          { color: "#000000", ratio: 1 },
        ],
      },
      dusk: {
        shape: "linear",
        angle: 180,
        stops: [
          { color: "navy", ratio: 0 },
          { color: "#000000", ratio: 1 },
        ],
      },
    },
  };

  expect(TokenSet.collectInvalidColorPositions(tokens)).toEqual([
    { kind: "gradients", name: "hero", stopIndex: 1 },
    { kind: "gradients", name: "dusk", stopIndex: 0 },
  ]);
});

test("不正な色の場所は colors・shadows・gradients の順に並ぶ", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    gradients: {
      hero: {
        shape: "linear",
        angle: 90,
        stops: [
          { color: "red", ratio: 0 },
          { color: "#000000", ratio: 1 },
        ],
      },
    },
    shadows: { sm: { x: 0, y: 1, blur: 3, color: "red" } },
    colors: { brand: "red" },
  };

  expect(TokenSet.collectInvalidColorPositions(tokens)).toEqual([
    { kind: "colors", name: "brand" },
    { kind: "shadows", name: "sm" },
    { kind: "gradients", name: "hero", stopIndex: 0 },
  ]);
});
