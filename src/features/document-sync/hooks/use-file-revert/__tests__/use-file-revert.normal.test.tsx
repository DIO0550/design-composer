import { act, renderHook } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  artboardContent,
  artboardDocument,
} from "@/domains/__tests__/sample-document";
import { DocumentAccessFailureReasons } from "@/domains/session/document-access-failure";
import { DocumentSaveState } from "@/domains/session/document-save-state";
import { DocumentIpcFake } from "@/libs/document-ipc/fake";
import { DocumentJson } from "@/libs/document-json";
import { Option } from "@/utils/Option";
import { useFileRevert } from "../index";

/** 書き戻す先。テストの中で開いているファイルは常に 1 つ。 */
const Path = "/work/login.dcmp";

/**
 * 書き戻しを張る。
 *
 * 表示中のドキュメントをファイルの中身と別のものにしておくのは、書き戻しが
 * 「表示中の内容でファイルを潰す」操作で、同じ内容だと潰せたかどうかが見えないため。
 *
 * @param fake 書き込み先の代役
 * @returns 書き戻しの操作と保存状態、および書き戻せたと伝わった回数
 */
function renderFileRevert(fake: DocumentIpcFake) {
  const notice = { revertedCount: 0 };
  const { result } = renderHook(() =>
    useFileRevert({
      ipc: fake.ipc,
      path: Path,
      document: artboardDocument("settings"),
      onReverted: () => {
        notice.revertedCount += 1;
      },
    }),
  );

  return { control: () => result.current, notice };
}

test("書き戻すと、表示中の内容でファイルが上書きされる", async () => {
  const fake = DocumentIpcFake.create({ [Path]: artboardContent("home") });
  const { control } = renderFileRevert(fake);

  await act(async () => {
    control().revert();
  });

  expect(fake.contentOf(Path)).toStrictEqual(
    Option.some(DocumentJson.serialize(artboardDocument("settings"))),
  );
});

test("書き込みが終わるまでは、書き出しの最中として読める", async () => {
  const fake = DocumentIpcFake.create({ [Path]: artboardContent("home") });
  const release = fake.holdWrites(Path);
  const { control } = renderFileRevert(fake);

  await act(async () => {
    control().revert();
  });
  const whileWriting = control().saveState;
  await act(async () => {
    release();
  });

  expect(whileWriting).toStrictEqual(DocumentSaveState.Saving);
});

test("書き込みが終わると書き出し済みに戻る", async () => {
  const fake = DocumentIpcFake.create({ [Path]: artboardContent("home") });
  /*
   * 書き込みを止めてから始める。止めずに始めると保存状態が初期値の `Saved` から
   * 動かないまま終わり、書き戻しが何もしなくてもこの assert が通る
   * （rules/testing.md「既定値と違う答えになる入力を選ぶ」）。
   */
  const release = fake.holdWrites(Path);
  const { control } = renderFileRevert(fake);

  await act(async () => {
    control().revert();
  });
  await act(async () => {
    release();
  });

  expect(control().saveState).toStrictEqual(DocumentSaveState.Saved);
});

test("書き込みが終わると、書き戻せたことが呼び出し側へ伝わる", async () => {
  const fake = DocumentIpcFake.create({ [Path]: artboardContent("home") });
  const { control, notice } = renderFileRevert(fake);

  await act(async () => {
    control().revert();
  });

  expect(notice.revertedCount).toBe(1);
});

test("書き込みが拒まれると、拒まれた理由が保存状態に残る", async () => {
  const fake = DocumentIpcFake.create({ [Path]: artboardContent("home") });
  fake.denyWrites(Path);
  const { control } = renderFileRevert(fake);

  await act(async () => {
    control().revert();
  });

  // 拒まれた理由が IPC の語彙（`permissionDenied`）ではなくドメインの語彙で残ることまで
  // 見る。ここを緩めると、境界での詰め替えを飛ばしても通ってしまう。
  expect(
    Option.map(
      DocumentSaveState.failure(control().saveState),
      (failure) => failure.reason,
    ),
  ).toStrictEqual(Option.some(DocumentAccessFailureReasons.NotPermitted));
});

test("書き込みが拒まれたときは、書き戻せたことを伝えない", async () => {
  const fake = DocumentIpcFake.create({ [Path]: artboardContent("home") });
  fake.denyWrites(Path);
  const { control, notice } = renderFileRevert(fake);

  await act(async () => {
    control().revert();
  });

  expect(notice.revertedCount).toBe(0);
});
