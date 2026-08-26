import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import type { NodeTemplate } from "@/domains/session/node-template";
import { renderToolbar, toolbar } from "./setup";

test("プリミティブごとの追加ボタンが並ぶ", () => {
  renderToolbar();

  expect(toolbar().getByRole("button", { name: "Box を追加" })).toBeDefined();
  expect(toolbar().getByRole("button", { name: "Text を追加" })).toBeDefined();
});

test("追加ボタンはそれぞれの型アイコンを出す", () => {
  renderToolbar();

  // 読み上げ名は `aria-label` から出るので、名前で探すテストはアイコンを消しても通る。
  expect(
    within(screen.getByRole("button", { name: "Box を追加" })).getByText("□"),
  ).toBeDefined();
  expect(
    within(screen.getByRole("button", { name: "Text を追加" })).getByText("T"),
  ).toBeDefined();
  expect(
    within(screen.getByRole("button", { name: "artboard を追加" })).getByText(
      "#",
    ),
  ).toBeDefined();
});

test("Box を追加すると Box の挿入が伝わる", async () => {
  const user = userEvent.setup();
  const inserted: NodeTemplate[] = [];
  renderToolbar({ onInsert: (template) => inserted.push(template) });

  await user.click(screen.getByRole("button", { name: "Box を追加" }));

  expect(inserted).toEqual([{ kind: "primitive", type: "Box" }]);
});

test("Text を追加すると Text の挿入が伝わる", async () => {
  const user = userEvent.setup();
  const inserted: NodeTemplate[] = [];
  renderToolbar({ onInsert: (template) => inserted.push(template) });

  await user.click(screen.getByRole("button", { name: "Text を追加" }));

  // Box と別に見るのは、走査を先頭 1 件に壊しても Box 側は通ってしまうため。
  expect(inserted).toEqual([{ kind: "primitive", type: "Text" }]);
});
