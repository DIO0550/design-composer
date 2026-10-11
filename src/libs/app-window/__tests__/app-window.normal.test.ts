import { expect, test } from "vitest";
import { AppWindowFake } from "../fake";

test("閉じると、ウィンドウが閉じる", async () => {
  const fake = AppWindowFake.create();

  await fake.appWindow.close();

  expect(fake.windowClosed()).toBe(true);
});
