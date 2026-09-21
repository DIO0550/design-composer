import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { RecentFiles } from "../index";

/**
 * 上限（10 件）を 1 件超える並び。古いものから落ちることを確かめるために使う。
 *
 * @returns `/work/1.dcmp` から `/work/11.dcmp` までの 11 件
 */
function elevenPaths(): readonly string[] {
  return Array.from({ length: 11 }, (_, index) => `/work/${index + 1}.dcmp`);
}

test("1 件も開いていなければ前回開いていたファイルは無い", () => {
  expect(RecentFiles.latest(RecentFiles.Empty)).toStrictEqual(Option.none);
});

test("重複を含む並びから作ると重複が取り除かれる", () => {
  const recents = RecentFiles.create([
    "/work/a.dcmp",
    "/work/b.dcmp",
    "/work/a.dcmp",
  ]);

  expect(recents.paths).toStrictEqual(["/work/a.dcmp", "/work/b.dcmp"]);
});

test("上限を超える並びから作ると古いものが落ちる", () => {
  expect(RecentFiles.create(elevenPaths()).paths).toStrictEqual(
    elevenPaths().slice(0, 10),
  );
});

test("上限まで並んでいる一覧へ開くと、いちばん古いものが落ちる", () => {
  const recents = RecentFiles.create(elevenPaths().slice(0, 10));

  expect(
    RecentFiles.withOpenedPath(recents, "/work/new.dcmp").paths,
  ).toStrictEqual(["/work/new.dcmp", ...elevenPaths().slice(0, 9)]);
});
