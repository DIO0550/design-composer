import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { JsonText } from "../index";

test("JSON として読めるテキストは、書かれている値として読める", () => {
  expect(Result.unwrap(JsonText.parse('{"a":[1,"b"]}'))).toEqual({
    a: [1, "b"],
  });
});
