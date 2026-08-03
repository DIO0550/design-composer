import { act, render } from "@testing-library/react";
import { SAMPLE_DOCUMENT } from "@/features/editor/__tests__/sample-document";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import { OpenedDocumentEditor } from "../index";

/** 開いているファイル。テストの中で開いているファイルは常に 1 つ。 */
export const PATH = "/work/sample.dcmp";

/**
 * サンプルのドキュメントを開いた編集画面を描画する。
 *
 * 監視と購読は非同期に成立するので、操作を始める前にここで待ち合わせる
 * （待たずに操作すると、成立したときの状態更新が act の外で起きる）。
 */
export async function renderOpenedDocument(): Promise<void> {
  const fake = DocumentIpcFake.create({
    [PATH]: DocumentJson.serialize(SAMPLE_DOCUMENT),
  });

  render(
    <OpenedDocumentEditor
      ipc={fake.ipc}
      opened={{ path: PATH, document: SAMPLE_DOCUMENT }}
    />,
  );
  await act(async () => {});
}
