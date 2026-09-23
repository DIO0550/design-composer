import { expect, test } from "vitest";
import { CaseStyle } from "../CaseStyle";

test("ハイフンは語の切れ目として扱わず、先頭が大文字になるだけ", () => {
  expect(CaseStyle.toCapitalCase("width-mode")).toBe("Width-mode");
});
