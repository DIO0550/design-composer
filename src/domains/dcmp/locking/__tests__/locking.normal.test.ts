import { expect, test } from "vitest";
import { Locking } from "../index";

test("ロックを書いていないノードはロックしていないとして読まれる", () => {
  expect(Locking.fromProps({})).toBe("unlocked");
});

test("ロックと書いたノードはロックとして読まれる", () => {
  expect(Locking.fromProps({ locking: "locked" })).toBe("locked");
});

test("ロックと書いた Box のノードはロックとして読まれる", () => {
  expect(
    Locking.fromNode({
      name: "panel",
      type: "Box",
      props: { locking: "locked" },
    }),
  ).toBe("locked");
});

test("参照ノード直下にロックと書いたインスタンスはロックとして読まれる", () => {
  expect(
    Locking.fromNode({
      name: "login",
      ref: "primary-button",
      locking: "locked",
    }),
  ).toBe("locked");
});

test("インスタンスの上書きにロックと書いても、インスタンスのロックにはならない", () => {
  expect(
    Locking.fromNode({
      name: "login",
      ref: "primary-button",
      overrides: { locking: "locked" },
    }),
  ).toBe("unlocked");
});
