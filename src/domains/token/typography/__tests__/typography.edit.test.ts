import { expect, test } from "vitest";
import { Font } from "@/utils/Font";
import { Option } from "@/utils/Option";
import {
  TypographyFieldEdit,
  TypographyFieldRef,
  type TypographyNumberField,
  TypographyToken,
} from "../index";

/** fontFamily を省略した書体（docs/04-tokens.md の初期テーマの `typography.body`）。 */
function setupTypography(): TypographyToken {
  return { fontSize: 16, lineHeight: 1.6, fontWeight: 400 };
}

/**
 * 数値のフィールドの書き換え。値域を満たさない値ではテストを落としたいので
 * `unwrap` で通す（rules/coding.md「例外に変換してよいのは…テストコードだけ」）。
 */
function edit(
  field: TypographyNumberField,
  value: number,
): TypographyFieldEdit {
  return Option.unwrap(TypographyFieldEdit.create(field, value));
}

test("書体のサイズを変えても他のフィールドはそのまま残る", () => {
  const changed = TypographyToken.withField(
    setupTypography(),
    edit("fontSize", 24),
  );

  expect(changed).toEqual({ fontSize: 24, lineHeight: 1.6, fontWeight: 400 });
});

test("書体の太さを変えても他のフィールドはそのまま残る", () => {
  const changed = TypographyToken.withField(
    setupTypography(),
    edit("fontWeight", 700),
  );

  expect(changed).toEqual({ fontSize: 16, lineHeight: 1.6, fontWeight: 700 });
});

test("フォントを指定すると font-family がその値になる", () => {
  const changed = TypographyToken.withField(setupTypography(), {
    field: "fontFamily",
    value: Option.some("Inter"),
  });

  expect(
    TypographyFieldRef.cssValue(
      TypographyFieldRef.create(changed, "fontFamily"),
    ),
  ).toBe("Inter");
});

test("フォントの指定を外すとシステムフォントスタックに戻る", () => {
  const specified = TypographyToken.withField(setupTypography(), {
    field: "fontFamily",
    value: Option.some("Inter"),
  });

  const cleared = TypographyToken.withField(specified, {
    field: "fontFamily",
    value: Option.none,
  });

  expect(
    TypographyFieldRef.cssValue(
      TypographyFieldRef.create(cleared, "fontFamily"),
    ),
  ).toBe(Font.systemStack());
});

test("指定を外したフォントは書き出されない", () => {
  const specified = TypographyToken.withField(setupTypography(), {
    field: "fontFamily",
    value: Option.some("Inter"),
  });

  const cleared = TypographyToken.withField(specified, {
    field: "fontFamily",
    value: Option.none,
  });

  expect(Object.keys(TypographyToken.toJson(cleared))).toEqual([
    "fontSize",
    "lineHeight",
    "fontWeight",
  ]);
});
