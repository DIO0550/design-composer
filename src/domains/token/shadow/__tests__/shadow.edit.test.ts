import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ShadowFieldEdit, type ShadowNumberField, ShadowToken } from "../index";

/** spread を省略した影（docs/04-tokens.md の初期テーマの `shadows.sm`）。 */
function setupShadow(): ShadowToken {
  return { x: 0, y: 1, blur: 3, color: "#0000001a" };
}

/**
 * 数値のフィールドの書き換え。値域を満たさない値ではテストを落としたいので
 * `unwrap` で通す（rules/coding.md「例外に変換してよいのは…テストコードだけ」）。
 */
function edit(field: ShadowNumberField, value: number): ShadowFieldEdit {
  return Option.unwrap(ShadowFieldEdit.create(field, value));
}

test("影の横のずれを変えても他のフィールドはそのまま残る", () => {
  const changed = ShadowToken.withField(setupShadow(), edit("x", 4));

  expect(changed).toEqual({ x: 4, y: 1, blur: 3, color: "#0000001a" });
});

test("影のぼかしを変えても他のフィールドはそのまま残る", () => {
  const changed = ShadowToken.withField(setupShadow(), edit("blur", 8));

  expect(ShadowToken.cssValue(changed)).toBe("0px 1px 8px 0px #0000001a");
});

test("影の色を変えると色だけが変わる", () => {
  const changed = ShadowToken.withField(setupShadow(), {
    field: "color",
    value: "#ff0000",
  });

  expect(changed).toEqual({ x: 0, y: 1, blur: 3, color: "#ff0000" });
});

test("省略されていた広がりに値を入れると box-shadow の4つ目に出る", () => {
  const changed = ShadowToken.withField(setupShadow(), edit("spread", 2));

  expect(ShadowToken.cssValue(changed)).toBe("0px 1px 3px 2px #0000001a");
});

test("影の広がりに 0 を入れると 0 として持つ", () => {
  const changed = ShadowToken.withField(setupShadow(), edit("spread", 0));

  expect(ShadowToken.toJson(changed)).toEqual({
    x: 0,
    y: 1,
    blur: 3,
    spread: 0,
    color: "#0000001a",
  });
});
