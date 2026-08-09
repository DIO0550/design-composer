import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { ComponentList } from "../index";

test("ドキュメントの部品が一覧に並ぶ", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[
        { name: "primary-button", publicPropNames: ["label"], refCount: 1 },
        { name: "divider", publicPropNames: [], refCount: 0 },
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
      sourceName={Option.none}
      assets={[{ name: "divider", publicPropNames: [], refCount: 0 }]}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(screen.getByText("◆")).toBeDefined();
});

test("部品が1つも無いときは行が出ない", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[]}
      isInsertEnabled
      onInsert={() => {}}
    />,
  );

  expect(screen.queryAllByRole("listitem")).toEqual([]);
});
