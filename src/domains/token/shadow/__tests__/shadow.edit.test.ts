import { expect, test } from "vitest";
import { ShadowToken } from "../index";

/** spread を省略した影（docs/04-tokens.md の初期テーマの `shadows.sm`）。 */
function setupShadow(): ShadowToken {
  return { x: 0, y: 1, blur: 3, color: "#0000001a" };
}

test("影の横のずれを変えても他のフィールドはそのまま残る", () => {
  const changed = ShadowToken.withField(setupShadow(), {
    field: "x",
    value: 4,
  });

  expect(changed).toEqual({ x: 4, y: 1, blur: 3, color: "#0000001a" });
});

test("影のぼかしを変えても他のフィールドはそのまま残る", () => {
  const changed = ShadowToken.withField(setupShadow(), {
    field: "blur",
    value: 8,
  });

  expect(ShadowToken.cssValue(changed)).toBe("0px 1px 8px 0px #0000001a");
});

test("影の色を変えると色だけが変わる", () => {
  const changed = ShadowToken.withField(setupShadow(), {
    field: "color",
    value: "#ff0000",
  });

  expect(changed).toEqual({ x: 0, y: 1, blur: 3, color: "#ff0000" });
});

test("影の色に大文字の hex を入れても小文字で保持される", () => {
  const changed = ShadowToken.withField(setupShadow(), {
    field: "color",
    value: "#AABBCC",
  });

  expect(changed.color).toBe("#aabbcc");
});

test("省略されていた広がりに値を入れると box-shadow の4つ目に出る", () => {
  const changed = ShadowToken.withField(setupShadow(), {
    field: "spread",
    value: 2,
  });

  expect(ShadowToken.cssValue(changed)).toBe("0px 1px 3px 2px #0000001a");
});

test("影の広がりに 0 を入れると省略として持つ", () => {
  const spread = ShadowToken.withField(setupShadow(), {
    field: "spread",
    value: 2,
  });

  const cleared = ShadowToken.withField(spread, { field: "spread", value: 0 });

  expect(ShadowToken.toJson(cleared)).toEqual({
    x: 0,
    y: 1,
    blur: 3,
    color: "#0000001a",
  });
});
