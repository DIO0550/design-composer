import { expect, test } from "vitest";
import { PropEdit } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
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

test("書かれている align だけを、同じ値で書く編集になる", () => {
  expect([
    BoxAlign.collectWrittenPropEdits({ align: "center", gap: "md" }),
    BoxAlign.collectWrittenPropEdits({ gap: "md" }),
  ]).toEqual([[PropEdit.set(["align"], "center")], []]);
});

test("何も書いていない親は、子を幅の軸へ引き伸ばす", () => {
  expect(BoxAlign.stretchedAxis({})).toEqual(Option.some("width"));
});

test("揃えを stretch、layout を column と書いた親は、子を幅の軸へ引き伸ばす", () => {
  expect(
    BoxAlign.stretchedAxis({ align: "stretch", layout: "column" }),
  ).toEqual(Option.some("width"));
});

test("layout: row の親は、子を高さの軸へ引き伸ばす", () => {
  expect(BoxAlign.stretchedAxis({ layout: "row" })).toEqual(
    Option.some("height"),
  );
});

test("揃えが start の親は、子を引き伸ばさない", () => {
  expect(BoxAlign.stretchedAxis({ align: "start" })).toEqual(Option.none);
});

test("揃えが center の親は、子を引き伸ばさない", () => {
  expect(BoxAlign.stretchedAxis({ align: "center" })).toEqual(Option.none);
});

test("揃えが end の親は、子を引き伸ばさない", () => {
  expect(BoxAlign.stretchedAxis({ align: "end" })).toEqual(Option.none);
});

test("layout: free の親は、揃えが stretch でも子を引き伸ばさない", () => {
  expect(BoxAlign.stretchedAxis({ layout: "free" })).toEqual(Option.none);
});
