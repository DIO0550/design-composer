import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import type { DesignDocument } from "@/domains/dcmp/design-document";
import { FileValidity } from "@/domains/session/file-validity";
import type { DocumentIpc } from "@/libs/document-ipc";
import { AutoSaveDebounceMs, useAutoSave } from "../index";

/** 自動保存の書き出し先。テストの中で開いているファイルは常に 1 つ。 */
export const Path = "/work/login.dcmp";

/**
 * 自動保存を張る。
 *
 * `fileValidity` を省略できるようにしているのは、ファイルが妥当であることが
 * 自動保存そのものを見るテストの前提で、そこに毎回書くと本題が埋もれるため。
 * 不正な間の振る舞いを見るテストだけが明示的に渡す。
 */
export function renderAutoSave(initialProps: {
  ipc: DocumentIpc;
  document: DesignDocument;
  fileValidity?: FileValidity;
}) {
  return renderHook(
    ({ ipc, document, fileValidity = FileValidity.valid }) =>
      useAutoSave({ ipc, path: Path, document, fileValidity }),
    { initialProps },
  );
}

/** デバウンスの待ち時間を進め、その間に始まった書き込みの完了まで待つ。 */
export async function waitDebounce(
  elapsedMs: number = AutoSaveDebounceMs,
): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(elapsedMs);
  });
}
