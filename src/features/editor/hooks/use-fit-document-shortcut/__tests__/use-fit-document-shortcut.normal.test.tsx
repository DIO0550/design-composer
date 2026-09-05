import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { useFitDocumentShortcut } from "../index";

/**
 * ショートカットを張っただけの器。
 * このフックが決めているのは「全体を収めるのに割り当てるキーはどれか」だけなので、
 * ページ全体で受けることと入力中に無視することは `useKeyShortcut` 側で確かめる。
 */
function FitDocumentShortcutHarness({
  onFitDocument,
}: Readonly<{ onFitDocument: () => void }>) {
  useFitDocumentShortcut(onFitDocument);

  return <p>収める対象</p>;
}

/*
 * 押し方を `{Shift>}!{/Shift}` にしているのは、実ブラウザが Shift 中の数字段で
 * 数字ではなく記号を打つため。`{Shift>}1{/Shift}` は userEvent が `event.key` を
 * "1" のまま届けるので、打たれた文字で待つ実装でも通ってしまう。
 */
test("Shift+1 を押すと全体を収める操作が伝わる", async () => {
  const user = userEvent.setup();
  const fitted: string[] = [];
  render(
    <FitDocumentShortcutHarness onFitDocument={() => fitted.push("収める")} />,
  );

  await user.keyboard("{Shift>}!{/Shift}");

  expect(fitted).toEqual(["収める"]);
});

test("Shift を押していない 1 では伝わらない", async () => {
  const user = userEvent.setup();
  const fitted: string[] = [];
  render(
    <FitDocumentShortcutHarness onFitDocument={() => fitted.push("収める")} />,
  );

  await user.keyboard("1");

  expect(fitted).toEqual([]);
});

test("Shift+2 では伝わらない", async () => {
  // 選択に合わせるほう（Shift+2）と取り違えていないことを見る
  const user = userEvent.setup();
  const fitted: string[] = [];
  render(
    <FitDocumentShortcutHarness onFitDocument={() => fitted.push("収める")} />,
  );

  await user.keyboard("{Shift>}@{/Shift}");

  expect(fitted).toEqual([]);
});
