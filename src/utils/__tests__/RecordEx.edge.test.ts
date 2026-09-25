import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { RecordEx } from "@/utils/RecordEx";

test("プロトタイプ上にだけある constructor は、あると判定されない", () => {
  expect(RecordEx.has({}, "constructor")).toBe(false);
});

test("プロトタイプ上にだけある toString を引くと、見つからない", () => {
  expect(RecordEx.get({}, "toString")).toEqual(Option.none);
});
