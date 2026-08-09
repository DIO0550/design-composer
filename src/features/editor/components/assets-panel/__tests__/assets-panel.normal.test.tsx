import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { ComponentAsset } from "@/domains/component";
import { Option } from "@/utils/Option";
import { AssetsPanel } from "../index";

const ASSETS: readonly ComponentAsset[] = [
  { name: "primary-button", publicPropNames: ["label"], refCount: 4 },
  { name: "card", publicPropNames: ["title", "body"], refCount: 2 },
];

test("プリミティブと部品の両方が並ぶ", () => {
  render(
    <AssetsPanel
      sourceName={Option.none}
      assets={ASSETS}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(screen.getByText("Primitives")).toBeDefined();
  expect(screen.getByText("Components")).toBeDefined();
});

test("組み込みのプリミティブが行として出る", () => {
  render(
    <AssetsPanel
      sourceName={Option.none}
      assets={ASSETS}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(screen.getByText("Box")).toBeDefined();
  expect(screen.getByText("Text")).toBeDefined();
});

test("渡された部品が行として出る", () => {
  render(
    <AssetsPanel
      sourceName={Option.none}
      assets={ASSETS}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(screen.getByText("primary-button")).toBeDefined();
});

test("部品が1件も無くてもプリミティブは出る", () => {
  render(
    <AssetsPanel
      sourceName={Option.none}
      assets={[]}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(screen.getByText("Box")).toBeDefined();
});

test("部品の行から挿せる", () => {
  render(
    <AssetsPanel
      sourceName={Option.none}
      assets={ASSETS}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(
    screen.getByRole("button", { name: "primary-button を挿入" }),
  ).toBeDefined();
});
