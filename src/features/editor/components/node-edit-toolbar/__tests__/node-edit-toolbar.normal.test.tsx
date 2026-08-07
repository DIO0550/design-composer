import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import type { NodeTemplate } from "@/features/editor/domains/node-template";
import { NodeEditToolbar } from "../index";

/** 押せる状態や通知先だけを差し替えて、4 つの操作が揃ったツールバーを描く。 */
function setupToolbar(
  overrides: Partial<{
    isInsertEnabled: boolean;
    isCopyEnabled: boolean;
    isPasteEnabled: boolean;
    isRemoveEnabled: boolean;
    onInsert: (template: NodeTemplate) => void;
    onCopy: () => void;
    onPaste: () => void;
    onRemove: () => void;
  }> = {},
) {
  render(
    <NodeEditToolbar>
      <NodeEditToolbar.Insert
        isEnabled={overrides.isInsertEnabled ?? true}
        onInsert={overrides.onInsert ?? (() => {})}
      />
      <NodeEditToolbar.Copy
        isEnabled={overrides.isCopyEnabled ?? true}
        onCopy={overrides.onCopy ?? (() => {})}
      />
      <NodeEditToolbar.Paste
        isEnabled={overrides.isPasteEnabled ?? true}
        onPaste={overrides.onPaste ?? (() => {})}
      />
      <NodeEditToolbar.Remove
        isEnabled={overrides.isRemoveEnabled ?? true}
        onRemove={overrides.onRemove ?? (() => {})}
      />
    </NodeEditToolbar>,
  );
}

test("プリミティブごとの追加ボタンが並ぶ", () => {
  setupToolbar();

  expect(screen.getByRole("button", { name: "Box を追加" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Text を追加" })).toBeDefined();
});

test("Box を追加すると Box の挿入が伝わる", async () => {
  const user = userEvent.setup();
  const inserted: NodeTemplate[] = [];
  setupToolbar({ onInsert: (template) => inserted.push(template) });

  await user.click(screen.getByRole("button", { name: "Box を追加" }));

  expect(inserted).toEqual([{ kind: "primitive", type: "Box" }]);
});

test("削除を押すと削除が伝わる", async () => {
  const user = userEvent.setup();
  const removed: string[] = [];
  setupToolbar({ onRemove: () => removed.push("削除") });

  await user.click(screen.getByRole("button", { name: "削除" }));

  expect(removed).toEqual(["削除"]);
});

test("コピーを押すとコピーが伝わる", async () => {
  const user = userEvent.setup();
  const copied: string[] = [];
  setupToolbar({ onCopy: () => copied.push("コピー") });

  await user.click(screen.getByRole("button", { name: "コピー" }));

  expect(copied).toEqual(["コピー"]);
});

test("貼り付けを押すとペーストが伝わる", async () => {
  const user = userEvent.setup();
  const pasted: string[] = [];
  setupToolbar({ onPaste: () => pasted.push("貼り付け") });

  await user.click(screen.getByRole("button", { name: "貼り付け" }));

  expect(pasted).toEqual(["貼り付け"]);
});

test("挿せる位置が無いときは追加ボタンを押せない", () => {
  setupToolbar({ isInsertEnabled: false });

  expect(
    screen.getByRole("button", { name: "Box を追加" }).hasAttribute("disabled"),
  ).toBe(true);
});

test("削除できる対象が無いときは削除ボタンを押せない", () => {
  setupToolbar({ isRemoveEnabled: false });

  expect(
    screen.getByRole("button", { name: "削除" }).hasAttribute("disabled"),
  ).toBe(true);
});

test("コピーできる対象が無いときはコピーボタンを押せない", () => {
  setupToolbar({ isCopyEnabled: false });

  expect(
    screen.getByRole("button", { name: "コピー" }).hasAttribute("disabled"),
  ).toBe(true);
});

test("貼れる位置が無いときは貼り付けボタンを押せない", () => {
  setupToolbar({ isPasteEnabled: false });

  expect(
    screen.getByRole("button", { name: "貼り付け" }).hasAttribute("disabled"),
  ).toBe(true);
});
