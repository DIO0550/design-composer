import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { RecordEx } from "@/utils/RecordEx";

test("辞書が持っているキーは、あると判定される", () => {
  expect(RecordEx.has({ primary: 1 }, "primary")).toBe(true);
});

test("辞書が持っているキーを引くと、その値が返る", () => {
  expect(RecordEx.get({ primary: 1 }, "primary")).toEqual(Option.some(1));
});

test("辞書が持っていないキーを引くと、見つからない", () => {
  expect(RecordEx.get({ primary: 1 }, "secondary")).toEqual(Option.none);
});

test("constructor というキーを辞書が自前で持っていれば、その値が引ける", () => {
  expect(RecordEx.get({ constructor: 1 }, "constructor")).toEqual(
    Option.some(1),
  );
});
