import { expectTypeOf, test } from "vitest";
import { FilePath } from "../index";

test("素の文字列はファイルのパスとして渡せない", () => {
  expectTypeOf<string>().not.toExtend<FilePath>();
});

test("ファイル名の取得は不在を返さない", () => {
  expectTypeOf(FilePath.fileName).returns.toEqualTypeOf<string>();
});
