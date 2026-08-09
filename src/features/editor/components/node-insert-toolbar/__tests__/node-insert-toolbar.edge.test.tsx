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
   * `component-list` は同じ条件に「子を持てるものを選ぶと挿入できます」を出す。
   * どちらも自分のボタンの動詞（追加 / 挿入）に合わせた綴りで、揺れているのは
   * ボタンの動詞のほう。揃えるなら両方の入口の語彙を決め直す別の単位になるので、
   * ここでは今の綴りを承知で固定する（#112）。
   */
  expect(insertButtons().map((button) => button.getAttribute("title"))).toEqual(
    [
      "子を持てるものを選ぶと追加できます",
      "子を持てるものを選ぶと追加できます",
    ],
  );
});
