import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  highlightedNames,
  renderedElement,
} from "@/features/editor/__tests__/canvas-elements";
import { currentRowNames } from "@/features/editor/__tests__/row-names";
import { renderOpenedDocument } from "./setup";

/**
 * 3 ペインを実物のまま組み立て、キャンバスとツリービューの選択が
 * 双方向に連動することを確かめる（docs/06-ui.md「選択」）。
 */
/*
 * 選択の行を読む相手はツリーの領域に絞る。左ペインにはレールの行き先ボタンも並び、
 * そちらも `aria-current` を持つため、ペイン全体を渡すと行き先が行として混ざる
 * （`row-names` の注意書きのとおり）。
 */
function tree(): HTMLElement {
  return screen.getByRole("region", { name: "ツリー" });
}

/*
 * artboard はツリーの行ではなく上段の一覧に並ぶ（#112）。選ぶのも今どれを見ているかを
 * 読むのもこちらの領域から行う。
 */
function artboardList(): HTMLElement {
  return screen.getByRole("region", { name: "artboard 一覧" });
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

  expect(currentRowNames(tree())).toEqual(["home-title"]);
});

test("キャンバスでノードを押すとプロパティパネルがそのノードに切り替わる", async () => {
  await renderOpenedDocument();

  await userEvent.click(renderedElement(canvasPane(), "home-title"));

  expect(within(propertyPane()).getByText("home-title")).toBeDefined();
});

test("キャンバスで部品インスタンスの中身を押すとインスタンスが選択状態になる", async () => {
  await renderOpenedDocument();

  await userEvent.click(within(canvasPane()).getByText("ログイン"));

  expect(currentRowNames(tree())).toEqual(["home-login"]);
});

test("ツリービューでノードを選ぶとキャンバスのそのノードが強調される", async () => {
  await renderOpenedDocument();

  await userEvent.click(
    within(tree()).getByRole("button", { name: "home-title" }),
  );

  expect(highlightedNames(canvasPane())).toEqual(["home-title"]);
});

test("キャンバスで選んだノードはキャンバス上でも強調される", async () => {
  await renderOpenedDocument();

  await userEvent.click(renderedElement(canvasPane(), "home-title"));

  expect(highlightedNames(canvasPane())).toEqual(["home-title"]);
});

test("artboard を選ぶと前のノードの選択は解除される", async () => {
  await renderOpenedDocument();
  await userEvent.click(renderedElement(canvasPane(), "home-title"));

  // 同じ artboard を選ぶ。ツリーの中身が変わらないので、選択だけが動いたことを見られる
  await userEvent.click(
    within(artboardList()).getByRole("button", { name: "home" }),
  );

  expect(currentRowNames(tree())).toEqual([]);
});

test("別の artboard を選ぶとその artboard が今見ている 1 枚になる", async () => {
  await renderOpenedDocument();

  await userEvent.click(
    within(artboardList()).getByRole("button", { name: "settings" }),
  );

  expect(currentRowNames(artboardList())).toEqual(["settings"]);
});

test("ノードを選ぶとそれを載せている artboard が今見ている 1 枚として示される", async () => {
  await renderOpenedDocument();
  await userEvent.click(
    within(artboardList()).getByRole("button", { name: "settings" }),
  );

  await userEvent.click(
    within(tree()).getByRole("button", { name: "settings-card" }),
  );

  expect(currentRowNames(artboardList())).toEqual(["settings"]);
});
