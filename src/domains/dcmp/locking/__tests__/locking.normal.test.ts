import { expect, test } from "vitest";
import { Locking } from "../index";

test("ロックを書いていないノードはロックしていないとして読まれる", () => {
  expect(Locking.fromProps({})).toBe("unlocked");
});

test("ロックと書いたノードはロックとして読まれる", () => {
  expect(Locking.fromProps({ locking: "locked" })).toBe("locked");
});
