import { expect, test } from "vitest";
import { BoxAlign } from "../index";

test("揃えを書いていない Box は stretch として読まれる", () => {
  expect(BoxAlign.fromProps({})).toBe("stretch");
});

test("語彙に無い綴りの揃えは stretch として読まれる", () => {
  expect(BoxAlign.fromProps({ align: "baseline" })).toBe("stretch");
});

test("start と書いた Box は start として読まれる", () => {
  expect(BoxAlign.fromProps({ align: "start" })).toBe("start");
});

test("center と書いた Box は center として読まれる", () => {
  expect(BoxAlign.fromProps({ align: "center" })).toBe("center");
});

test("end と書いた Box は end として読まれる", () => {
  expect(BoxAlign.fromProps({ align: "end" })).toBe("end");
});

test("start は長さを決めた子を始点に置く", () => {
  expect(BoxAlign.isStartForFixedChild("start")).toBe(true);
});

test("stretch は長さを決めた子を始点に置く", () => {
  expect(BoxAlign.isStartForFixedChild("stretch")).toBe(true);
});

test("center は長さを決めた子を始点に置かない", () => {
  expect(BoxAlign.isStartForFixedChild("center")).toBe(false);
});

test("end は長さを決めた子を始点に置かない", () => {
  expect(BoxAlign.isStartForFixedChild("end")).toBe(false);
});
