import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { JsonText } from "../index";

test("JSON として読めないテキストは読めず、読めなかった理由の文言を持つ", () => {
  const parsed = JsonText.parse("{");

  expect(Result.isOk(parsed) ? "" : parsed.error).not.toBe("");
});
