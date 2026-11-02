import { expect, test } from "vitest";
import { createFileDrop } from "@/libs/file-drop";
import { createFileDropFake } from "@/libs/file-drop/fake";
import { createSingleEventIpcFake } from "@/libs/tauri-ipc/fake";
import { Result } from "@/utils/Result";

const Path = "/work/login.dcmp";

test("パスの並びを持たない通知は配られない", async () => {
  const fake = createFileDropFake();
  const received: (readonly string[])[] = [];
  Result.unwrap(
    await fake.drop.subscribeDropped((paths) => {
      received.push(paths);
    }),
  );

  // 位置しか持たない、形の合わない通知。
  fake.deliverUnknown({ position: { x: 12, y: 34 } });
  // 落とされた側を 1 件混ぜる。届く側を壊しても、落とす側を壊しても落ちる。
  fake.dropFiles([Path]);

  expect(received).toStrictEqual([[Path]]);
});

test("購読を張れなければ失敗が返る", async () => {
  const fake = createFileDropFake();
  fake.denySubscribe();

  const subscribed = await fake.drop.subscribeDropped(() => {});

  expect(Result.isOk(subscribed)).toBe(false);
});

test("ファイル名の要素を持たないパスは、その 1 件だけ配られない", async () => {
  const fake = createFileDropFake();
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
  const fake = createFileDropFake();
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
  const fake = createFileDropFake();
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

test("Tauri 自身が配るドロップの通知では配られない", async () => {
  // 開いてよいものとして記録される前に届く通知なので、聞いていれば落ちる。
  const tauriDragDrop = createSingleEventIpcFake("tauri://drag-drop");
  const drop = createFileDrop(tauriDragDrop.ipc);
  const received: (readonly string[])[] = [];
  await drop.subscribeDropped((paths) => {
    received.push(paths);
  });

  tauriDragDrop.deliver({ paths: [Path], position: { x: 0, y: 0 } });

  expect(received).toStrictEqual([]);
});
