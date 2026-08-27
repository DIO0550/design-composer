import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { TokenSet } from "@/domains/dcmp/token";
import { Option } from "@/utils/Option";
import { TokenSelection } from "../index";

/** 同じ名前（`sm`）を 2 つの種別に持つドキュメント。種別まで見ているかを分けられる。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: {
      ...TokenSet.empty(),
      colors: { primary: "#3b82f6" },
      spacing: { sm: 8 },
      shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
    },
    artboards: [{ name: "home", width: 375, height: 812, children: [] }],
  });
}

test("選んでいるトークンの中身がドキュメントから引ける", () => {
  const selection = TokenSelection.create(
    setupDocument(),
    Option.some({ kind: "colors", name: "primary" }),
  );

  expect(TokenSelection.token(selection)).toEqual(
    Option.some({ kind: "colors", name: "primary", value: "#3b82f6" }),
  );
});

test("トークンを選んでいなければ中身も無い", () => {
  const selection = TokenSelection.create(setupDocument(), Option.none);

  expect(TokenSelection.token(selection)).toEqual(Option.none);
});

test("ドキュメントから消えたトークンを指していると中身は引けない", () => {
  const selection = TokenSelection.create(
    setupDocument(),
    Option.some({ kind: "colors", name: "unknown" }),
  );

  expect(TokenSelection.token(selection)).toEqual(Option.none);
});

test("同じ名前でも種別が違えば選んでいるものとは見なさない", () => {
  const selection = TokenSelection.create(
    setupDocument(),
    Option.some({ kind: "spacing", name: "sm" }),
  );

  expect(
    TokenSelection.isSelected(selection, { kind: "spacing", name: "sm" }),
  ).toBe(true);
  expect(
    TokenSelection.isSelected(selection, { kind: "shadows", name: "sm" }),
  ).toBe(false);
});

test("トークンを選んでいなければどのトークンも選ばれていない", () => {
  const selection = TokenSelection.create(setupDocument(), Option.none);

  expect(
    TokenSelection.isSelected(selection, { kind: "colors", name: "primary" }),
  ).toBe(false);
});
