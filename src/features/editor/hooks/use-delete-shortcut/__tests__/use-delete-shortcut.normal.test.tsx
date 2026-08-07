import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useDeleteShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「削除に割り当てるキーはどれか」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function DeleteShortcutHarness({
  onDelete,
}: Readonly<{ onDelete: () => void }>) {
  useDeleteShortcut(onDelete);

  return <p>削除の対象</p>;
}

test("Delete キーを押すと削除が伝わる", async () => {
  const user = userEvent.setup();
  const deleted: string[] = [];
  render(<DeleteShortcutHarness onDelete={() => deleted.push("削除")} />);

  await user.keyboard("{Delete}");

  expect(deleted).toEqual(["削除"]);
});

test("Backspace キーでも削除が伝わる", async () => {
  const user = userEvent.setup();
  const deleted: string[] = [];
  render(<DeleteShortcutHarness onDelete={() => deleted.push("削除")} />);

  await user.keyboard("{Backspace}");

  expect(deleted).toEqual(["削除"]);
});
