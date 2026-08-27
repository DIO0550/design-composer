import { expect, test } from "vitest";
import { Props } from "../index";

test("設定されている props は prop 名と値の対の並びへ展開される", () => {
  expect(Props.toAssignments({ direction: "row", width: 320 })).toEqual([
    { name: "direction", value: "row" },
    { name: "width", value: 320 },
  ]);
});

test("props が空のときは1件も展開されない", () => {
  expect(Props.toAssignments({})).toEqual([]);
});
