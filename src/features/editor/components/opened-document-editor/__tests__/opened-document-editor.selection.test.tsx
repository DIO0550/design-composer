import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  highlightedNames,
  renderedElement,
} from "@/features/editor/__tests__/canvas-elements";
import { selectedTreeRowNames } from "@/features/editor/__tests__/tree-rows";
import { renderOpenedDocument } from "./setup";

/**
 * 3 ペインを実物のまま組み立て、キャンバスとツリービューの選択が
 * 双方向に連動することを確かめる（docs/06-ui.md「選択」）。
 */
/*
 * 選択の行を読む相手はツリーの領域に絞る。左ペインにはレールの行き先ボタンも並び、
 * そちらも `aria-current` を持つため、ペイン全体を渡すと行き先が行として混ざる
 * （`tree-rows` の注意書きのとおり）。
 */
function tree(): HTMLElement {
  return screen.getByRole("region", { name: "ツリー" });
}

function canvasPane(): HTMLElement {
  return screen.getByRole("main", { name: "キャンバス" });
}

function propertyPane(): HTMLElement {
  return screen.getByRole("complementary", { name: "プロパティパネル" });
}

test("キャンバスでノードを押すとツリービューの同じノードが選択状態になる", async () => {
  await renderOpenedDocument();

  await userEvent.click(renderedElement(canvasPane(), "home-title"));

  expect(selectedTreeRowNames(tree())).toEqual(["home-title"]);
});

test("キャンバスでノードを押すとプロパティパネルがそのノードに切り替わる", async () => {
  await renderOpenedDocument();

  await userEvent.click(renderedElement(canvasPane(), "home-title"));

  expect(within(propertyPane()).getByText("home-title")).toBeDefined();
});

test("キャンバスで部品インスタンスの中身を押すとインスタンスが選択状態になる", async () => {
  await renderOpenedDocument();

  await userEvent.click(within(canvasPane()).getByText("ログイン"));

  expect(selectedTreeRowNames(tree())).toEqual(["home-login"]);
});

test("ツリービューでノードを選ぶとキャンバスのそのノードが強調される", async () => {
  await renderOpenedDocument();

  await userEvent.click(
    within(tree()).getByRole("button", { name: "settings" }),
  );

  expect(highlightedNames(canvasPane())).toEqual(["settings"]);
});

test("キャンバスで選んだノードはキャンバス上でも強調される", async () => {
  await renderOpenedDocument();

  await userEvent.click(renderedElement(canvasPane(), "home-title"));

  expect(highlightedNames(canvasPane())).toEqual(["home-title"]);
});

test("別の artboard を選び直すと前の選択は解除される", async () => {
  await renderOpenedDocument();
  await userEvent.click(renderedElement(canvasPane(), "home-title"));

  await userEvent.click(
    within(tree()).getByRole("button", { name: "settings" }),
  );

  expect(selectedTreeRowNames(tree())).toEqual(["settings"]);
});
