import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { TokenSet } from "../index";

/** colors と spacing に 2 件ずつ持つトークン集合。 */
function setupTokens(): TokenSet {
  return {
    ...TokenSet.empty(),
    colors: { primary: "#3b82f6", danger: "#ef4444" },
    spacing: { sm: 8, md: 16 },
  };
}

test("トークンを追加するとその種別から引けるようになる", () => {
  const tokens = Result.unwrap(
    TokenSet.add(setupTokens(), {
      kind: "colors",
      name: "accent",
      value: "#00ff00",
    }),
  );

  expect(TokenSet.find(tokens, { kind: "colors", name: "accent" })).toEqual(
    Option.some({ kind: "colors", name: "accent", value: "#00ff00" }),
  );
});

test("大文字で書いた色を追加すると小文字の hex になる", () => {
  const tokens = Result.unwrap(
    TokenSet.add(setupTokens(), {
      kind: "colors",
      name: "accent",
      value: "#00FF00",
    }),
  );

  expect(TokenSet.find(tokens, { kind: "colors", name: "accent" })).toEqual(
    Option.some({ kind: "colors", name: "accent", value: "#00ff00" }),
  );
});

test("同じ名前が別の種別にあっても追加できる", () => {
  const added = TokenSet.add(setupTokens(), {
    kind: "spacing",
    name: "primary",
    value: 4,
  });

  expect(added.ok).toBe(true);
});

test("同じ種別に既にある名前では追加できない", () => {
  const added = TokenSet.add(setupTokens(), {
    kind: "colors",
    name: "primary",
    value: "#000000",
  });

  expect(added).toEqual(
    Result.err({
      kind: "duplicate-token-name",
      ref: { kind: "colors", name: "primary" },
    }),
  );
});

test("識別子の規則を満たさない名前では追加できない", () => {
  const added = TokenSet.add(setupTokens(), {
    kind: "colors",
    name: "Primary Color",
    value: "#000000",
  });

  expect(added).toEqual(
    Result.err({
      kind: "invalid-token-name",
      ref: { kind: "colors", name: "Primary Color" },
    }),
  );
});

test("トークンの値を差し替えると新しい値が引ける", () => {
  const tokens = Result.unwrap(
    TokenSet.replace(setupTokens(), {
      kind: "spacing",
      name: "sm",
      value: 6,
    }),
  );

  expect(TokenSet.find(tokens, { kind: "spacing", name: "sm" })).toEqual(
    Option.some({ kind: "spacing", name: "sm", value: 6 }),
  );
});

test("その種別に無いトークンの値は差し替えられない", () => {
  const replaced = TokenSet.replace(setupTokens(), {
    kind: "radius",
    name: "sm",
    value: 6,
  });

  expect(replaced).toEqual(
    Result.err({
      kind: "token-not-found",
      ref: { kind: "radius", name: "sm" },
    }),
  );
});

test("トークンを改名すると新しい名前で引け、古い名前では引けなくなる", () => {
  const tokens = Result.unwrap(
    TokenSet.rename(
      setupTokens(),
      { kind: "colors", name: "primary" },
      "brand",
    ),
  );

  expect(TokenSet.find(tokens, { kind: "colors", name: "brand" })).toEqual(
    Option.some({ kind: "colors", name: "brand", value: "#3b82f6" }),
  );
  expect(TokenSet.find(tokens, { kind: "colors", name: "primary" })).toEqual(
    Option.none,
  );
});

test("改名しても種別の中の並び順は変わらない", () => {
  const tokens = Result.unwrap(
    TokenSet.rename(
      setupTokens(),
      { kind: "colors", name: "primary" },
      "brand",
    ),
  );

  expect(TokenSet.names(tokens, "colors")).toEqual(["brand", "danger"]);
});

test("同じ種別に既にある名前へは改名できない", () => {
  const renamed = TokenSet.rename(
    setupTokens(),
    { kind: "colors", name: "primary" },
    "danger",
  );

  expect(renamed).toEqual(
    Result.err({
      kind: "duplicate-token-name",
      ref: { kind: "colors", name: "danger" },
    }),
  );
});

test("同じ名前への改名は変化なしとして通る", () => {
  const tokens = setupTokens();

  const renamed = TokenSet.rename(
    tokens,
    { kind: "colors", name: "primary" },
    "primary",
  );

  expect(renamed).toEqual(Result.ok(tokens));
});

test("トークンを削除するとその種別から引けなくなる", () => {
  const tokens = Result.unwrap(
    TokenSet.remove(setupTokens(), { kind: "spacing", name: "sm" }),
  );

  expect(TokenSet.names(tokens, "spacing")).toEqual(["md"]);
});

test("使用中かどうかに関わらず削除できる", () => {
  const removed = TokenSet.remove(setupTokens(), {
    kind: "colors",
    name: "primary",
  });

  expect(removed.ok).toBe(true);
});

test("その種別に無いトークンは削除できない", () => {
  const removed = TokenSet.remove(setupTokens(), {
    kind: "colors",
    name: "unknown",
  });

  expect(removed).toEqual(
    Result.err({
      kind: "token-not-found",
      ref: { kind: "colors", name: "unknown" },
    }),
  );
});

test("種別のトークンを持っている定義順で引ける", () => {
  expect(TokenSet.tokensOf(setupTokens(), "spacing")).toEqual([
    { kind: "spacing", name: "sm", value: 8 },
    { kind: "spacing", name: "md", value: 16 },
  ]);
});

test("値が1つの値で表せる種別と複合オブジェクトの種別を区別できる", () => {
  expect(TokenSet.isScalarKind("colors")).toBe(true);
  expect(TokenSet.isScalarKind("spacing")).toBe(true);
  expect(TokenSet.isScalarKind("radius")).toBe(true);
  expect(TokenSet.isScalarKind("shadows")).toBe(false);
  expect(TokenSet.isScalarKind("typography")).toBe(false);
});
