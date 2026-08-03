import { afterEach, expect, test, vi } from "vitest";
import { DocumentIpc, type DocumentIpcError } from "@/libs/document-ipc";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import type { TauriIpc } from "@/libs/tauri-ipc";
import { Option } from "@/utils/Option";
import { AUTO_SAVE_DEBOUNCE_MS } from "../index";
import { artboardDocument, PATH, renderAutoSave, waitDebounce } from "./setup";

const DENIED: DocumentIpcError = {
  kind: "permissionDenied",
  message: `${PATH}: 書き込みが許可されていない`,
};

afterEach(() => {
  vi.useRealTimers();
});

/** 書き込みが必ず失敗する Rust 側の代役。 */
function denyingIpc(): DocumentIpc {
  const tauriIpc: TauriIpc = {
    invoke: () => Promise.reject(DENIED),
    listen: () => Promise.reject("Event not emitted"),
  };
  return DocumentIpc.create(tauriIpc);
}

test("開いたドキュメントを編集していなければファイルへ書き出さない", async () => {
  vi.useFakeTimers();
  const openedFileContent = `{ "外部が書いた体裁": true }`;
  const fake = DocumentIpcFake.create({ [PATH]: openedFileContent });

  renderAutoSave({ ipc: fake.ipc, document: artboardDocument("home") });
  await waitDebounce();

  expect(fake.contentOf(PATH)).toStrictEqual(Option.some(openedFileContent));
});

test("デバウンス時間が経つ前は編集内容がファイルへ書き出されない", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const fake = DocumentIpcFake.create({
    [PATH]: DocumentJson.serialize(opened),
  });
  const { rerender } = renderAutoSave({ ipc: fake.ipc, document: opened });

  rerender({ ipc: fake.ipc, document: artboardDocument("settings") });
  await waitDebounce(AUTO_SAVE_DEBOUNCE_MS - 1);

  expect(fake.contentOf(PATH)).toStrictEqual(
    Option.some(DocumentJson.serialize(opened)),
  );
});

test("書き出される前に画面を閉じると、その編集はファイルへ書き出されない", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const fake = DocumentIpcFake.create({
    [PATH]: DocumentJson.serialize(opened),
  });
  const { rerender, unmount } = renderAutoSave({
    ipc: fake.ipc,
    document: opened,
  });

  rerender({ ipc: fake.ipc, document: artboardDocument("settings") });
  unmount();
  await waitDebounce();

  expect(fake.contentOf(PATH)).toStrictEqual(
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

  expect(result.current).toStrictEqual(Option.some(DENIED));
});

test("失敗した後の書き込みが成功すると、失敗は返らなくなる", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const denying = denyingIpc();
  const fake = DocumentIpcFake.create({
    [PATH]: DocumentJson.serialize(opened),
  });
  const { result, rerender } = renderAutoSave({
    ipc: denying,
    document: opened,
  });

  rerender({ ipc: denying, document: artboardDocument("settings") });
  await waitDebounce();
  rerender({ ipc: fake.ipc, document: artboardDocument("profile") });
  await waitDebounce();

  expect(result.current).toStrictEqual(Option.none);
});
