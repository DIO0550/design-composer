import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { renderToolbar, toolbar } from "./setup";

/*
 * artboard を足すスロット（UI 案 docs/Design Composer.html の `#` / #316）。
 * プリミティブの挿入とは押せる条件が違うので、観点を分けて見る。
 */

test("ツールバーは artboard・Box・Text の順に追加ボタンを並べる", () => {
  /*
   * UI 案の並びは `ポインタ → # → □ → T`。ポインタは持たない（ツールモードが無い）ので、
   * 残る 4 つの相対順序を保つと `#` が先頭になる。
   */
  renderToolbar();

  expect(
    toolbar()
      .getAllByRole("button")
      .map((button) => button.getAttribute("aria-label")),
  ).toEqual(["artboard を追加", "Box を追加", "Text を追加"]);
});

test("artboard の追加ボタンを押すと artboard の追加が伝わる", async () => {
  const user = userEvent.setup();
  let addedCount = 0;
  renderToolbar({
    onAddArtboard: () => {
      addedCount += 1;
    },
  });

  await user.click(screen.getByRole("button", { name: "artboard を追加" }));

  expect(addedCount).toBe(1);
});

test("挿せる位置が無くても artboard は追加できる", () => {
  // artboard は選択位置ではなく並びの末尾へ足すので、押せるかどうかが選択に依らない
  renderToolbar({ isInsertEnabled: false });

  expect(
    screen
      .getByRole("button", { name: "artboard を追加" })
      .hasAttribute("disabled"),
  ).toBe(false);
});
