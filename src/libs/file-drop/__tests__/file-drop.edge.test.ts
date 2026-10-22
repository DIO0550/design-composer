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

  expect(Result.isOk(subscribed)).toBe(false);
});

test("ファイル名の要素を持たないパスは、その 1 件だけ配られない", async () => {
  const fake = FileDropFake.create();
  const received: (readonly string[])[] = [];
  Result.unwrap(
    await fake.drop.subscribeDropped((paths) => {
      received.push(paths);
    }),
  );

  fake.dropFiles(["/", Path]);

  expect(received).toStrictEqual([[Path]]);
});

test("ファイル名の要素を持つパスが 1 件も残らないドロップは配られない", async () => {
  const fake = FileDropFake.create();
  const received: (readonly string[])[] = [];
  Result.unwrap(
    await fake.drop.subscribeDropped((paths) => {
      received.push(paths);
    }),
  );

  fake.dropFiles(["/", "\\"]);
  // 配られる側を 1 件混ぜる。配る処理ごと壊れていても通る、を防ぐ。
  fake.dropFiles([Path]);

  expect(received).toStrictEqual([[Path]]);
});

test("空の並びのドロップは配られない", async () => {
  const fake = FileDropFake.create();
  const received: (readonly string[])[] = [];
  Result.unwrap(
    await fake.drop.subscribeDropped((paths) => {
      received.push(paths);
    }),
  );

  fake.dropFiles([]);
  // 配られる側を 1 件混ぜる。配る処理ごと壊れていても通る、を防ぐ。
  fake.dropFiles([Path]);

  expect(received).toStrictEqual([[Path]]);
});
