import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { RecordEx } from "@/utils/RecordEx";

test("辞書自身が持つキーは、あると判定される", () => {
  expect(RecordEx.has({ primary: "#000" }, "primary")).toBe(true);
});

test("辞書自身が持つキーは、その値を引ける", () => {
  expect(RecordEx.get({ primary: "#000" }, "primary")).toEqual(
    Option.some("#000"),
  );
});

test("辞書に無いキーは、引くと none になる", () => {
  expect(RecordEx.get({ primary: "#000" }, "secondary")).toEqual(Option.none);
});
