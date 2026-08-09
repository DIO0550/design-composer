import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import type { NodeTemplate } from "@/features/editor/domains/node-template";
import { NodeInsertToolbar } from "../index";

/** 器を起点に探す。ボタンを直接引くと、器が読み上げ名を失っても気づけない。 */
function toolbar() {
  return within(screen.getByRole("region", { name: "挿入" }));
}

test("プリミティブごとの追加ボタンが並ぶ", () => {
  render(<NodeInsertToolbar isInsertEnabled onInsert={() => {}} />);

  expect(toolbar().getByRole("button", { name: "Box を追加" })).toBeDefined();
  expect(toolbar().getByRole("button", { name: "Text を追加" })).toBeDefined();
});

test("追加ボタンはそれぞれの型アイコンを出す", () => {
  render(<NodeInsertToolbar isInsertEnabled onInsert={() => {}} />);

  // 読み上げ名は `aria-label` から出るので、名前で探すテストはアイコンを消しても通る。
  expect(
    within(screen.getByRole("button", { name: "Box を追加" })).getByText("□"),
  ).toBeDefined();
  expect(
    within(screen.getByRole("button", { name: "Text を追加" })).getByText("T"),
  ).toBeDefined();
});

test("Box を追加すると Box の挿入が伝わる", async () => {
  const user = userEvent.setup();
  const inserted: NodeTemplate[] = [];
  render(
    <NodeInsertToolbar
      isInsertEnabled
      onInsert={(template) => inserted.push(template)}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Box を追加" }));

  expect(inserted).toEqual([{ kind: "primitive", type: "Box" }]);
});

test("Text を追加すると Text の挿入が伝わる", async () => {
  const user = userEvent.setup();
  const inserted: NodeTemplate[] = [];
  render(
    <NodeInsertToolbar
      isInsertEnabled
      onInsert={(template) => inserted.push(template)}
    />,
  );

  await user.click(screen.getByRole("button", { name: "Text を追加" }));

  // Box と別に見るのは、走査を先頭 1 件に壊しても Box 側は通ってしまうため。
  expect(inserted).toEqual([{ kind: "primitive", type: "Text" }]);
});
