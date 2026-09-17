import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { dragRowNamed } from "@/components/__tests__/row-drag";
import { rowNames } from "@/components/__tests__/row-names";
import { artboardContent } from "@/domains/__tests__/sample-document";
import { SampleDocument } from "@/features/editor/__tests__/sample-document";
import { DialogChoice } from "@/libs/document-dialog/fake";
import { DocumentJson } from "@/libs/document-json";
import {
  OtherPath,
  Path,
  renderEditorScreen,
  selectTab,
  startOpen,
  tree,
} from "./setup";

/**
 * 2 つ開き、1 つ目で行を入れ替えてから 2 つ目へ移る。
 *
 * @returns 入れ替えた後の並び。戻ったときに比べる相手
 */
async function editFirstThenLeave(): Promise<readonly string[]> {
  const observer = renderEditorScreen(
    {
      [Path]: DocumentJson.serialize(SampleDocument),
      [OtherPath]: artboardContent("settings"),
    },
    { open: DialogChoice.chosen(Path), save: DialogChoice.Canceled },
  );
  await startOpen(observer);
  dragRowNamed(tree(), { from: "home-title", to: "home-login" });
  const edited = rowNames(tree());

  await observer.dropFiles([OtherPath]);

  return edited;
}

/*
 * ショートカットは `document` に張るので、見えているかは関係なく全部の節が受け取る。
 * 背面の節で止めていないと、1 回の押下が開いている数だけ実行される。
 */
test("背面のタブは、見ているタブで押した取り消しを受け取らない", async () => {
  const edited = await editFirstThenLeave();

  await userEvent.keyboard("{Meta>}z{/Meta}");
  await selectTab(Path);

  expect(rowNames(tree())).toEqual(edited);
});

test("見ているタブでは、取り消しがそのタブに効く", async () => {
  const edited = await editFirstThenLeave();
  await selectTab(Path);

  await userEvent.keyboard("{Meta>}z{/Meta}");

  await waitFor(() => {
    expect(rowNames(tree())).not.toEqual(edited);
  });
});
