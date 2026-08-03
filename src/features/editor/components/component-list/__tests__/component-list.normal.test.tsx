import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import { ComponentList } from "../index";

function setupComponents(): ComponentSet {
  return {
    "primary-button": {
      type: "Box",
      publicProps: { label: { node: "primary-button-label", prop: "content" } },
      children: [{ name: "primary-button-label", type: "Text" }],
    },
    divider: { type: "Box" },
  };
}

test("ドキュメントの部品が一覧に並ぶ", () => {
  render(<ComponentList components={setupComponents()} />);

  expect(screen.getByText("primary-button")).toBeDefined();
});

test("部品のルートの型が一覧に出る", () => {
  render(<ComponentList components={{ divider: { type: "Box" } }} />);

  expect(screen.getByText("Box")).toBeDefined();
});

test("公開 prop を持つ部品はその prop 名が一覧に出る", () => {
  render(<ComponentList components={setupComponents()} />);

  expect(screen.getByText("公開 prop: label")).toBeDefined();
});

test("公開 prop を持たない部品には公開 prop の表示が出ない", () => {
  render(<ComponentList components={{ divider: { type: "Box" } }} />);

  expect(screen.queryByText(/公開 prop:/)).toBeNull();
});

test("部品が1つも無いときはその旨が表示される", () => {
  render(<ComponentList components={{}} />);

  expect(screen.getByText("部品がありません")).toBeDefined();
});
