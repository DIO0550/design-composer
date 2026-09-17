import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { AppStateJson } from "../index";

test("recentPaths に書かれたパスが最近使ったファイルとして読み取れる", () => {
  const parsed = AppStateJson.parse('{"recentPaths":["/work/login.dcmp"]}');

  expect(Result.unwrap(parsed)).toStrictEqual({
    recentPaths: ["/work/login.dcmp"],
  });
});

test("書かれている並びが順序のまま読み取れる", () => {
  const parsed = AppStateJson.parse(
    '{"recentPaths":["/work/a.dcmp","/work/b.dcmp","/work/c.dcmp"]}',
  );

  expect(Result.unwrap(parsed).recentPaths).toStrictEqual([
    "/work/a.dcmp",
    "/work/b.dcmp",
    "/work/c.dcmp",
  ]);
});

test("知らないフィールドがあっても recentPaths は読み取れる", () => {
  const parsed = AppStateJson.parse(
    '{"recentPaths":["/work/login.dcmp"],"windowSize":{"width":800}}',
  );

  expect(Result.unwrap(parsed).recentPaths).toStrictEqual(["/work/login.dcmp"]);
});
