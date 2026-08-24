import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";
import { EditorLayout } from "../index";
import { IdleDragHandlers } from "./idle-drag-handlers";

function setupLayout() {
  return render(
    <EditorLayout dragHandlers={IdleDragHandlers}>
      <EditorLayout.LeftPane isFrozen={false}>左の中身</EditorLayout.LeftPane>
      <EditorLayout.CenterPane>中央の中身</EditorLayout.CenterPane>
      <EditorLayout.RightPane isFrozen={false}>右の中身</EditorLayout.RightPane>
    </EditorLayout>,
  );
}

test("左ペインに渡した中身が左ペインの領域に表示される", () => {
  setupLayout();

  const leftPane = screen.getByRole("complementary", { name: "左ペイン" });

  expect(within(leftPane).getByText("左の中身")).toBeDefined();
});

test("中央ペインに渡した中身がキャンバスの領域に表示される", () => {
  setupLayout();

  const canvas = screen.getByRole("main", { name: "キャンバス" });

  expect(within(canvas).getByText("中央の中身")).toBeDefined();
});

test("右ペインに渡した中身がプロパティパネルの領域に表示される", () => {
  setupLayout();

  const rightPane = screen.getByRole("complementary", {
    name: "プロパティパネル",
  });

  expect(within(rightPane).getByText("右の中身")).toBeDefined();
});
