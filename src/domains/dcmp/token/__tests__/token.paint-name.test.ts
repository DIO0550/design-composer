import { expect, test } from "vitest";
import { Fade } from "@/domains/__tests__/gradient-tokens";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { TokenEditError, TokenSet } from "../index";

/** colors に `primary`、gradients に `fade`、spacing に `sm` を持つトークン集合。 */
function setupTokens(): TokenSet {
  return {
    ...TokenSet.empty(),
    colors: { primary: "#3b82f6" },
    gradients: { fade: Fade },
    spacing: { sm: 8 },
  };
}

test("colors にある名前で gradients のトークンを追加すると conflicting-token-name になる", () => {
  const added = TokenSet.add(setupTokens(), {
    kind: "gradients",
    name: "primary",
    value: Fade,
  });

  expect(added).toEqual(
    Result.err({
      kind: "conflicting-token-name",
      ref: { kind: "gradients", name: "primary" },
      conflictsWith: "colors",
    }),
  );
});

test("gradients にある名前で colors のトークンを追加すると conflicting-token-name になる", () => {
  const added = TokenSet.add(setupTokens(), {
    kind: "colors",
    name: "fade",
    value: "#ffffff",
  });

  expect(added).toEqual(
    Result.err({
      kind: "conflicting-token-name",
      ref: { kind: "colors", name: "fade" },
      conflictsWith: "gradients",
    }),
  );
});

test("塗り以外の種別にある名前なら gradients のトークンを追加できる", () => {
  const added = TokenSet.add(setupTokens(), {
    kind: "gradients",
    name: "sm",
    value: Fade,
  });

  expect(Result.isOk(added)).toBe(true);
});

test("colors のトークンを gradients にある名前へ改名すると conflicting-token-name になる", () => {
  const renamed = TokenSet.rename(
    setupTokens(),
    { kind: "colors", name: "primary" },
    "fade",
  );

  expect(renamed).toEqual(
    Result.err({
      kind: "conflicting-token-name",
      ref: { kind: "colors", name: "fade" },
      conflictsWith: "gradients",
    }),
  );
});

test("gradients のトークンを colors にある名前へ改名すると conflicting-token-name になる", () => {
  const renamed = TokenSet.rename(
    setupTokens(),
    { kind: "gradients", name: "fade" },
    "primary",
  );

  expect(renamed).toEqual(
    Result.err({
      kind: "conflicting-token-name",
      ref: { kind: "gradients", name: "primary" },
      conflictsWith: "colors",
    }),
  );
});

test("同じ種別にも塗りの相手の種別にもある名前で追加すると duplicate-token-name になる", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { brand: "#3b82f6" },
    gradients: { brand: Fade },
  };

  const added = TokenSet.add(tokens, {
    kind: "colors",
    name: "brand",
    value: "#ffffff",
  });

  expect(added).toEqual(
    Result.err({
      kind: "duplicate-token-name",
      ref: { kind: "colors", name: "brand" },
    }),
  );
});

test("規則を満たさず塗りの相手の種別にもある名前で追加すると invalid-token-name になる", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    gradients: { Brand: Fade },
  };

  const added = TokenSet.add(tokens, {
    kind: "colors",
    name: "Brand",
    value: "#ffffff",
  });

  expect(added).toEqual(
    Result.err({
      kind: "invalid-token-name",
      ref: { kind: "colors", name: "Brand" },
    }),
  );
});

test("gradients にある名前を基に colors の名前を採ると連番が付く", () => {
  expect(TokenSet.uniqueName(setupTokens(), "colors", "fade")).toBe("fade-2");
});

test("colors にある名前を基に gradients の名前を採ると連番が付く", () => {
  expect(TokenSet.uniqueName(setupTokens(), "gradients", "primary")).toBe(
    "primary-2",
  );
});

test("塗り以外の種別にある名前を基に gradients の名前を採るとそのまま使える", () => {
  expect(TokenSet.uniqueName(setupTokens(), "gradients", "sm")).toBe("sm");
});

test("colors と gradients の両方にある名前だけが衝突として集まる", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { brand: "#3b82f6", primary: "#3b82f6" },
    gradients: { brand: Fade, fade: Fade },
    spacing: { primary: 8 },
  };

  expect(TokenSet.collectPaintNameConflicts(tokens)).toEqual(["brand"]);
});

test("名前の衝突の失敗は、足そうとした種別と衝突した相手の種別を文に出す", () => {
  const message = TokenEditError.message({
    kind: "conflicting-token-name",
    ref: { kind: "gradients", name: "primary" },
    conflictsWith: "colors",
  });

  expect(message).toBe(
    'token name "primary" in gradients is already used in colors',
  );
});

test("colors にだけある名前は colors を指している", () => {
  expect(TokenSet.findPaintKind(setupTokens(), "primary")).toEqual(
    Option.some("colors"),
  );
});

test("gradients にだけある名前は gradients を指している", () => {
  expect(TokenSet.findPaintKind(setupTokens(), "fade")).toEqual(
    Option.some("gradients"),
  );
});

test("colors と gradients の両方にある名前はどちらを指しているか決まらない", () => {
  const tokens: TokenSet = {
    ...TokenSet.empty(),
    colors: { brand: "#3b82f6" },
    gradients: { brand: Fade },
  };

  expect(TokenSet.findPaintKind(tokens, "brand")).toEqual(Option.none);
});

test("塗り用の 2 種別のどちらにも無い名前は、他の種別にあっても塗りとしては指せない", () => {
  expect(TokenSet.findPaintKind(setupTokens(), "sm")).toEqual(Option.none);
});
