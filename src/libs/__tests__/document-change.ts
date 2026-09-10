import { act } from "@testing-library/react";
import type { DocumentIpcFake } from "@/libs/document-ipc/fake";

/**
 * 外部がファイルを書き換え、通知が届くまで待つ。`act` で包むのは通知が React の外から届
 * くため。
 *
 * `src/libs/` の直下に置くのは、組み立てているのが `DocumentIpcFake`（libs の代役）で、
 * 消費側が `editor` と `document-sync` の 2 feature にまたがるため。本番モジュールでは
 * なく `__tests__/` に置くのは、`act` を要るのがテストの待ち合わせの事情だから。
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
