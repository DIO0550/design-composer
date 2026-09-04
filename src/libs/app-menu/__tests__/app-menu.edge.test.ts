import { expect, test } from "vitest";
import { type AppMenuCommand, AppMenuCommands } from "@/libs/app-menu";
import { AppMenuFake } from "@/libs/app-menu/fake";
import { Result } from "@/utils/Result";

test("語彙に無い指示は配られない", async () => {
  const fake = AppMenuFake.create();
  const received: AppMenuCommand[] = [];
  Result.unwrap(
    await fake.menu.subscribeCommand((command) => {
      received.push(command);
    }),
  );

  fake.deliverUnknown("quit");
  // 語彙にある指示を 1 件混ぜる。届く側を壊しても、落とす側を壊しても落ちる。
  fake.choose(AppMenuCommands.Open);

  expect(received).toStrictEqual([AppMenuCommands.Open]);
});

test("購読を張れなければ失敗が返る", async () => {
  const fake = AppMenuFake.create();
  fake.denySubscribe();

  const subscribed = await fake.menu.subscribeCommand(() => {});

  expect(subscribed.ok).toBe(false);
});
