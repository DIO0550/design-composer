import { act } from "@testing-library/react";
import type { DocumentIpcFake } from "@/libs/document-ipc/fake";

/**
 * 外部（AI・エディタ・git 操作等）がファイルを書き換え、通知が届くまで待つ。
 *
 * `act` で包むのは、監視の通知が React の外から届くため。包まないと届いたときの
 * 状態更新が act の外で起きる。
 *
 * 引数をオブジェクトで受けるのは、`path` と `content` がどちらも文字列で、
 * 位置引数だと取り違えても型エラーにならないため（rules/coding.md）。
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
