import { afterEach, expect, test, vi } from "vitest";
import { artboardDocument } from "@/domains/__tests__/sample-document";
import { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import { DocumentIpc, type DocumentIpcError } from "@/libs/document-ipc";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import type { TauriIpc } from "@/libs/tauri-ipc";
import { Option } from "@/utils/Option";
import { AutoSaveDebounceMs } from "../index";
import { Path, renderAutoSave, waitDebounce } from "./setup";

const Denied: DocumentIpcError = {
  kind: "permissionDenied",
  message: `${Path}: 書き込みが許可されていない`,
};

afterEach(() => {
  vi.useRealTimers();
});

/** 書き込みが必ず失敗する Rust 側の代役。 */
function denyingIpc(): DocumentIpc {
  const tauriIpc: TauriIpc = {
    invoke: () => Promise.reject(Denied),
    listen: () => Promise.reject("Event not emitted"),
  };
  return DocumentIpc.create(tauriIpc);
}

test("開いたドキュメントを編集していなければファイルへ書き出さない", async () => {
  vi.useFakeTimers();
  const openedFileContent = `{ "外部が書いた体裁": true }`;
  const fake = DocumentIpcFake.create({ [Path]: openedFileContent });

  renderAutoSave({ ipc: fake.ipc, document: artboardDocument("home") });
  await waitDebounce();

  expect(fake.contentOf(Path)).toStrictEqual(Option.some(openedFileContent));
});

test("デバウンス時間が経つ前は編集内容がファイルへ書き出されない", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const fake = DocumentIpcFake.create({
    [Path]: DocumentJson.serialize(opened),
  });
  const { rerender } = renderAutoSave({ ipc: fake.ipc, document: opened });

  rerender({ ipc: fake.ipc, document: artboardDocument("settings") });
  await waitDebounce(AutoSaveDebounceMs - 1);

  expect(fake.contentOf(Path)).toStrictEqual(
    Option.some(DocumentJson.serialize(opened)),
  );
});

test("書き出される前に画面を閉じると、その編集はファイルへ書き出されない", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const fake = DocumentIpcFake.create({
    [Path]: DocumentJson.serialize(opened),
  });
  const { rerender, unmount } = renderAutoSave({
    ipc: fake.ipc,
    document: opened,
  });

  rerender({ ipc: fake.ipc, document: artboardDocument("settings") });
  unmount();
  await waitDebounce();

  expect(fake.contentOf(Path)).toStrictEqual(
    Option.some(DocumentJson.serialize(opened)),
  );
});

test("書き込みに失敗すると、その失敗が返る", async () => {
  vi.useFakeTimers();
  const ipc = denyingIpc();
  const { result, rerender } = renderAutoSave({
    ipc,
    document: artboardDocument("home"),
  });

  rerender({ ipc, document: artboardDocument("settings") });
  await waitDebounce();

  expect(result.current).toStrictEqual(DocumentSaveState.fromError(Denied));
});

test("失敗した後の書き込みが成功すると、失敗は返らなくなる", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const denying = denyingIpc();
  const fake = DocumentIpcFake.create({
    [Path]: DocumentJson.serialize(opened),
  });
  const { result, rerender } = renderAutoSave({
    ipc: denying,
    document: opened,
  });

  rerender({ ipc: denying, document: artboardDocument("settings") });
  await waitDebounce();
  rerender({ ipc: fake.ipc, document: artboardDocument("profile") });
  await waitDebounce();

  expect(result.current).toStrictEqual(DocumentSaveState.Saved);
});

test("書き出される前に編集を取り消すと、保存中のまま止まらない", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const fake = DocumentIpcFake.create({
    [Path]: DocumentJson.serialize(opened),
  });
  const { result, rerender } = renderAutoSave({
    ipc: fake.ipc,
    document: opened,
  });

  rerender({ ipc: fake.ipc, document: artboardDocument("settings") });
  await waitDebounce(AutoSaveDebounceMs - 1);
  rerender({ ipc: fake.ipc, document: opened });

  expect(result.current).toStrictEqual(DocumentSaveState.Saved);
});

test("書き込みに失敗したあと編集を取り消すと、失敗が残らない", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const denying = denyingIpc();
  const { result, rerender } = renderAutoSave({
    ipc: denying,
    document: opened,
  });

  rerender({ ipc: denying, document: artboardDocument("settings") });
  await waitDebounce();
  rerender({ ipc: denying, document: opened });

  expect(result.current).toStrictEqual(DocumentSaveState.Saved);
});
