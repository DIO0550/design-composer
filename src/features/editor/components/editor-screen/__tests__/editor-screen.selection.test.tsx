import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  highlightedNames,
  renderedElement,
} from "@/features/editor/__tests__/canvas-elements";
import { EditorScreen } from "../index";

/**
 * 3 ペインを実物のまま組み立て、キャンバスとツリービューの選択が
 * 双方向に連動することを確かめる（docs/06-ui.md「選択」）。
 */
function setupPanes() {
  render(<EditorScreen />);
  return {
    tree: screen.getByRole("complementary", { name: "ツリービュー・部品一覧" }),
    canvas: screen.getByRole("main", { name: "キャンバス" }),
    propertyPanel: screen.getByRole("complementary", {
      name: "プロパティパネル",
    }),
  };
}

/** ツリービューで選択状態になっている行の名前。 */
function selectedTreeRowNames(tree: HTMLElement): readonly string[] {
  return within(tree)
    .getAllByRole("button")
    .filter((row) => row.getAttribute("aria-current") === "true")
    .map((row) => row.textContent ?? "");
}

test("キャンバスでノードを押すとツリービューの同じノードが選択状態になる", async () => {
  const { tree, canvas } = setupPanes();

  await userEvent.click(renderedElement(canvas, "home-title"));

  expect(selectedTreeRowNames(tree)).toEqual(["home-title"]);
});

test("キャンバスでノードを押すとプロパティパネルがそのノードに切り替わる", async () => {
  const { canvas, propertyPanel } = setupPanes();

  await userEvent.click(renderedElement(canvas, "home-title"));

  expect(within(propertyPanel).getByText("home-title")).toBeDefined();
});

test("キャンバスで部品インスタンスの中身を押すとインスタンスが選択状態になる", async () => {
  const { tree, canvas } = setupPanes();

  await userEvent.click(within(canvas).getByText("ログイン"));

  expect(selectedTreeRowNames(tree)).toEqual([
    "home-login（primary-button のインスタンス）",
  ]);
});

test("ツリービューでノードを選ぶとキャンバスのそのノードが強調される", async () => {
  const { tree, canvas } = setupPanes();

  await userEvent.click(within(tree).getByRole("button", { name: "settings" }));

  expect(highlightedNames(canvas)).toEqual(["settings"]);
});

test("キャンバスで選んだノードはキャンバス上でも強調される", async () => {
  const { canvas } = setupPanes();

  await userEvent.click(renderedElement(canvas, "home-title"));

  expect(highlightedNames(canvas)).toEqual(["home-title"]);
});

test("別の artboard を選び直すと前の選択は解除される", async () => {
  const { tree, canvas } = setupPanes();
  await userEvent.click(renderedElement(canvas, "home-title"));

  await userEvent.click(within(tree).getByRole("button", { name: "settings" }));

  expect(selectedTreeRowNames(tree)).toEqual(["settings"]);
});
