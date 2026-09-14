import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { RecentFiles } from "../index";

test("開いたファイルが一覧の先頭に来る", () => {
  const recents = RecentFiles.create(["/work/a.dcmp", "/work/b.dcmp"]);

  expect(
    RecentFiles.withOpenedPath(recents, "/work/c.dcmp").paths,
  ).toStrictEqual(["/work/c.dcmp", "/work/a.dcmp", "/work/b.dcmp"]);
});

test("既に一覧にあるファイルを開くと重複せず先頭へ移る", () => {
  const recents = RecentFiles.create([
    "/work/a.dcmp",
    "/work/b.dcmp",
    "/work/c.dcmp",
  ]);

  expect(
    RecentFiles.withOpenedPath(recents, "/work/c.dcmp").paths,
  ).toStrictEqual(["/work/c.dcmp", "/work/a.dcmp", "/work/b.dcmp"]);
});

test("前回開いていたファイルは一覧の先頭になる", () => {
  const recents = RecentFiles.create([
    "/work/a.dcmp",
    "/work/b.dcmp",
    "/work/c.dcmp",
  ]);

  expect(RecentFiles.latest(recents)).toStrictEqual(
    Option.some("/work/a.dcmp"),
  );
});

test("開いたばかりのファイルが前回開いていたファイルになる", () => {
  const recents = RecentFiles.create(["/work/a.dcmp", "/work/b.dcmp"]);

  expect(
    RecentFiles.latest(RecentFiles.withOpenedPath(recents, "/work/b.dcmp")),
  ).toStrictEqual(Option.some("/work/b.dcmp"));
});
