import { expect, test } from "vitest";
import { Visibility } from "../index";

test("語彙に無い綴りを書いたノードは表示として読まれる", () => {
  expect(Visibility.fromProps({ visibility: "collapsed" })).toBe("visible");
});
