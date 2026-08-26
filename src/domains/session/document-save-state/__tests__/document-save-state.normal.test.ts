import { expect, test } from "vitest";
import { DocumentSaveState } from "@/domains/session/document-save-state";
import type { DocumentIpcError } from "@/libs/document-ipc";
import { Option } from "@/utils/Option";

const Denied: DocumentIpcError = {
  kind: "permissionDenied",
  message: "/work/login.dcmp: 書き込みが許可されていない",
};

test("書き込みに失敗した状態からは、拒まれた理由を取り出せる", () => {
  const state = DocumentSaveState.fromError(Denied);

  expect(DocumentSaveState.failure(state)).toStrictEqual(Option.some(Denied));
});

test("書き出しが終わった状態からは失敗を取り出せない", () => {
  expect(DocumentSaveState.failure(DocumentSaveState.Saved)).toStrictEqual(
    Option.none,
  );
});

test("書き出しを待っている状態からは失敗を取り出せない", () => {
  expect(DocumentSaveState.failure(DocumentSaveState.Saving)).toStrictEqual(
    Option.none,
  );
});

test("書き出し中は、書き出しの最中として読める", () => {
  expect(DocumentSaveState.isSaving(DocumentSaveState.Saving)).toBe(true);
});

test("書き出し済みは、書き出しの最中ではない", () => {
  expect(DocumentSaveState.isSaving(DocumentSaveState.Saved)).toBe(false);
});

test("書き込みが拒まれている間も、書き出しの最中ではない", () => {
  expect(DocumentSaveState.isSaving(DocumentSaveState.fromError(Denied))).toBe(
    false,
  );
});
