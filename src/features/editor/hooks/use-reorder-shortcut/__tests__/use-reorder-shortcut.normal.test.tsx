import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  type ReorderStep,
  ReorderSteps,
} from "@/features/editor/domains/reorder-step";
import { useReorderShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「どのキーがどちらの向きか」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function ReorderShortcutHarness({
  onReorder,
}: Readonly<{ onReorder: (step: ReorderStep) => void }>) {
  useReorderShortcut(onReorder);

  return <p>並べ替えの対象</p>;
}

test("⌘] を押すと前面への並べ替えが伝わる", async () => {
  const user = userEvent.setup();
  const steps: ReorderStep[] = [];
  render(<ReorderShortcutHarness onReorder={(step) => steps.push(step)} />);

  await user.keyboard("{Meta>}]{/Meta}");

  expect(steps).toEqual([ReorderSteps.TowardFront]);
});

test("⌘[ を押すと背面への並べ替えが伝わる", async () => {
  const user = userEvent.setup();
  const steps: ReorderStep[] = [];
  render(<ReorderShortcutHarness onReorder={(step) => steps.push(step)} />);

  // `[` は userEvent のキー指定の綴りなので、文字そのものは `[[` で書く
  await user.keyboard("{Meta>}[[{/Meta}");

  expect(steps).toEqual([ReorderSteps.TowardBack]);
});

test("修飾キーなしでは並べ替えは伝わらない", async () => {
  const user = userEvent.setup();
  const steps: ReorderStep[] = [];
  render(<ReorderShortcutHarness onReorder={(step) => steps.push(step)} />);

  await user.keyboard("]");

  expect(steps).toEqual([]);
});
