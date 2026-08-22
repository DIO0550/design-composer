import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { NodeInsertToolbar } from "../index";

/** 全部を見る。1 つだけだと、押せるかどうかを片方にしか渡していない実装が通る。 */
function insertButtons(): readonly HTMLElement[] {
  return screen.getAllByRole("button", { name: /を追加$/ });
}

test("挿せる位置が無いときはどの追加ボタンも押せない", () => {
  render(
    <NodeInsertToolbar
      isInsertEnabled={false}
      dragged={Option.none}
      onInsert={() => {}}
    />,
  );

  expect(
    insertButtons().map((button) => button.hasAttribute("disabled")),
  ).toEqual([true, true]);
});

test("押せないときはどの追加ボタンからも理由が読める", () => {
  render(
    <NodeInsertToolbar
      isInsertEnabled={false}
      dragged={Option.none}
      onInsert={() => {}}
    />,
  );

  // `component-list` は「挿入できます」。揺れているのはボタンの動詞のほうで、
  // 揃えるなら両方の入口の語彙を決め直す別の単位になる（#112）。
  expect(insertButtons().map((button) => button.getAttribute("title"))).toEqual(
    [
      "子を持てるものを選ぶと追加できます",
      "子を持てるものを選ぶと追加できます",
    ],
  );
});
