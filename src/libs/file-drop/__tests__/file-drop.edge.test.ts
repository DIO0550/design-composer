import { expect, test } from "vitest";
import { FileDropFake } from "@/libs/file-drop/fake";
import { Result } from "@/utils/Result";

const Path = "/work/login.dcmp";

test("パスの並びを持たない通知は配られない", async () => {
  const fake = FileDropFake.create();
  const received: (readonly string[])[] = [];
  Result.unwrap(
    await fake.drop.subscribeDropped((paths) => {
      received.push(paths);
    }),
  );

  // ドラッグ中の通過は位置しか持たない。
  fake.deliverUnknown({ position: { x: 12, y: 34 } });
  // 落とされた側を 1 件混ぜる。届く側を壊しても、落とす側を壊しても落ちる。
  fake.dropFiles([Path]);

  expect(received).toStrictEqual([[Path]]);
});

test("購読を張れなければ失敗が返る", async () => {
  const fake = FileDropFake.create();
  fake.denySubscribe();

  const subscribed = await fake.drop.subscribeDropped(() => {});

  expect(subscribed.ok).toBe(false);
});
