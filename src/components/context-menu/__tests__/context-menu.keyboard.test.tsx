import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  type KeyShortcut,
  KeyTriggers,
  useKeyShortcut,
} from "@/hooks/use-key-shortcut";
import { ContextMenu } from "../index";
import {
  menu,
  renderMenu,
  type SelectedRows,
  setupRecordedRow,
  setupRow,
} from "./setup";

/*
 * キーボードだけでメニューを操作できることと、受けたキーがページ全体の割り当てへ
 * 漏れないことを確かめる（docs/06-ui.md「コンテキストメニュー」）。
 */

/**
 * 今フォーカスがある行の綴り。
 *
 * @returns フォーカスがある行の綴り。器にフォーカスがあれば `null`
 */
function focusedRow(): string | null {
  const focused = globalThis.document.activeElement;
  return focused === menu() ? null : (focused?.textContent ?? null);
}

/** 打たれた文字で待ち受ける、修飾キーなしの割り当て。 */
function typedKey(key: string): KeyShortcut {
  return {
    kind: KeyTriggers.TypedCharacter,
    keys: [key],
    withCommandKey: false,
    withShiftKey: false,
  };
}

/**
 * ページ全体の割り当てを 1 つ張ったうえでメニューを描く。
 *
 * メニューが受けたキーがそこへ届くかを見る。Esc は選択解除、↑↓ は選んでいるノードの座標の
 * 移動、space はパンの構えに割り当ててあるので、漏れるとメニューを操作しただけでキャンバス
 * かドキュメントが動く。
 *
 * @param shortcut 待ち受ける割り当て
 * @param pressed 割り当てが発火したことを積む先
 */
function renderMenuUnderShortcut(
  shortcut: KeyShortcut,
  pressed: string[],
): void {
  function ShortcutProbe() {
    useKeyShortcut(shortcut, () => pressed.push("fired"));
    return null;
  }

  render(
    <>
      <ShortcutProbe />
      <ContextMenu
        at={{ x: 0, y: 0 }}
        groups={[[setupRow("Copy"), setupRow("Paste")]]}
        onClose={() => {}}
      />
    </>,
  );
}

test("↓ で先頭の押せる行へフォーカスが移る", async () => {
  renderMenu({ groups: [[setupRow("Copy"), setupRow("Paste")]] });

  await userEvent.keyboard("{ArrowDown}");

  expect(focusedRow()).toBe("Copy");
});

test("↓ は押せない行を飛ばす", async () => {
  renderMenu({
    groups: [[setupRow("Copy", { isEnabled: false }), setupRow("Paste")]],
  });

  await userEvent.keyboard("{ArrowDown}");

  expect(focusedRow()).toBe("Paste");
});

test("末尾の押せる行から ↓ を押すと先頭へ戻る", async () => {
  renderMenu({ groups: [[setupRow("Copy"), setupRow("Paste")]] });

  await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");

  expect(focusedRow()).toBe("Copy");
});

test("↑ で 1 つ前の押せる行へ移る", async () => {
  renderMenu({
    groups: [[setupRow("Copy"), setupRow("Paste"), setupRow("Delete")]],
  });

  await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}");

  expect(focusedRow()).toBe("Copy");
});

test("器にフォーカスがある状態から ↑ を押すと末尾の押せる行へ入る", async () => {
  renderMenu({
    groups: [[setupRow("Copy"), setupRow("Delete", { isEnabled: false })]],
  });

  await userEvent.keyboard("{ArrowUp}");

  expect(focusedRow()).toBe("Copy");
});

test("Enter でフォーカスしている行の手続きが呼ばれる", async () => {
  const selected: SelectedRows = [];
  renderMenu({
    groups: [
      [setupRecordedRow("Copy", selected), setupRecordedRow("Paste", selected)],
    ],
  });

  await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");

  expect(selected).toEqual(["Paste"]);
});

test("Esc でメニューが閉じる", async () => {
  const closed: string[] = [];
  renderMenu({ onClose: () => closed.push("closed") });

  await userEvent.keyboard("{Escape}");

  expect(closed).toEqual(["closed"]);
});

test("Esc の押下はメニューの外へ漏れない", async () => {
  const pressed: string[] = [];
  renderMenuUnderShortcut(typedKey("Escape"), pressed);

  await userEvent.keyboard("{Escape}");

  expect(pressed).toEqual([]);
});

test("↓ の押下はメニューの外へ漏れない", async () => {
  const pressed: string[] = [];
  renderMenuUnderShortcut(typedKey("ArrowDown"), pressed);

  await userEvent.keyboard("{ArrowDown}");

  expect(pressed).toEqual([]);
});

test("↑ の押下はメニューの外へ漏れない", async () => {
  const pressed: string[] = [];
  renderMenuUnderShortcut(typedKey("ArrowUp"), pressed);

  await userEvent.keyboard("{ArrowUp}");

  expect(pressed).toEqual([]);
});

test("space の押下はメニューの外へ漏れない", async () => {
  const pressed: string[] = [];
  /*
   * パンの構え（`use-space-held`）は物理キーで待つので、同じ形の割り当てで探る。
   * 漏らすと、行を活性化しただけでキャンバスがパンの構えになる。
   */
  renderMenuUnderShortcut(
    {
      kind: KeyTriggers.PhysicalKey,
      codes: ["Space"],
      withCommandKey: false,
      withShiftKey: false,
    },
    pressed,
  );

  await userEvent.keyboard("[Space]");

  expect(pressed).toEqual([]);
});

test("押せる行が 1 つも無いメニューでは ↓ を押してもフォーカスが器から動かない", async () => {
  renderMenu({
    groups: [
      [
        setupRow("Copy", { isEnabled: false }),
        setupRow("Paste", { isEnabled: false }),
      ],
    ],
  });

  await userEvent.keyboard("{ArrowDown}");

  expect(focusedRow()).toBeNull();
});
