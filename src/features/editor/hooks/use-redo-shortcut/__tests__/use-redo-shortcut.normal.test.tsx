import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useRedoShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「redo に割り当てる組み合わせはどれか」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function RedoShortcutHarness({ onRedo }: Readonly<{ onRedo: () => void }>) {
  useRedoShortcut(onRedo);

  return <p>編集の対象</p>;
}

test("Ctrl+Shift+Z を押すと redo が伝わる", async () => {
  const user = userEvent.setup();
  const redone: string[] = [];
  render(<RedoShortcutHarness onRedo={() => redone.push("やり直す")} />);

  await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");

  expect(redone).toEqual(["やり直す"]);
});

test("Cmd+Shift+Z でも redo が伝わる", async () => {
  const user = userEvent.setup();
  const redone: string[] = [];
  render(<RedoShortcutHarness onRedo={() => redone.push("やり直す")} />);

  await user.keyboard("{Meta>}{Shift>}z{/Shift}{/Meta}");

  expect(redone).toEqual(["やり直す"]);
});

test("Shift を伴わない Ctrl+Z では redo は伝わらない（undo の割り当てのため）", async () => {
  const user = userEvent.setup();
  const redone: string[] = [];
  render(<RedoShortcutHarness onRedo={() => redone.push("やり直す")} />);

  await user.keyboard("{Control>}z{/Control}");

  expect(redone).toEqual([]);
});

test("修飾キーなしの Shift+Z では redo は伝わらない", async () => {
  const user = userEvent.setup();
  const redone: string[] = [];
  render(<RedoShortcutHarness onRedo={() => redone.push("やり直す")} />);

  await user.keyboard("{Shift>}z{/Shift}");

  expect(redone).toEqual([]);
});
