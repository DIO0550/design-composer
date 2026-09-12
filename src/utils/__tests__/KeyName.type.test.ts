import { expect, test } from "vitest";
import type { KeyName } from "../KeyName";

/*
 * 語彙を型で閉じたことを固定する（`rules/coding.md`「値の語彙を型で閉じる」）。
 * 素の `string` が通るようになると、待ち受けるキーの綴りをタイポしても気づけない。
 */

test("語彙に無い綴りは型レベルで拒否する", () => {
  // @ts-expect-error "Escap" は KeyName の語彙に無い（TS2820）
  const names: readonly KeyName[] = ["Escap"];

  expect(names).toEqual(["Escap"]);
});

test("素の string は型レベルで拒否する", () => {
  const typed: string = "Enter";
  // @ts-expect-error string は KeyName へ代入できない（TS2322）
  const name: KeyName = typed;

  expect(name).toBe("Enter");
});
