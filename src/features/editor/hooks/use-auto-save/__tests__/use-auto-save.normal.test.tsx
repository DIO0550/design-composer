import { afterEach, expect, test, vi } from "vitest";
import { artboardDocument } from "@/features/editor/__tests__/sample-document";
import { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import { Option } from "@/utils/Option";
import { AutoSaveDebounceMs } from "../index";
import { Path, renderAutoSave, waitDebounce } from "./setup";

afterEach(() => {
  vi.useRealTimers();
});

test("編集するとデバウンス時間の経過後にその内容がファイルへ書き出される", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const edited = artboardDocument("settings");
  const fake = DocumentIpcFake.create({
    [Path]: DocumentJson.serialize(opened),
  });
  const { rerender } = renderAutoSave({ ipc: fake.ipc, document: opened });

  rerender({ ipc: fake.ipc, document: edited });
  await waitDebounce();

  expect(fake.contentOf(Path)).toStrictEqual(
    Option.some(DocumentJson.serialize(edited)),
  );
});

test("編集が続いている間は書き出されず、止まってから最後の内容だけが書き出される", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const last = artboardDocument("profile");
  const fake = DocumentIpcFake.create({
    [Path]: DocumentJson.serialize(opened),
  });
  const { rerender } = renderAutoSave({ ipc: fake.ipc, document: opened });

  rerender({ ipc: fake.ipc, document: artboardDocument("settings") });
  await waitDebounce(AutoSaveDebounceMs - 1);
  rerender({ ipc: fake.ipc, document: last });
  await waitDebounce(AutoSaveDebounceMs - 1);
  const beforeLastEditSettles = fake.contentOf(Path);
  await waitDebounce(1);

  expect(beforeLastEditSettles).toStrictEqual(
    Option.some(DocumentJson.serialize(opened)),
  );
  expect(fake.contentOf(Path)).toStrictEqual(
    Option.some(DocumentJson.serialize(last)),
  );
});

test("編集してから書き出されるまでの間は保存中になる", async () => {
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

  expect(result.current).toStrictEqual(DocumentSaveState.Saving);
});

test("書き出しが終わると保存済みに戻る", async () => {
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
  await waitDebounce();

  expect(result.current).toStrictEqual(DocumentSaveState.Saved);
});

test("編集を取り消して元のドキュメントへ戻すと、その内容が書き出される", async () => {
  vi.useFakeTimers();
  const opened = artboardDocument("home");
  const fake = DocumentIpcFake.create({
    [Path]: DocumentJson.serialize(opened),
  });
  const { rerender } = renderAutoSave({ ipc: fake.ipc, document: opened });

  rerender({ ipc: fake.ipc, document: artboardDocument("settings") });
  await waitDebounce();
  rerender({ ipc: fake.ipc, document: opened });
  await waitDebounce();

  expect(fake.contentOf(Path)).toStrictEqual(
    Option.some(DocumentJson.serialize(opened)),
  );
});
