import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { segmentOf } from "@/components/__tests__/segmented-controls";
import { renderedElement } from "@/features/editor/__tests__/canvas-elements";
import { ShorthandLabels } from "@/features/inspector";
import {
  canvasPane,
  renderOpenedDocument,
  selectArtboard,
  selectInTree,
} from "./setup";

/*
 * プロパティパネルからの props 編集を、編集画面の配線ごと確かめる
 * （docs/06-ui.md「編集操作の一覧」の props 編集）。
 *
 * パネル単体のテスト（property-panel）は編集が渡ることまでしか見ないので、
 * 渡した編集がドキュメントへ入りキャンバスへ出るところはここでしか通らない。
 */

test("プロパティパネルで文言を変えるとキャンバスの表示が変わる", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");

  await userEvent.clear(screen.getByRole("textbox", { name: "Content" }));
  await userEvent.type(
    screen.getByRole("textbox", { name: "Content" }),
    "ダッシュボード",
  );

  expect(screen.getByText("ダッシュボード")).toBeDefined();
});

test("トークン参照の prop を選び直すとその値がパネルに残る", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Background" }),
    "gray-100",
  );

  expect(screen.getByRole("combobox", { name: "Background" })).toHaveProperty(
    "value",
    "gray-100",
  );
});

test("数値のトークン参照を選び直すと併記される解決値も追随する", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Gap" }),
    "xl",
  );

  expect(
    screen.getByRole("combobox", { name: "Gap", description: "32" }),
  ).toBeDefined();
});

test("セグメントコントロールで並びを変えるとキャンバスの表示が変わる", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.click(segmentOf("Direction", "row"));

  expect(renderedElement(canvasPane(), "home").style.flexDirection).toBe("row");
});

test("畳んだ padding の欄を変えると向かい合う 2 辺がまとめて変わる", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Padding Vertical" }),
    "sm",
  );
  await userEvent.click(
    screen.getByRole("button", { name: ShorthandLabels.perEdge }),
  );

  expect(
    ["Padding Top", "Padding Bottom", "Padding Right"].map(
      (name) => screen.getByRole<HTMLSelectElement>("combobox", { name }).value,
    ),
  ).toEqual(["sm", "sm", "lg"]);
});

test("畳んだ padding の欄を変えたあと Ctrl+Z を 1 回押すと両辺が戻る", async () => {
  /*
   * 2 辺への書き込みを 1 件の編集にしている根拠がここにある。辺ごとに分けて
   * 適用すると履歴も 2 段になり、1 回戻したところで上辺だけが `lg` へ戻る。
   *
   * 今は `PropEdit` が書き込み先を並びで持つので分けて適用する経路自体が無く、
   * このテストは実装を局所的に壊しても落ちない。分ける形へ戻したときに
   * 落ちる場所として置いている。
   */
  await renderOpenedDocument();
  await selectArtboard("home");
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Padding Vertical" }),
    "sm",
  );

  await userEvent.keyboard("{Control>}z{/Control}");
  await userEvent.click(
    screen.getByRole("button", { name: ShorthandLabels.perEdge }),
  );

  expect(
    ["Padding Top", "Padding Bottom"].map(
      (name) => screen.getByRole<HTMLSelectElement>("combobox", { name }).value,
    ),
  ).toEqual(["lg", "lg"]);
});
