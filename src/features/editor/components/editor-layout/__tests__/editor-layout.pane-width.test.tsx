import { render } from "@testing-library/react";
import type { ComponentProps, ReactElement } from "react";
import { expect, test } from "vitest";
import { LeftPaneShell } from "@/components/__stories__/left-pane-shell";
import { RightPaneShell } from "@/components/__stories__/right-pane-shell";
import { Option } from "@/utils/Option";
import { EditorLayout } from "../index";
import { IdleDragHandlers } from "./idle-drag-handlers";

/**
 * ストーリーの枠（`RightPaneShell`）は右ペインの幅を写しているので、編集画面のグリッドだけを
 * 直すと絵が黙って古くなる（#300）。両方を描いて突き合わせられるのはこの層しかないため、
 * 写している側ではなく写される側のテストとしてここに置く。
 */

/**
 * 描画した結果の一番外側の要素。
 *
 * @param ui 描画するもの
 * @returns 描画された要素。何も描かれなければ `Option.unwrap` がテストを落とす
 */
function renderedRoot(ui: ReactElement): Element {
  const { container } = render(ui);

  return Option.unwrap(Option.fromNullable(container.firstElementChild));
}

/**
 * 要素に当たっている任意値の class（`w-[18rem]`）の中身を取り出す。
 *
 * @param element 当たっている class を読む要素
 * @param prefix 角括弧の手前までの綴り（`w-` など）
 * @returns 角括弧の中身。その接頭辞の class が当たっていなければ none
 */
function arbitraryValue(element: Element, prefix: string): Option<string> {
  const token = element.className
    .split(" ")
    .find(
      (candidate) =>
        candidate.startsWith(`${prefix}[`) && candidate.endsWith("]"),
    );

  return Option.map(Option.fromNullable(token), (found) =>
    found.slice(prefix.length + 1, -1),
  );
}

/**
 * 編集画面の器に実際に当たっているグリッドの列指定。
 *
 * @returns 左から順に並べた列の幅（`grid-cols-[19rem_1fr_18rem]` なら 3 つ）
 */
function renderedEditorColumns(): readonly string[] {
  const root = renderedRoot(
    <EditorLayout dragHandlers={IdleDragHandlers}>{null}</EditorLayout>,
  );

  return Option.unwrap(arbitraryValue(root, "grid-cols-")).split("_");
}

/**
 * ストーリーの枠に実際に当たっている幅。
 *
 * @param height 枠の高さを何に合わせるか
 * @returns 幅の class の中身（`w-[18rem]` なら `18rem`）
 */
function renderedShellWidth(
  height: ComponentProps<typeof RightPaneShell>["height"],
): string {
  const root = renderedRoot(
    <RightPaneShell height={height}>中身</RightPaneShell>,
  );

  return Option.unwrap(arbitraryValue(root, "w-"));
}

/**
 * `rem` を単位に持つ幅の綴りから数値を取り出す（`"19rem"` → `19`）。
 * 左ペインは 1 列目とレールの引き算で比べるため、任意値の文字列のままでは突き合わせられない。
 *
 * @param value `rem` 単位の幅（列指定の中身や `w-[15.5rem]` の中身）
 * @returns rem の数値
 */
function remOf(value: string): number {
  return Number.parseFloat(value);
}

/**
 * ストーリーの左ペインの枠に実際に当たっている幅。
 *
 * @returns 幅の class の中身（`w-[15.5rem]` なら `15.5rem`）
 */
function renderedLeftShellWidth(): string {
  const root = renderedRoot(<LeftPaneShell>中身</LeftPaneShell>);

  return Option.unwrap(arbitraryValue(root, "w-"));
}

/**
 * レール（`LeftPaneRail` の `w-14` = 56px）の幅（rem）。左ペインのパネル部は、器の左列から
 * この分だけ狭い（レールがパネルの左隣に常に立つため）。
 *
 * ここに写しで持つのは、本物のレールを描画して読めないため。`LeftPaneRail` は
 * `features/sidebar` の公開 API（`index.ts`）に出ておらず、横断層の `LeftPaneShell` も
 * この editor 側のテストもレール本体へ deep import できない。
 *
 * Why not: この結合の弱点は、レール幅を変えたときにこのテストが「パネル部（15.5rem）を
 * 動かせ」と誤って迫ること（本来動かすべきは列の側）。許容するのは、レールが UI 案どおり
 * 56px で安定しており、レール自身のストーリーの視覚差分が別途その変更を捉えるため。
 * **レール幅を変えたらこの値も直す。**
 */
const RailWidthRem = 3.5;

test("ペインの高さのストーリーの枠は、編集画面の右ペインの列と同じ幅で描かれる", () => {
  const columns = renderedEditorColumns();

  // 右ペインは 3 列目。列の数が変わると比べる相手が変わるので、先にそこで落とす
  expect(columns).toHaveLength(3);
  expect(renderedShellWidth("pane")).toBe(columns[2]);
});

test("中身の高さのストーリーの枠も、編集画面の右ペインの列と同じ幅で描かれる", () => {
  const columns = renderedEditorColumns();

  expect(columns).toHaveLength(3);
  expect(renderedShellWidth("content")).toBe(columns[2]);
});

test("左ペインのストーリーの枠は、編集画面の左列からレールの幅を引いた幅で描かれる", () => {
  const columns = renderedEditorColumns();

  // 左ペインは 1 列目。列の数が変わると比べる相手が変わるので、先にそこで落とす
  expect(columns).toHaveLength(3);
  expect(remOf(columns[0]) - remOf(renderedLeftShellWidth())).toBe(
    RailWidthRem,
  );
});
