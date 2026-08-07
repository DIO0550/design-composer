import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useCopyShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「コピーに割り当てる組み合わせはどれか」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function CopyShortcutHarness({ onCopy }: Readonly<{ onCopy: () => void }>) {
  useCopyShortcut(onCopy);

  return <p>コピーの対象</p>;
}

test("Ctrl+C を押すとコピーが伝わる", async () => {
  const user = userEvent.setup();
  const copied: string[] = [];
  render(<CopyShortcutHarness onCopy={() => copied.push("コピー")} />);

  await user.keyboard("{Control>}c{/Control}");

  expect(copied).toEqual(["コピー"]);
});

test("Cmd+C でもコピーが伝わる", async () => {
  const user = userEvent.setup();
  const copied: string[] = [];
  render(<CopyShortcutHarness onCopy={() => copied.push("コピー")} />);

  await user.keyboard("{Meta>}c{/Meta}");

  expect(copied).toEqual(["コピー"]);
});

test("修飾キーなしの c ではコピーは伝わらない", async () => {
  const user = userEvent.setup();
  const copied: string[] = [];
  render(<CopyShortcutHarness onCopy={() => copied.push("コピー")} />);

  await user.keyboard("c");

  expect(copied).toEqual([]);
});
