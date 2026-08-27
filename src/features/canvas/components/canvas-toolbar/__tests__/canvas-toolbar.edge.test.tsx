import { expect, test } from "vitest";
import { PrimitiveTypes } from "@/domains/dcmp/primitive-schema";
import { renderToolbar, toolbar } from "./setup";

/**
 * 全部を見る。1 つだけだと、押せるかどうかを片方にしか渡していない実装が通る。
 *
 * 実装と同じ `PrimitiveTypes` から引くのは、綴りを固定するとプリミティブが増えたときに
 * 黙って片方を見なくなるため。artboard の `#` は押せる条件が違う（選択に依らない）ので
 * この並びには入らない。
 */
function primitiveInsertButtons(): readonly HTMLElement[] {
  return Object.values(PrimitiveTypes).map((type) =>
    toolbar().getByRole("button", { name: `${type} を追加` }),
  );
}

test("挿せる位置が無いときはどのプリミティブの追加ボタンも押せない", () => {
  renderToolbar({ isInsertEnabled: false });

  expect(
    primitiveInsertButtons().map((button) => button.hasAttribute("disabled")),
  ).toEqual([true, true]);
});

test("押せないときはどのプリミティブの追加ボタンからも理由が読める", () => {
  renderToolbar({ isInsertEnabled: false });

  // `component-list` は「挿入できます」。揺れているのはボタンの動詞のほうで、
  // 揃えるなら両方の入口の語彙を決め直す別の単位になる（#112）。
  expect(
    primitiveInsertButtons().map((button) => button.getAttribute("title")),
  ).toEqual([
    "子を持てるものを選ぶと追加できます",
    "子を持てるものを選ぶと追加できます",
  ]);
});
