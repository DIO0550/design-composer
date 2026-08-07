import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useUndoShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「undo に割り当てる組み合わせはどれか」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function UndoShortcutHarness({ onUndo }: Readonly<{ onUndo: () => void }>) {
  useUndoShortcut(onUndo);

  return <p>編集の対象</p>;
}

test("Ctrl+Z を押すと undo が伝わる", async () => {
  const user = userEvent.setup();
  const undone: string[] = [];
  render(<UndoShortcutHarness onUndo={() => undone.push("戻す")} />);

  await user.keyboard("{Control>}z{/Control}");

  expect(undone).toEqual(["戻す"]);
});

test("Cmd+Z でも undo が伝わる", async () => {
  const user = userEvent.setup();
  const undone: string[] = [];
  render(<UndoShortcutHarness onUndo={() => undone.push("戻す")} />);

  await user.keyboard("{Meta>}z{/Meta}");

  expect(undone).toEqual(["戻す"]);
});

test("修飾キーなしの z では undo は伝わらない", async () => {
  const user = userEvent.setup();
  const undone: string[] = [];
  render(<UndoShortcutHarness onUndo={() => undone.push("戻す")} />);

  await user.keyboard("z");

  expect(undone).toEqual([]);
});

test("Shift を伴う Ctrl+Shift+Z では undo は伝わらない（redo の割り当てのため）", async () => {
  const user = userEvent.setup();
  const undone: string[] = [];
  render(<UndoShortcutHarness onUndo={() => undone.push("戻す")} />);

  await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");

  expect(undone).toEqual([]);
});
