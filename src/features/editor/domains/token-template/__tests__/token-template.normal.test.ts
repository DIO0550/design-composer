import { expect, test } from "vitest";
import { TokenSet } from "@/domains/dcmp/token";
import { TokenTemplate } from "../index";

test("採番の元がまだ使われていなければ、その名前がそのまま付く", () => {
  const token = TokenTemplate.toToken(
    { kind: "colors" },
    { ...TokenSet.empty(), colors: { brand: "#000000" } },
  );

  expect(token.name).toBe("color");
});

test("採番の元が既に使われていれば連番が付く", () => {
  const token = TokenTemplate.toToken(
    { kind: "colors" },
    { ...TokenSet.empty(), colors: { color: "#000000" } },
  );

  expect(token.name).toBe("color-2");
});

test("足す種別に採番の元と同じ名前があれば、その種別の中で連番が付く", () => {
  const token = TokenTemplate.toToken(
    { kind: "spacing" },
    { ...TokenSet.empty(), spacing: { spacing: 8 } },
  );

  expect(token.name).toBe("spacing-2");
});

test("色を足すと黒から始まる", () => {
  expect(TokenTemplate.toToken({ kind: "colors" }, TokenSet.empty())).toEqual({
    kind: "colors",
    name: "color",
    value: "#000000",
  });
});

test("間隔と角丸を足すと 0 から始まる", () => {
  expect(TokenTemplate.toToken({ kind: "spacing" }, TokenSet.empty())).toEqual({
    kind: "spacing",
    name: "spacing",
    value: 0,
  });
  expect(TokenTemplate.toToken({ kind: "radius" }, TokenSet.empty())).toEqual({
    kind: "radius",
    name: "radius",
    value: 0,
  });
});

test("影を足すと画面に出る影から始まる", () => {
  expect(TokenTemplate.toToken({ kind: "shadows" }, TokenSet.empty())).toEqual({
    kind: "shadows",
    name: "shadow",
    value: { x: 0, y: 1, blur: 3, color: "#0000001a" },
  });
});

test("書体を足すと本文の書体から始まる", () => {
  expect(
    TokenTemplate.toToken({ kind: "typography" }, TokenSet.empty()),
  ).toEqual({
    kind: "typography",
    name: "typography",
    value: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
  });
});
