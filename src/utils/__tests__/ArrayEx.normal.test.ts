import { expect, test } from "vitest";
import { ArrayEx } from "../ArrayEx";
import { Option } from "../Option";
import { Result } from "../Result";

test("配列の範囲内の index は isIndexInRange で true になる", () => {
  expect(ArrayEx.isIndexInRange(["a", "b", "c"], 1)).toBe(true);
});

test("配列の末尾要素の index は isIndexInRange で true になる", () => {
  expect(ArrayEx.isIndexInRange(["a", "b", "c"], 2)).toBe(true);
});

test("配列の要素数と同じ index は isIndexInRange で false になる", () => {
  expect(ArrayEx.isIndexInRange(["a", "b", "c"], 3)).toBe(false);
});

test("負の index は isIndexInRange で false になる", () => {
  expect(ArrayEx.isIndexInRange(["a", "b", "c"], -1)).toBe(false);
});

test("空配列に対しては isIndexInRange が常に false になる", () => {
  expect(ArrayEx.isIndexInRange([], 0)).toBe(false);
});

test("配列の範囲内の index は isInsertionIndexInRange で true になる", () => {
  expect(ArrayEx.isInsertionIndexInRange(["a", "b", "c"], 1)).toBe(true);
});

test("配列の要素数と同じ index は isInsertionIndexInRange で true になる", () => {
  expect(ArrayEx.isInsertionIndexInRange(["a", "b", "c"], 3)).toBe(true);
});

test("配列の要素数より大きい index は isInsertionIndexInRange で false になる", () => {
  expect(ArrayEx.isInsertionIndexInRange(["a", "b", "c"], 4)).toBe(false);
});

test("負の index は isInsertionIndexInRange で false になる", () => {
  expect(ArrayEx.isInsertionIndexInRange(["a", "b", "c"], -1)).toBe(false);
});

test("空配列の先頭への挿入位置は isInsertionIndexInRange で true になる", () => {
  expect(ArrayEx.isInsertionIndexInRange([], 0)).toBe(true);
});

test("小数の index は isIndexInRange で false になる", () => {
  expect(ArrayEx.isIndexInRange(["a", "b", "c"], 1.5)).toBe(false);
});

test("小数の index は isInsertionIndexInRange で false になる", () => {
  expect(ArrayEx.isInsertionIndexInRange(["a", "b", "c"], 1.5)).toBe(false);
});

test("insertAt で指定位置に要素を挿入できる", () => {
  expect(Result.unwrap(ArrayEx.insertAt(["a", "c"], 1, "b"))).toEqual([
    "a",
    "b",
    "c",
  ]);
});

test("insertAt で配列末尾に要素を追加できる", () => {
  expect(Result.unwrap(ArrayEx.insertAt(["a", "b"], 2, "c"))).toEqual([
    "a",
    "b",
    "c",
  ]);
});

test("insertAt は元の配列を変更しない", () => {
  const array = ["a", "c"];
  ArrayEx.insertAt(array, 1, "b");
  expect(array).toEqual(["a", "c"]);
});

test("moveWithin で要素を後方へ移動できる", () => {
  expect(Result.unwrap(ArrayEx.moveWithin(["a", "b", "c"], 0, 2))).toEqual([
    "b",
    "c",
    "a",
  ]);
});

test("moveWithin で要素を前方へ移動できる", () => {
  expect(Result.unwrap(ArrayEx.moveWithin(["a", "b", "c"], 2, 0))).toEqual([
    "c",
    "a",
    "b",
  ]);
});

test("moveWithin は元の配列を変更しない", () => {
  const array = ["a", "b", "c"];
  ArrayEx.moveWithin(array, 0, 2);
  expect(array).toEqual(["a", "b", "c"]);
});

test("replaceAt で指定位置の要素を差し替えられる", () => {
  expect(Result.unwrap(ArrayEx.replaceAt(["a", "b", "c"], 1, "x"))).toEqual([
    "a",
    "x",
    "c",
  ]);
});

test("replaceAt は元の配列を変更しない", () => {
  const array = ["a", "b", "c"];
  ArrayEx.replaceAt(array, 1, "x");
  expect(array).toEqual(["a", "b", "c"]);
});

test("distinct は重複を取り除く", () => {
  expect(ArrayEx.distinct(["a", "b", "a", "c", "b"])).toEqual(["a", "b", "c"]);
});

test("distinct は各値が最初に現れた順序を保つ", () => {
  expect(ArrayEx.distinct(["c", "a", "c"])).toEqual(["c", "a"]);
});

test("distinct は元の配列を変更しない", () => {
  const array = ["a", "a"];
  ArrayEx.distinct(array);
  expect(array).toEqual(["a", "a"]);
});

test("並びの先頭の要素は first で取り出せる", () => {
  expect(ArrayEx.first(["a", "b", "c"])).toEqual(Option.some("a"));
});

test("並びの末尾の要素は last で取り出せる", () => {
  expect(ArrayEx.last(["a", "b", "c"])).toEqual(Option.some("c"));
});

test("dropFirst は先頭を除いた並びを返す", () => {
  expect(ArrayEx.dropFirst(["a", "b", "c"])).toEqual(["b", "c"]);
});

test("dropLast は末尾を除いた並びを返す", () => {
  expect(ArrayEx.dropLast(["a", "b", "c"])).toEqual(["a", "b"]);
});

test("prependIfAbsent は含まれていない値を先頭へ足す", () => {
  expect(ArrayEx.prependIfAbsent(["b", "c"], "a")).toEqual(["a", "b", "c"]);
});

test("prependIfAbsent は既に含まれている値の位置を動かさない", () => {
  expect(ArrayEx.prependIfAbsent(["a", "b", "c"], "c")).toEqual([
    "a",
    "b",
    "c",
  ]);
});

test("findEqual は並びの中の等しい要素を返す", () => {
  expect(ArrayEx.findEqual(["a", "b", "c"], "b")).toEqual(Option.some("b"));
});

test("findEqual は等しい要素が無ければ none を返す", () => {
  expect(ArrayEx.findEqual(["a", "b", "c"], "z")).toEqual(Option.none);
});

test("countOccurrences は各値の出現回数を最初に現れた順で返す", () => {
  expect([...ArrayEx.countOccurrences(["b", "a", "b", "c", "b", "a"])]).toEqual(
    [
      ["b", 3],
      ["a", 2],
      ["c", 1],
    ],
  );
});

test("minBy は取り出した数値が最も小さい要素を返す", () => {
  expect(ArrayEx.minBy(["ccc", "a", "bb"], (item) => item.length)).toEqual(
    Option.some("a"),
  );
});

test("minBy は同じ数値の要素が 2 つあると先に並んだほうを返す", () => {
  // 後ろのほうを採ると "y2" になる
  expect(ArrayEx.minBy(["y1", "zzz", "y2"], (item) => item.length)).toEqual(
    Option.some("y1"),
  );
});

test("minBy は空の並びには none を返す", () => {
  expect(ArrayEx.minBy([], (item: string) => item.length)).toEqual(Option.none);
});
