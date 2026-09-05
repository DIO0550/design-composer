import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useClearSelectionShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「選択解除に割り当てるキーはどれか」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function ClearSelectionShortcutHarness({
  onClearSelection,
}: Readonly<{ onClearSelection: () => void }>) {
  useClearSelectionShortcut(onClearSelection);

  return <p>選択の対象</p>;
}

test("Esc キーを押すと選択解除が伝わる", async () => {
  const user = userEvent.setup();
  const cleared: string[] = [];
  render(
    <ClearSelectionShortcutHarness
      onClearSelection={() => cleared.push("解除")}
    />,
  );

  await user.keyboard("{Escape}");

  expect(cleared).toEqual(["解除"]);
});

test("修飾キーを押しながらの Esc では伝わらない", async () => {
  const user = userEvent.setup();
  const cleared: string[] = [];
  render(
    <ClearSelectionShortcutHarness
      onClearSelection={() => cleared.push("解除")}
    />,
  );

  await user.keyboard("{Control>}{Escape}{/Control}");

  expect(cleared).toEqual([]);
});
