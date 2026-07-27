import { expect, test } from "vitest";
import { ResolvedProps } from "../index";

test("デフォルト「なし」の gap は未指定のとき解決済み props に含まれない", () => {
  const resolved = ResolvedProps.resolve("Box", {});
  expect("gap" in resolved).toBe(false);
});

test("デフォルト「なし」の background は未指定のとき解決済み props に含まれない", () => {
  const resolved = ResolvedProps.resolve("Box", {});
  expect("background" in resolved).toBe(false);
});

test("デフォルト「なし」の prop も明示的に指定すればその値が解決済み props に含まれる", () => {
  const resolved = ResolvedProps.resolve("Box", { gap: "md" });
  expect(resolved.gap).toBe("md");
});

test("resolve は渡された props オブジェクトを書き換えない", () => {
  const original = { direction: "row" as const };
  const frozen = Object.freeze(original);
  ResolvedProps.resolve("Box", frozen);
  expect(frozen).toEqual({ direction: "row" });
});

test("resolve は呼び出しごとに新しいオブジェクトを返す", () => {
  const props = { direction: "row" as const };
  const resolved = ResolvedProps.resolve("Box", props);
  expect(resolved).not.toBe(props);
});
