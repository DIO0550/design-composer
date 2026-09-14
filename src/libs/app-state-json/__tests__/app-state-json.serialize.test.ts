import { expect, test } from "vitest";
import { AppStateJson } from "../index";

test("最近使ったファイルの一覧が recentPaths として書き出される", () => {
  expect(
    AppStateJson.serialize({
      recentPaths: ["/work/login.dcmp", "/work/shop/app.dcmp"],
    }),
  ).toBe('{"recentPaths":["/work/login.dcmp","/work/shop/app.dcmp"]}');
});

test("1 件も無い一覧は空の並びとして書き出される", () => {
  expect(AppStateJson.serialize({ recentPaths: [] })).toBe(
    '{"recentPaths":[]}',
  );
});
