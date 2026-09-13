import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useUngroupShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「グループ解除に割り当てる組み合わせはどれか」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function UngroupShortcutHarness({
  onUngroup,
}: Readonly<{ onUngroup: () => void }>) {
  useUngroupShortcut(onUngroup);

  return <p>グループ解除の対象</p>;
}

test("Ctrl+Shift+G を押すとグループ解除が伝わる", async () => {
  const user = userEvent.setup();
  const ungrouped: string[] = [];
  render(<UngroupShortcutHarness onUngroup={() => ungrouped.push("外す")} />);

  await user.keyboard("{Control>}{Shift>}g{/Shift}{/Control}");

  expect(ungrouped).toEqual(["外す"]);
});

test("Cmd+Shift+G でもグループ解除が伝わる", async () => {
  const user = userEvent.setup();
  const ungrouped: string[] = [];
  render(<UngroupShortcutHarness onUngroup={() => ungrouped.push("外す")} />);

  await user.keyboard("{Meta>}{Shift>}g{/Shift}{/Meta}");

  expect(ungrouped).toEqual(["外す"]);
});

test("Shift を伴わない Ctrl+G ではグループ解除は伝わらない（グループ化の割り当てのため）", async () => {
  const user = userEvent.setup();
  const ungrouped: string[] = [];
  render(<UngroupShortcutHarness onUngroup={() => ungrouped.push("外す")} />);

  await user.keyboard("{Control>}g{/Control}");

  expect(ungrouped).toEqual([]);
});

test("修飾キーなしの Shift+G ではグループ解除は伝わらない", async () => {
  const user = userEvent.setup();
  const ungrouped: string[] = [];
  render(<UngroupShortcutHarness onUngroup={() => ungrouped.push("外す")} />);

  await user.keyboard("{Shift>}g{/Shift}");

  expect(ungrouped).toEqual([]);
});
