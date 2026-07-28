import { expect, test } from "vitest";
import { Json, type JsonRecordCursor } from "@/utils/Json";
import { Result } from "@/utils/Result";

function setupRecord(
  record: Readonly<Record<string, unknown>>,
  path = "",
): JsonRecordCursor {
  return Result.unwrap(Json.record(Json.create(record, path)));
}

test("文字列を期待する位置に文字列があるとその値が取り出せる", () => {
  expect(Result.unwrap(Json.string(Json.create("hello", "name")))).toBe(
    "hello",
  );
});

test("数値を期待する位置に数値があるとその値が取り出せる", () => {
  expect(Result.unwrap(Json.number(Json.create(16, "width")))).toBe(16);
});

test("必須フィールドが存在するとその値がデコードされる", () => {
  const record = setupRecord({ name: "screen" });

  expect(Result.unwrap(Json.required(record, "name", Json.string))).toBe(
    "screen",
  );
});

test("任意フィールドが存在しないと未設定として扱われる", () => {
  const record = setupRecord({});

  expect(
    Result.unwrap(Json.optional(record, "props", Json.string)),
  ).toBeUndefined();
});

test("辞書は値ごとにデコードされて名前が保たれる", () => {
  const decoded = Json.mapOf(
    Json.create({ sm: 8, md: 16 }, "spacing"),
    Json.number,
  );

  expect(Result.unwrap(decoded)).toEqual({ sm: 8, md: 16 });
});

test("配列は要素ごとにデコードされて順序が保たれる", () => {
  const decoded = Json.arrayOf(Json.create(["a", "b"], "names"), Json.string);

  expect(Result.unwrap(decoded)).toEqual(["a", "b"]);
});

test("知っているフィールドだけのオブジェクトはそのまま通る", () => {
  const record = setupRecord({ name: "screen" });
  const decoded = Json.knownFields(Result.ok("ok"), record, ["name"]);

  expect(Result.unwrap(decoded)).toBe("ok");
});

test("辞書は名前の昇順で書き出される", () => {
  const written = Json.sortedMap({ md: 16, xs: 4, lg: 24 }, (value) => value);

  expect(Object.keys(written)).toEqual(["lg", "md", "xs"]);
});

test("未設定の値はフィールドとして現れない", () => {
  expect(Json.definedField("spread", undefined)).toEqual({});
});

test("設定された値はフィールドとして現れる", () => {
  expect(Json.definedField("spread", 4)).toEqual({ spread: 4 });
});

test("空のオブジェクトはフィールドとして現れない", () => {
  expect(Json.nonEmptyField("props", {})).toEqual({});
});

test("空の配列はフィールドとして現れない", () => {
  expect(Json.nonEmptyField("children", [])).toEqual({});
});

test("中身のある値はフィールドとして現れる", () => {
  expect(Json.nonEmptyField("props", { gap: "md" })).toEqual({
    props: { gap: "md" },
  });
});
