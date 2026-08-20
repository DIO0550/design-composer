import { act } from "@testing-library/react";
import type { DocumentIpcFake } from "@/libs/document-ipc/fake";

/**
 * 外部がファイルを書き換え、通知が届くまで待つ。
 *
 * `act` で包むのは通知が React の外から届くため。オブジェクト引数なのは
 * `path` と `content` がどちらも文字列で、位置引数だと取り違えを型で弾けないため。
 *
 * `src/libs/` に置くのは、組み立てているのが `DocumentIpcFake`（libs の代役）で、
 * 値の出どころがこの層だから。層の直下に置くのは、消費側が `editor` と `document-sync` の
 * 2 feature にまたがるうえ、`document-ipc/` の中へ入れるとモジュールフォルダの内部への
 * deep import になるため（rules/architecture.md「フォルダ外部からの import は必ず
 * `index.ts` 経由」）。
 *
 * Why: `libs/` の本番コードは React に依存しないが、ここは `act` を要る。テストの待ち
 * 合わせは React 側の事情なので、本番モジュールではなく `__tests__/` の側に置いている。
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
