import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { NodeTemplate } from "@/domains/session/node-template";
import {
  grabbingComponent,
  setupAssetGrab,
} from "@/features/assets/__tests__/asset-grab";
import { Option } from "@/utils/Option";
import { ComponentList } from "../index";

/*
 * `Assets` は browse-only で、挿入の入口はキャンバスへのドラッグだけ
 * （UI 案 docs/Design Composer.html「Insertion is drag-only」/ #203）。
 */

test("部品の行を押すとその部品の雛形を掴んだことが伝わる", () => {
  const grabbed: NodeTemplate[] = [];
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[
        { name: "card", publicPropNames: [], refCount: 0 },
        { name: "button", publicPropNames: [], refCount: 0 },
      ]}
      grab={setupAssetGrab({ onGrab: (template) => grabbed.push(template) })}
    />,
  );

  fireEvent.pointerDown(
    screen.getByText("button").closest("li") as HTMLElement,
  );

  expect(grabbed).toEqual([{ kind: "instance", componentName: "button" }]);
});

test("掴んでいる部品の行だけが掴んでいるものとして示される", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[
        { name: "card", publicPropNames: [], refCount: 0 },
        { name: "button", publicPropNames: [], refCount: 0 },
      ]}
      grab={grabbingComponent("card")}
    />,
  );

  /*
   * 見た目（背景と左端の帯）は Tailwind の class でしか表れず happy-dom では
   * 読めないので、確かめるのは 2 行が別の姿になることまで。色は視覚差分が見る。
   */
  const [card, button] = screen.getAllByRole("listitem");
  expect(card.className).not.toBe(button.className);
});

test("掴んでいる部品の行では、出どころの色より掴んでいる色が優先される", () => {
  render(
    <ComponentList
      sourceName={Option.some("card")}
      assets={[{ name: "card", publicPropNames: [], refCount: 1 }]}
      grab={grabbingComponent("card")}
    />,
  );

  // 2 つの色が同時に出ると、どちらの意味の色か読めなくなる
  expect(screen.getByRole("listitem").className).not.toContain("purple");
});
