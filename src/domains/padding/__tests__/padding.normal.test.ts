import { expect, test } from "vitest";
import { Padding } from "../index";

function spacingRef(token: string): string {
  return `var(--spacing-${token})`;
}

test("4辺を指定したパディングは 上 右 下 左 の順で合成される", () => {
  const padding = Padding.create({
    top: "xs",
    right: "sm",
    bottom: "md",
    left: "lg",
  });

  expect(Padding.cssValue(padding, spacingRef)).toBe(
    "var(--spacing-xs) var(--spacing-sm) var(--spacing-md) var(--spacing-lg)",
  );
});

test("下だけを指定すると残りの3辺は 0 になる", () => {
  const padding = Padding.create({ bottom: "lg" });

  expect(Padding.cssValue(padding, spacingRef)).toBe("0 0 var(--spacing-lg) 0");
});

test("右だけを指定すると残りの3辺は 0 になる", () => {
  const padding = Padding.create({ right: "sm" });

  expect(Padding.cssValue(padding, spacingRef)).toBe("0 var(--spacing-sm) 0 0");
});

test("左右だけを指定すると上下は 0 になる", () => {
  const padding = Padding.create({ right: "lg", left: "lg" });

  expect(Padding.cssValue(padding, spacingRef)).toBe(
    "0 var(--spacing-lg) 0 var(--spacing-lg)",
  );
});

test("4辺とも未指定のパディングは空である", () => {
  expect(Padding.isEmpty(Padding.create({}))).toBe(true);
});

test("1辺でも指定があれば空ではない", () => {
  expect(Padding.isEmpty(Padding.create({ top: "sm" }))).toBe(false);
  expect(Padding.isEmpty(Padding.create({ left: "lg" }))).toBe(false);
});

test("4辺とも未指定なら宣言を出力しない", () => {
  expect(Padding.declarations(Padding.create({}), spacingRef)).toEqual([]);
});

test("同じ辺に同じトークンを指定すれば同じ値になる", () => {
  const padding = Padding.create({
    top: "md",
    right: "md",
    bottom: "md",
    left: "md",
  });

  expect(Padding.cssValue(padding, spacingRef)).toBe(
    "var(--spacing-md) var(--spacing-md) var(--spacing-md) var(--spacing-md)",
  );
});
