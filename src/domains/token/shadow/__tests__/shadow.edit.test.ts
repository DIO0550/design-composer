import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ShadowFieldEdit, ShadowToken } from "../index";

/** spread を省略した影（docs/04-tokens.md の初期テーマの `shadows.sm`）。 */
function setupShadow(): ShadowToken {
  return { x: 0, y: 1, blur: 3, color: "#0000001a" };
}

test("影の横のずれを変えても他のフィールドはそのまま残る", () => {
  const changed = ShadowToken.withField(
    setupShadow(),
    Option.unwrap(ShadowFieldEdit.createNumeric("x", 4)),
  );

  expect(changed).toEqual({ x: 4, y: 1, blur: 3, color: "#0000001a" });
});

test("影のぼかしを変えても他のフィールドはそのまま残る", () => {
  const changed = ShadowToken.withField(
    setupShadow(),
    Option.unwrap(ShadowFieldEdit.createNumeric("blur", 8)),
  );

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
  const changed = ShadowToken.withField(
    setupShadow(),
    Option.unwrap(ShadowFieldEdit.createNumeric("spread", 2)),
  );

  expect(ShadowToken.cssValue(changed)).toBe("0px 1px 3px 2px #0000001a");
});

test("影の広がりに 0 を入れると 0 として持つ", () => {
  const changed = ShadowToken.withField(
    setupShadow(),
    Option.unwrap(ShadowFieldEdit.createNumeric("spread", 0)),
  );

  expect(ShadowToken.toJson(changed)).toEqual({
    x: 0,
    y: 1,
    blur: 3,
    spread: 0,
    color: "#0000001a",
  });
});
