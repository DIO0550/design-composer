import { expect, test } from "vitest";
import { Result } from "@/utils/Result";
import { createAppWindowFake } from "../fake";

test("閉じるのを拒まれたら、拒まれた理由を持つ失敗になる", async () => {
  const fake = createAppWindowFake();
  fake.denyClose();

  const closed = await fake.appWindow.close();

  expect(closed).toStrictEqual(
    Result.err({
      message: "close_current_window: ウィンドウを閉じられない",
    }),
  );
});
