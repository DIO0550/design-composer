import { expect, test } from "vitest";
import { Locking } from "../index";

test("語彙に無い綴りを書いたノードはロックしていないとして読まれる", () => {
  expect(Locking.fromProps({ locking: "frozen" })).toBe("unlocked");
});
