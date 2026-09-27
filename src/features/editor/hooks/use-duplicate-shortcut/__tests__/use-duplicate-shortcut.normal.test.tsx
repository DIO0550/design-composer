import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useDuplicateShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「複製に割り当てる組み合わせはどれか」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function DuplicateShortcutHarness({
  onDuplicate,
}: Readonly<{ onDuplicate: () => void }>) {
  useDuplicateShortcut(onDuplicate);

  return <p>複製の対象</p>;
}

test("Ctrl+D を押すと複製が伝わる", async () => {
  const user = userEvent.setup();
  const duplicated: string[] = [];
  render(
    <DuplicateShortcutHarness onDuplicate={() => duplicated.push("複製")} />,
  );

  await user.keyboard("{Control>}d{/Control}");

  expect(duplicated).toEqual(["複製"]);
});

test("Cmd+D でも複製が伝わる", async () => {
  const user = userEvent.setup();
  const duplicated: string[] = [];
  render(
    <DuplicateShortcutHarness onDuplicate={() => duplicated.push("複製")} />,
  );

  await user.keyboard("{Meta>}d{/Meta}");

  expect(duplicated).toEqual(["複製"]);
});

test("修飾キーなしの d では複製は伝わらない", async () => {
  const user = userEvent.setup();
  const duplicated: string[] = [];
  render(
    <DuplicateShortcutHarness onDuplicate={() => duplicated.push("複製")} />,
  );

  await user.keyboard("d");

  expect(duplicated).toEqual([]);
});
