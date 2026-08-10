import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { ELEMENT_NAME_ATTRIBUTE } from "@/domains/compiled-element";
import { Option } from "@/utils/Option";
import {
  canvasPane,
  renderOpenedDocument,
  selectArtboard,
  selectInTree,
} from "./setup";

/**
 * キャンバスに描かれている要素。ノードの style はインライン style に出る
 * （`CompiledElement.html`）ので、そこから読む。
 *
 * @param name 描かれている artboard / ノードの名前
 * @returns その名前の要素。無ければテストを落とす
 */
function canvasElement(name: string): HTMLElement {
  return Option.unwrap(
    Option.fromNullable(
      canvasPane().querySelector<HTMLElement>(
        `[${ELEMENT_NAME_ATTRIBUTE}="${name}"]`,
      ),
    ),
  );
}

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

test("セグメントコントロールで並びを変えるとキャンバスの表示が変わる", async () => {
  await renderOpenedDocument();
  await selectArtboard("home");

  await userEvent.click(
    within(screen.getByRole("group", { name: "Direction" })).getByRole(
      "button",
      { name: "row" },
    ),
  );

  expect(canvasElement("home").style.flexDirection).toBe("row");
});
