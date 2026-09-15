import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useRenameShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「名前の変更に割り当てる組み合わせはどれか」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function RenameShortcutHarness({
  onRename,
}: Readonly<{ onRename: () => void }>) {
  useRenameShortcut(onRename);

  return <p>名前を変える対象</p>;
}

test("Ctrl+R を押すと名前の変更が伝わる", async () => {
  const user = userEvent.setup();
  const renamed: string[] = [];
  render(<RenameShortcutHarness onRename={() => renamed.push("名前の変更")} />);

  await user.keyboard("{Control>}r{/Control}");

  expect(renamed).toEqual(["名前の変更"]);
});

test("Cmd+R でも名前の変更が伝わる", async () => {
  const user = userEvent.setup();
  const renamed: string[] = [];
  render(<RenameShortcutHarness onRename={() => renamed.push("名前の変更")} />);

  await user.keyboard("{Meta>}r{/Meta}");

  expect(renamed).toEqual(["名前の変更"]);
});

test("修飾キーなしの r では名前の変更は伝わらない", async () => {
  const user = userEvent.setup();
  const renamed: string[] = [];
  render(<RenameShortcutHarness onRename={() => renamed.push("名前の変更")} />);

  await user.keyboard("r");

  expect(renamed).toEqual([]);
});
