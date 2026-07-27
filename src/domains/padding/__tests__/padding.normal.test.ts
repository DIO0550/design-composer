import { expect, test } from "vitest";
import { Padding } from "../index";

function spacingRef(token: string): string {
  return `var(--spacing-${token})`;
}

test("2軸を指定したパディングは Y X の順で合成される", () => {
  const padding = Padding.create("sm", "lg");

  expect(Padding.cssValue(padding, spacingRef)).toBe(
    "var(--spacing-sm) var(--spacing-lg)",
  );
});

test("左右だけを指定すると上下は 0 になる", () => {
  const padding = Padding.create(undefined, "lg");

  expect(Padding.cssValue(padding, spacingRef)).toBe("0 var(--spacing-lg)");
});

test("上下だけを指定すると左右は 0 になる", () => {
  const padding = Padding.create("sm", undefined);

  expect(Padding.cssValue(padding, spacingRef)).toBe("var(--spacing-sm) 0");
});

test("2軸とも未指定のパディングは空である", () => {
  expect(Padding.isEmpty(Padding.create(undefined, undefined))).toBe(true);
});

test("片方の軸でも指定があれば空ではない", () => {
  expect(Padding.isEmpty(Padding.create(undefined, "lg"))).toBe(false);
  expect(Padding.isEmpty(Padding.create("sm", undefined))).toBe(false);
});

test("同じ軸に同じトークンを指定すれば同じ値になる", () => {
  const padding = Padding.create("md", "md");

  expect(Padding.cssValue(padding, spacingRef)).toBe(
    "var(--spacing-md) var(--spacing-md)",
  );
});
