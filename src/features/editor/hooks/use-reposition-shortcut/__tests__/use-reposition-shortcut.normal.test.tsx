import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import type { Offset } from "@/domains/unit/offset";
import { useRepositionShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「どのキーがどれだけの移動量か」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function RepositionShortcutHarness({
  onReposition,
}: Readonly<{ onReposition: (delta: Offset) => void }>) {
  useRepositionShortcut(onReposition);

  return <p>移動の対象</p>;
}

/**
 * そのキー操作で伝わった移動量を集める。
 *
 * @param keys `userEvent.keyboard` に渡すキー操作
 * @returns 伝わった移動量の並び
 */
async function pressedDeltas(keys: string): Promise<readonly Offset[]> {
  const user = userEvent.setup();
  const deltas: Offset[] = [];
  render(
    <RepositionShortcutHarness onReposition={(delta) => deltas.push(delta)} />,
  );

  await user.keyboard(keys);

  return deltas;
}

test("左矢印を押すと横へ 1px 戻る移動が伝わる", async () => {
  expect(await pressedDeltas("{ArrowLeft}")).toEqual([{ x: -1, y: 0 }]);
});

test("右矢印を押すと横へ 1px 進む移動が伝わる", async () => {
  expect(await pressedDeltas("{ArrowRight}")).toEqual([{ x: 1, y: 0 }]);
});

test("上矢印を押すと縦へ 1px 戻る移動が伝わる", async () => {
  expect(await pressedDeltas("{ArrowUp}")).toEqual([{ x: 0, y: -1 }]);
});

test("下矢印を押すと縦へ 1px 進む移動が伝わる", async () => {
  expect(await pressedDeltas("{ArrowDown}")).toEqual([{ x: 0, y: 1 }]);
});

test("Shift を押しながらの矢印では、同じ向きへ大きく動く移動が伝わる", async () => {
  expect(await pressedDeltas("{Shift>}{ArrowRight}{/Shift}")).toEqual([
    { x: 10, y: 0 },
  ]);
});

test("修飾キーの ⌘ を押しながらの矢印では伝わらない", async () => {
  expect(await pressedDeltas("{Meta>}{ArrowRight}{/Meta}")).toEqual([]);
});
