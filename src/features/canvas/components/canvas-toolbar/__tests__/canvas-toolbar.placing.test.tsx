import { expect, test } from "vitest";
import type { NodeTemplate } from "@/domains/session/node-template";
import { Option } from "@/utils/Option";
import { renderToolbar, toolbar } from "./setup";

/*
 * パレットから運んでいることの表示（UI 案 docs/Design Composer.html の `3a · ASSETS` は
 * `◆` に `background:#f3ebff` を付ける / #203）。
 */

/** 運んでいるものを変えてツールバーを描き、`◆` を返す。 */
function glyphWhilePlacing(dragged: Option<NodeTemplate>): HTMLElement {
  const { unmount } = renderToolbar({ dragged });
  const glyph = toolbar().getByText("◆");
  unmount();
  return glyph;
}

test("何も運んでいないときもツールバーにインスタンスの印が残る", () => {
  // UI 案は `◆` を常に置き、運んでいる間だけ背景を付ける（要素が現れるのではない）
  renderToolbar();

  expect(toolbar().getByText("◆")).toBeDefined();
});

test("インスタンスの印は押せない", () => {
  // 挿入の入口はドラッグだけで、これは状態表示（#198）
  renderToolbar({
    dragged: Option.some<NodeTemplate>({
      kind: "instance",
      componentName: "card",
    }),
  });

  // ボタンにした（包んだ場合も含む）実装で落ちる。並びそのものは `.artboard` が見る
  expect(toolbar().getByText("◆").closest("button")).toBeNull();
});

test("部品を運んでいる間はインスタンスの印が運んでいないときと違う姿になる", () => {
  /*
   * 点灯そのものは Tailwind の class でしか表れず happy-dom では読めないので、
   * 確かめるのは 2 つの入力で姿が変わることまで。色は Storybook の視覚差分が見る。
   */
  const idle = glyphWhilePlacing(Option.none);
  const placing = glyphWhilePlacing(
    Option.some<NodeTemplate>({ kind: "instance", componentName: "card" }),
  );

  expect(placing.className).not.toBe(idle.className);
});

test("プリミティブを運んでいる間はインスタンスの印が点かない", () => {
  /*
   * `◆` はアプリ全体で「部品 / インスタンス」を指す記号（`TypeGlyph` の `component`）。
   * Box を運んでいる間に点けると記号が 2 つの意味を持つ。
   */
  const idle = glyphWhilePlacing(Option.none);
  const placingBox = glyphWhilePlacing(
    Option.some<NodeTemplate>({ kind: "primitive", type: "Box" }),
  );

  expect(placingBox.className).toBe(idle.className);
});
