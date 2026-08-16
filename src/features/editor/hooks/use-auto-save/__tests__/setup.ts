import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import type { DesignDocument } from "@/domains/design-document";
import type { DocumentIpc } from "@/libs/document-ipc";
import { AutoSaveDebounceMs, useAutoSave } from "../index";

/** 自動保存の書き出し先。テストの中で開いているファイルは常に 1 つ。 */
export const Path = "/work/login.dcmp";

export function renderAutoSave(initialProps: {
  ipc: DocumentIpc;
  document: DesignDocument;
}) {
  return renderHook(
    ({ ipc, document }) => useAutoSave({ ipc, path: Path, document }),
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
