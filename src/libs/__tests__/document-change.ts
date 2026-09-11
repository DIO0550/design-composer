import { act } from "@testing-library/react";
import type { DocumentIpcFake } from "@/libs/document-ipc/fake";

/**
 * 外部がファイルを書き換え、通知が届くまで待つ。
 */
export async function changeFileExternally({
  fake,
  path,
  content,
}: Readonly<{
  fake: DocumentIpcFake;
  path: string;
  content: string;
}>): Promise<void> {
  await act(async () => {
    fake.changeExternally(path, content);
  });
}
