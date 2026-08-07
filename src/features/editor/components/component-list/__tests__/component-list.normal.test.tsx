import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ComponentList } from "../index";

test("ドキュメントの部品が一覧に並ぶ", () => {
  render(
    <ComponentList
      refCounts={[
        { name: "primary-button", count: 1 },
        { name: "divider", count: 0 },
      ]}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(screen.getByText("primary-button")).toBeDefined();
});

test("部品の行には部品を表す型アイコンが出る", () => {
  render(
    <ComponentList
      refCounts={[{ name: "divider", count: 0 }]}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(screen.getByText("◆")).toBeDefined();
});

test("部品が1つも無いときはその旨が表示される", () => {
  render(<ComponentList refCounts={[]} isInsertEnabled onInsert={() => {}} />);

  expect(screen.getByText("部品がありません")).toBeDefined();
});
