import { expect, test } from "vitest";
import { type AppMenuCommand, AppMenuCommands } from "@/libs/app-menu";
import { AppMenuFake } from "@/libs/app-menu/fake";
import { Result } from "@/utils/Result";

/**
 * 購読を張り、届いた指示を溜める。
 *
 * @returns 選択を起こす代役と、これまでに届いた指示
 */
async function subscribeMenu(): Promise<
  Readonly<{ fake: AppMenuFake; received: AppMenuCommand[] }>
> {
  const fake = AppMenuFake.create();
  const received: AppMenuCommand[] = [];
  Result.unwrap(
    await fake.menu.subscribeCommand((command) => {
      received.push(command);
    }),
  );
  return { fake, received };
}

test("開くが選ばれると、開く指示が届く", async () => {
  const { fake, received } = await subscribeMenu();

  fake.choose(AppMenuCommands.Open);

  expect(received).toStrictEqual([AppMenuCommands.Open]);
});

test("新規作成が選ばれると、作る指示が届く", async () => {
  const { fake, received } = await subscribeMenu();

  fake.choose(AppMenuCommands.Create);

  expect(received).toStrictEqual([AppMenuCommands.Create]);
});

test("購読を解除すると、その後に選ばれても届かない", async () => {
  const fake = AppMenuFake.create();
  const received: AppMenuCommand[] = [];
  const unsubscribe = Result.unwrap(
    await fake.menu.subscribeCommand((command) => {
      received.push(command);
    }),
  );
  // 解除の前に 1 件届けておく。解除の後だけを見ると、そもそも届いていない実装でも通る。
  fake.choose(AppMenuCommands.Open);

  unsubscribe();
  fake.choose(AppMenuCommands.Create);

  expect(received).toStrictEqual([AppMenuCommands.Open]);
});
