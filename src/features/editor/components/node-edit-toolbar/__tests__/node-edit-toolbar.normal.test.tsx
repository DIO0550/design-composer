import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import type { NodeTemplate } from "@/features/editor/domains/node-template";
import { NodeEditToolbar } from "../index";

test("プリミティブごとの追加ボタンが並ぶ", () => {
  render(
    <NodeEditToolbar
      isInsertEnabled
      isRemoveEnabled
      onInsert={() => {}}
      onRemove={() => {}}
    />,
  );

  expect(screen.getByRole("button", { name: "Box を追加" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Text を追加" })).toBeDefined();
});

test("Box を追加すると Box の挿入が伝わる", async () => {
  const user = userEvent.setup();
  const inserted: NodeTemplate[] = [];
  render(
    <NodeEditToolbar
      isInsertEnabled
      isRemoveEnabled
      onInsert={(template) => inserted.push(template)}
      onRemove={() => {}}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Box を追加" }));

  expect(inserted).toEqual([{ kind: "primitive", type: "Box" }]);
});

test("削除を押すと削除が伝わる", async () => {
  const user = userEvent.setup();
  const removed: string[] = [];
  render(
    <NodeEditToolbar
      isInsertEnabled
      isRemoveEnabled
      onInsert={() => {}}
      onRemove={() => removed.push("削除")}
    />,
  );

  await user.click(screen.getByRole("button", { name: "削除" }));

  expect(removed).toEqual(["削除"]);
});

test("挿せる位置が無いときは追加ボタンを押せない", () => {
  render(
    <NodeEditToolbar
      isInsertEnabled={false}
      isRemoveEnabled
      onInsert={() => {}}
      onRemove={() => {}}
    />,
  );

  expect(
    screen.getByRole("button", { name: "Box を追加" }).hasAttribute("disabled"),
  ).toBe(true);
});

test("削除できる対象が無いときは削除ボタンを押せない", () => {
  render(
    <NodeEditToolbar
      isInsertEnabled
      isRemoveEnabled={false}
      onInsert={() => {}}
      onRemove={() => {}}
    />,
  );

  expect(
    screen.getByRole("button", { name: "削除" }).hasAttribute("disabled"),
  ).toBe(true);
});
