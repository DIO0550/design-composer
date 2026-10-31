import { expect, expectTypeOf, test } from "vitest";
import { filePath } from "@/domains/__tests__/file-paths";
import type { TauriIpc } from "@/libs/tauri-ipc";
import { createSingleEventIpcFake } from "@/libs/tauri-ipc/fake";
import { Result } from "@/utils/Result";
import { createDocumentIpcFake } from "../fake";
import {
  createDocumentIpc,
  type DocumentChanged,
  type DocumentIpc,
} from "../index";

const Path = filePath("/work/login.dcmp");
const MissingPath = filePath("/work/missing.dcmp");

/** コマンドの結果だけを差し替えた IPC。イベントは流れない。 */
function setupIpc(invoke: TauriIpc["invoke"]): DocumentIpc {
  return createDocumentIpc({
    invoke,
    listen: () => Promise.resolve(() => {}),
  });
}

test("存在しないファイルを読み込むと notFound が返る", async () => {
  const fake = createDocumentIpcFake();

  const loaded = await fake.ipc.load(MissingPath);

  expect(loaded).toStrictEqual(
    Result.err({
      kind: "notFound",
      message: `${MissingPath}: ファイルが存在しない`,
    }),
  );
});

test("存在しないファイルの監視を始めると notFound が返る", async () => {
  const fake = createDocumentIpcFake();

  const watched = await fake.ipc.watch(MissingPath);

  expect(watched).toStrictEqual(
    Result.err({
      kind: "notFound",
      message: `${MissingPath}: ファイルが存在しない`,
    }),
  );
});

test("Tauri 自身がコマンドを拒むと ipcFailed が返る", async () => {
  const ipc = setupIpc(() => Promise.reject("Command load_document not found"));

  const loaded = await ipc.load(Path);

  expect(loaded).toStrictEqual(
    Result.err({
      kind: "ipcFailed",
      message: "Command load_document not found",
    }),
  );
});

test("読み込みが文字列以外を返すと ipcFailed が返る", async () => {
  const ipc = setupIpc(() => Promise.resolve(42));

  const loaded = await ipc.load(Path);

  expect(loaded).toStrictEqual(
    Result.err({
      kind: "ipcFailed",
      message: "load_document が文字列以外を返した: 42",
    }),
  );
});

test("綴りを寄せるのを拒まれると invalidPath が返る", async () => {
  const fake = createDocumentIpcFake();
  fake.denyCanonicalize({ path: Path, kind: "invalidPath" });

  const canonical = await fake.ipc.canonicalize(Path);

  expect(canonical).toStrictEqual(
    Result.err({
      kind: "invalidPath",
      message: `${Path}: ドキュメントのパスとして扱えない`,
    }),
  );
});

test("綴りを寄せた結果が文字列以外だと ipcFailed が返る", async () => {
  const ipc = setupIpc(() => Promise.resolve(42));

  const canonical = await ipc.canonicalize(Path);

  expect(canonical).toStrictEqual(
    Result.err({
      kind: "ipcFailed",
      message: "canonicalize_document_path が文字列以外を返した: 42",
    }),
  );
});

test("綴りを寄せた結果がファイル名の要素を持たないと ipcFailed が返る", async () => {
  const ipc = setupIpc(() => Promise.resolve("/"));

  const canonical = await ipc.canonicalize(Path);

  expect(canonical).toStrictEqual(
    Result.err({
      kind: "ipcFailed",
      message:
        "canonicalize_document_path がファイル名の要素を持たない綴りを返した: /",
    }),
  );
});

test("購読の開始に失敗すると Err が返り、例外は投げない", async () => {
  const ipc = createDocumentIpc({
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
    { path: Path },
    { content: "{}" },
  ];
  const received: DocumentChanged[] = [];
  const ipc = createDocumentIpc({
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

test("ファイル名の要素を持たないパスの変更通知は配られない", async () => {
  const events = createSingleEventIpcFake("document-changed");
  const ipc = createDocumentIpc(events.ipc);
  const received: DocumentChanged[] = [];
  Result.unwrap(
    await ipc.subscribeChanged((changed) => received.push(changed)),
  );

  events.deliver({ path: "/", content: "{}" });
  events.deliver({ path: Path, content: "{}" });

  expect(received).toStrictEqual([{ path: Path, content: "{}" }]);
});

test("保存先と中身を取り違えて渡すことはできない", () => {
  const ipc = createDocumentIpcFake().ipc;

  // 呼ばずに型だけを見る。
  const swapped = () =>
    // @ts-expect-error 中身の文字列はファイルのパスとして渡せない
    ipc.save("{}", Path);

  expectTypeOf(swapped).toBeFunction();
});
