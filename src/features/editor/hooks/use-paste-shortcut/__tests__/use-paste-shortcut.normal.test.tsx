import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { usePasteShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「ペーストに割り当てる組み合わせはどれか」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function PasteShortcutHarness({ onPaste }: Readonly<{ onPaste: () => void }>) {
  usePasteShortcut(onPaste);

  return <p>貼り付け先</p>;
}

test("Ctrl+V を押すとペーストが伝わる", async () => {
  const user = userEvent.setup();
  const pasted: string[] = [];
  render(<PasteShortcutHarness onPaste={() => pasted.push("貼り付け")} />);

  await user.keyboard("{Control>}v{/Control}");

  expect(pasted).toEqual(["貼り付け"]);
});

test("Cmd+V でもペーストが伝わる", async () => {
  const user = userEvent.setup();
  const pasted: string[] = [];
  render(<PasteShortcutHarness onPaste={() => pasted.push("貼り付け")} />);

  await user.keyboard("{Meta>}v{/Meta}");

  expect(pasted).toEqual(["貼り付け"]);
});

test("修飾キーなしの v ではペーストは伝わらない", async () => {
  const user = userEvent.setup();
  const pasted: string[] = [];
  render(<PasteShortcutHarness onPaste={() => pasted.push("貼り付け")} />);

  await user.keyboard("v");

  expect(pasted).toEqual([]);
});
