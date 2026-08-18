import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { ComponentAsset } from "@/domains/component";
import { setupAssetGrab } from "@/features/editor/__tests__/asset-grab";
import { Option } from "@/utils/Option";
import { AssetsPanel } from "../index";

const Assets: readonly ComponentAsset[] = [
  { name: "primary-button", publicPropNames: ["label"], refCount: 4 },
  { name: "card", publicPropNames: ["title", "body"], refCount: 2 },
];

test("プリミティブと部品の両方が並ぶ", () => {
  render(
    <AssetsPanel
      sourceName={Option.none}
      assets={Assets}
      grab={setupAssetGrab()}
    />,
  );

  expect(screen.getByText("Primitives")).toBeDefined();
  expect(screen.getByText("Components")).toBeDefined();
});

test("組み込みのプリミティブが行として出る", () => {
  render(
    <AssetsPanel
      sourceName={Option.none}
      assets={Assets}
      grab={setupAssetGrab()}
    />,
  );

  expect(screen.getByText("Box")).toBeDefined();
  expect(screen.getByText("Text")).toBeDefined();
});

test("渡された部品が行として出る", () => {
  render(
    <AssetsPanel
      sourceName={Option.none}
      assets={Assets}
      grab={setupAssetGrab()}
    />,
  );

  expect(screen.getByText("primary-button")).toBeDefined();
});

test("部品が1件も無くてもプリミティブは出る", () => {
  render(
    <AssetsPanel
      sourceName={Option.none}
      assets={[]}
      grab={setupAssetGrab()}
    />,
  );

  expect(screen.getByText("Box")).toBeDefined();
});

test("部品の行にもプリミティブの行にも押せるものが無い", () => {
  // `Assets` は browse-only（UI 案「Insertion is drag-only」/ #203）。
  // 検索欄は `searchbox` なので、ここで数える `button` は行の操作だけになる
  render(
    <AssetsPanel
      sourceName={Option.none}
      assets={Assets}
      grab={setupAssetGrab()}
    />,
  );

  expect(screen.queryAllByRole("button")).toEqual([]);
});
