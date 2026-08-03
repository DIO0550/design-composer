import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { Artboard } from "@/domains/artboard";
import { DesignDocument } from "@/domains/design-document";
import type { DocumentIpc } from "@/libs/document-ipc";
import { AUTO_SAVE_DEBOUNCE_MS, useAutoSave } from "../index";

/** 自動保存の書き出し先。テストの中で開いているファイルは常に 1 つ。 */
export const PATH = "/work/login.dcmp";

/** artboard を 1 枚だけ持つドキュメント。名前の違いが編集の違いになる。 */
export function artboardDocument(name: string): DesignDocument {
  return DesignDocument.create({
    artboards: [Artboard.create({ name, width: 360, height: 240 })],
  });
}

export function renderAutoSave(initialProps: {
  ipc: DocumentIpc;
  document: DesignDocument;
}) {
  return renderHook(
    ({ ipc, document }) => useAutoSave({ ipc, path: PATH, document }),
    { initialProps },
  );
}

/** デバウンスの待ち時間を進め、その間に始まった書き込みの完了まで待つ。 */
export async function waitDebounce(
  elapsedMs: number = AUTO_SAVE_DEBOUNCE_MS,
): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(elapsedMs);
  });
}
