import { expect, test } from "vitest";
import { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import type { DocumentIpcError } from "@/libs/document-ipc";
import { Option } from "@/utils/Option";

const DENIED: DocumentIpcError = {
  kind: "permissionDenied",
  message: "/work/login.dcmp: 書き込みが許可されていない",
};

test("書き込みに失敗した状態からは、拒まれた理由を取り出せる", () => {
  const state = DocumentSaveState.fromError(DENIED);

  expect(DocumentSaveState.failure(state)).toStrictEqual(Option.some(DENIED));
});

test("書き出しが終わった状態からは失敗を取り出せない", () => {
  expect(DocumentSaveState.failure(DocumentSaveState.SAVED)).toStrictEqual(
    Option.none,
  );
});

test("書き出しを待っている状態からは失敗を取り出せない", () => {
  expect(DocumentSaveState.failure(DocumentSaveState.SAVING)).toStrictEqual(
    Option.none,
  );
});

test("書き出し中は、書き出しの最中として読める", () => {
  expect(DocumentSaveState.isSaving(DocumentSaveState.SAVING)).toBe(true);
});

test("書き出し済みは、書き出しの最中ではない", () => {
  expect(DocumentSaveState.isSaving(DocumentSaveState.SAVED)).toBe(false);
});

test("書き込みが拒まれている間も、書き出しの最中ではない", () => {
  expect(DocumentSaveState.isSaving(DocumentSaveState.fromError(DENIED))).toBe(
    false,
  );
});
