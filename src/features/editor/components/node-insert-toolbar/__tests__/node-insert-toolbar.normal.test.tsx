import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import type { NodeTemplate } from "@/features/editor/domains/node-template";
import { NodeInsertToolbar } from "../index";

test("プリミティブごとの追加ボタンが並ぶ", () => {
  render(<NodeInsertToolbar isInsertEnabled onInsert={() => {}} />);

  expect(screen.getByRole("button", { name: "Box を追加" })).toBeDefined();
  expect(screen.getByRole("button", { name: "Text を追加" })).toBeDefined();
});

test("追加ボタンはそれぞれの型アイコンを出す", () => {
  render(<NodeInsertToolbar isInsertEnabled onInsert={() => {}} />);

  /*
   * アイコンだけのボタンなので、絵が無いと空の四角が 2 つ並ぶ。読み上げ名は
   * `aria-label` から出るため、アイコンを消してもボタンを名前で探すテストは
   * すべて通ってしまう（実際にアイコンを消して 703 件すべて通ることを確かめた）。
   */
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

  /*
   * Box と別に見るのは、`PRIMITIVE_TYPES` の走査を「先頭 1 件だけ」に壊しても
   * Box 側のテストは通ってしまうため。
   */
  expect(inserted).toEqual([{ kind: "primitive", type: "Text" }]);
});
