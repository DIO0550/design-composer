import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { NodeInsertToolbar } from "../index";

/**
 * 追加のボタン全部。1 つだけを見ると、押せるかどうかを片方のボタンにしか
 * 渡していない実装が通ってしまう。
 */
function insertButtons(): readonly HTMLElement[] {
  return screen.getAllByRole("button", { name: /を追加$/ });
}

test("挿せる位置が無いときはどの追加ボタンも押せない", () => {
  render(<NodeInsertToolbar isInsertEnabled={false} onInsert={() => {}} />);

  expect(
    insertButtons().map((button) => button.hasAttribute("disabled")),
  ).toEqual([true, true]);
});

test("押せないときはどの追加ボタンからも理由が読める", () => {
  render(<NodeInsertToolbar isInsertEnabled={false} onInsert={() => {}} />);

  /*
   * 文言は `component-list` の「子を持てるものを選ぶと挿入できます」と揺れているが、
   * 揃えるのは別の単位。ここでは今の綴りを承知で固定する。
   */
  expect(insertButtons().map((button) => button.getAttribute("title"))).toEqual(
    [
      "子を持てるものを選ぶと追加できます",
      "子を持てるものを選ぶと追加できます",
    ],
  );
});
