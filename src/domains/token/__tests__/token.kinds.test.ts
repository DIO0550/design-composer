import { expect, test } from "vitest";
import { TokenSet, TypographyToken } from "../index";

test("typography トークンのフィールドを列挙すると 04-tokens で定義された4フィールドが返る", () => {
  expect(TypographyToken.fields()).toEqual([
    "fontSize",
    "lineHeight",
    "fontWeight",
    "fontFamily",
  ]);
});

test("トークンの種別を列挙すると 04-tokens で定義された5種別が返る", () => {
  expect(TokenSet.kinds()).toEqual([
    "colors",
    "spacing",
    "radius",
    "shadows",
    "typography",
  ]);
});

test("種別を指定してトークン名を取得するとその種別の名前だけが返る", () => {
  const tokens = {
    ...TokenSet.empty(),
    colors: { primary: "#3b82f6", surface: "#111827" },
    spacing: { md: 8 },
  };

  expect(TokenSet.names(tokens, "colors")).toEqual(["primary", "surface"]);
});

test("トークンが登録されていない種別の名前を取得すると空になる", () => {
  expect(TokenSet.names(TokenSet.empty(), "shadows")).toEqual([]);
});

test("列挙した全種別の名前を集めると空の TokenSet では空になる", () => {
  const names = TokenSet.kinds().flatMap((kind) =>
    TokenSet.names(TokenSet.empty(), kind),
  );

  expect(names).toEqual([]);
});
