import { expect, test } from "vitest";
import type { TauriIpc } from "@/libs/tauri-ipc";
import { Result } from "@/utils/Result";
import { DocumentIpcFake } from "../fake";
import { type DocumentChanged, DocumentIpc } from "../index";

const PATH = "/work/login.dcmp";
const MISSING_PATH = "/work/missing.dcmp";

/** コマンドの結果だけを差し替えた IPC。イベントは流れない。 */
function setupIpc(invoke: TauriIpc["invoke"]): DocumentIpc {
  return DocumentIpc.create({
    invoke,
    listen: () => Promise.resolve(() => {}),
  });
}

test("存在しないファイルを読み込むと notFound が返る", async () => {
  const fake = DocumentIpcFake.create();

  const loaded = await fake.ipc.load(MISSING_PATH);

  expect(loaded).toStrictEqual(
    Result.err({
      kind: "notFound",
      message: `${MISSING_PATH}: ファイルが存在しない`,
    }),
  );
});

test("存在しないファイルの監視を始めると notFound が返る", async () => {
  const fake = DocumentIpcFake.create();

  const watched = await fake.ipc.watch(MISSING_PATH);

  expect(watched).toStrictEqual(
    Result.err({
      kind: "notFound",
      message: `${MISSING_PATH}: ファイルが存在しない`,
    }),
  );
});

test("Tauri 自身がコマンドを拒むと ipcFailed が返る", async () => {
  const ipc = setupIpc(() => Promise.reject("Command load_document not found"));

  const loaded = await ipc.load(PATH);

  expect(loaded).toStrictEqual(
    Result.err({
      kind: "ipcFailed",
      message: "Command load_document not found",
    }),
  );
});

test("読み込みが文字列以外を返すと ipcFailed が返る", async () => {
  const ipc = setupIpc(() => Promise.resolve(42));

  const loaded = await ipc.load(PATH);

  expect(loaded).toStrictEqual(
    Result.err({
      kind: "ipcFailed",
      message: "load_document が文字列以外を返した: 42",
    }),
  );
});

test("購読の開始に失敗すると Err が返り、例外は投げない", async () => {
  const ipc = DocumentIpc.create({
    invoke: () => Promise.resolve(undefined),
    listen: () => Promise.reject("Event document-changed not registered"),
  });

  const subscribed = await ipc.subscribeChanged(() => {});

  expect(subscribed).toStrictEqual(
    Result.err({
      kind: "ipcFailed",
      message: "Event document-changed not registered",
    }),
  );
});

test("path と content が揃っていない通知は配られない", async () => {
  const malformedPayloads = [
    null,
    "changed",
    { path: PATH },
    { content: "{}" },
  ];
  const received: DocumentChanged[] = [];
  const ipc = DocumentIpc.create({
    invoke: () => Promise.resolve(undefined),
    listen: (_event, handler) => {
      for (const payload of malformedPayloads) {
        handler(payload);
      }
      return Promise.resolve(() => {});
    },
  });

  Result.unwrap(
    await ipc.subscribeChanged((changed) => received.push(changed)),
  );

  expect(received).toStrictEqual([]);
});
