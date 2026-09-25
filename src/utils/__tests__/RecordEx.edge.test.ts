import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { RecordEx } from "@/utils/RecordEx";

test("空の辞書では、プロトタイプ上の名前 constructor をあると判定しない", () => {
  expect(RecordEx.has({}, "constructor")).toBe(false);
});

test("空の辞書では、プロトタイプ上の名前 toString をあると判定しない", () => {
  expect(RecordEx.has({}, "toString")).toBe(false);
});

test("空の辞書では、プロトタイプ上の名前 __proto__ をあると判定しない", () => {
  expect(RecordEx.has({}, "__proto__")).toBe(false);
});

test("空の辞書でプロトタイプ上の名前を引くと none になる", () => {
  expect(RecordEx.get({}, "constructor")).toEqual(Option.none);
});

test("辞書自身が constructor というキーを持つなら、その値を引ける", () => {
  expect(RecordEx.get({ constructor: "#000" }, "constructor")).toEqual(
    Option.some("#000"),
  );
});

test("JSON から読んだ辞書が __proto__ というキーを持つなら、その値を引ける", () => {
  const record: Readonly<Record<string, unknown>> = JSON.parse(
    '{"__proto__": "#000"}',
  );

  expect(RecordEx.get(record, "__proto__")).toEqual(Option.some("#000"));
});

test("キーはあっても値が undefined なら none になる", () => {
  expect(RecordEx.get({ primary: undefined }, "primary")).toEqual(Option.none);
});
