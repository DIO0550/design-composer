import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useDeleteShortcut } from "../index";

/**
 * ショートカットを張っただけの器。押された回数と、文字を打ち込める場所を持つ。
 * 入力欄を同じ器に置くのは、フォーカスの位置で扱いが変わることを見るため。
 */
function DeleteShortcutHarness({
  onDelete,
}: Readonly<{ onDelete: () => void }>) {
  useDeleteShortcut(onDelete);

  return (
    <>
      <button type="button">選択の対象ではないボタン</button>
      <input aria-label="文言" defaultValue="あ" />
    </>
  );
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

test("削除以外のキーでは何も起きない", async () => {
  const user = userEvent.setup();
  const deleted: string[] = [];
  render(<DeleteShortcutHarness onDelete={() => deleted.push("削除")} />);

  await user.keyboard("a");

  expect(deleted).toEqual([]);
});

test("入力欄に文字を打ち込んでいる間の Backspace は削除にならない", async () => {
  const user = userEvent.setup();
  const deleted: string[] = [];
  render(<DeleteShortcutHarness onDelete={() => deleted.push("削除")} />);

  await user.click(screen.getByRole("textbox", { name: "文言" }));
  await user.keyboard("{Backspace}");

  expect(deleted).toEqual([]);
});

test("画面から外れると削除のキーは効かなくなる", async () => {
  const user = userEvent.setup();
  const deleted: string[] = [];
  const view = render(
    <DeleteShortcutHarness onDelete={() => deleted.push("削除")} />,
  );

  view.unmount();
  await user.keyboard("{Delete}");

  expect(deleted).toEqual([]);
});
