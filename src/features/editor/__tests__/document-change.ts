import { act } from "@testing-library/react";
import type { DocumentIpcFake } from "@/libs/document-ipc/fake";

/**
 * 外部がファイルを書き換え、通知が届くまで待つ。
 *
 * `act` で包むのは通知が React の外から届くため。オブジェクト引数なのは
 * `path` と `content` がどちらも文字列で、位置引数だと取り違えを型で弾けないため。
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
