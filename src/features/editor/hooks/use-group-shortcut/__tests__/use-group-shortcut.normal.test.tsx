import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useGroupShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「グループ化に割り当てる組み合わせはどれか」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function GroupShortcutHarness({ onGroup }: Readonly<{ onGroup: () => void }>) {
  useGroupShortcut(onGroup);

  return <p>グループ化の対象</p>;
}

test("Ctrl+G を押すとグループ化が伝わる", async () => {
  const user = userEvent.setup();
  const grouped: string[] = [];
  render(<GroupShortcutHarness onGroup={() => grouped.push("包む")} />);

  await user.keyboard("{Control>}g{/Control}");

  expect(grouped).toEqual(["包む"]);
});

test("Cmd+G でもグループ化が伝わる", async () => {
  const user = userEvent.setup();
  const grouped: string[] = [];
  render(<GroupShortcutHarness onGroup={() => grouped.push("包む")} />);

  await user.keyboard("{Meta>}g{/Meta}");

  expect(grouped).toEqual(["包む"]);
});

test("Shift を伴う Ctrl+Shift+G ではグループ化は伝わらない（グループ解除の割り当てのため）", async () => {
  const user = userEvent.setup();
  const grouped: string[] = [];
  render(<GroupShortcutHarness onGroup={() => grouped.push("包む")} />);

  await user.keyboard("{Control>}{Shift>}g{/Shift}{/Control}");

  expect(grouped).toEqual([]);
});

test("修飾キーなしの g ではグループ化は伝わらない", async () => {
  const user = userEvent.setup();
  const grouped: string[] = [];
  render(<GroupShortcutHarness onGroup={() => grouped.push("包む")} />);

  await user.keyboard("g");

  expect(grouped).toEqual([]);
});
