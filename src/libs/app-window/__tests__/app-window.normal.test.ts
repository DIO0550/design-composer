import { expect, test } from "vitest";
import { createAppWindowFake } from "../fake";

test("閉じると、ウィンドウが閉じる", async () => {
  const fake = createAppWindowFake();

  await fake.appWindow.close();

  expect(fake.isWindowClosed()).toBe(true);
});
