import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { setupAssetGrab } from "@/features/editor/__tests__/asset-grab";
import type { NodeTemplate } from "@/domains/node-template";
import { Option } from "@/utils/Option";
import { PrimitiveList } from "../index";

test("渡されたプリミティブが行として並ぶ", () => {
  render(<PrimitiveList types={["Box", "Text"]} grab={setupAssetGrab()} />);

  expect(
    screen.getAllByRole("listitem").map((item) => item.textContent),
  ).toEqual(["\u25a1Boxdrag", "TTextdrag"]);
});

test("プリミティブの行にはその型を表すアイコンが出る", () => {
  render(<PrimitiveList types={["Box"]} grab={setupAssetGrab()} />);

  expect(screen.getByText("\u25a1")).toBeDefined();
});

test("プリミティブの行には掴めることの知らせが出る", () => {
  // 行に押せるものが無いので、掴めることは語で伝えるしかない（UI 案の `drag`）
  render(<PrimitiveList types={["Box"]} grab={setupAssetGrab()} />);

  expect(screen.getByText("drag")).toBeDefined();
});

test("渡されたプリミティブが1つも無いときは行が出ない", () => {
  render(<PrimitiveList types={[]} grab={setupAssetGrab()} />);

  expect(screen.queryAllByRole("listitem")).toEqual([]);
});

test("渡されたプリミティブが1つも無くても節は残る", () => {
  render(<PrimitiveList types={[]} grab={setupAssetGrab()} />);

  // 節ごと消すと `Components` 側と出方が食い違う。0 件であることは
  // 検索語を持つ `AssetsPanel` が伝える。
  expect(screen.getByText("Primitives")).toBeDefined();
});

test("プリミティブの行を押すとその型の雛形を掴んだことが伝わる", () => {
  const grabbed: NodeTemplate[] = [];
  render(
    <PrimitiveList
      types={["Box", "Text"]}
      grab={setupAssetGrab({
        onGrab: (template) => grabbed.push(template),
      })}
    />,
  );

  fireEvent.pointerDown(screen.getByText("Text").closest("li") as HTMLElement);

  // Box と別に見るのは、走査を先頭 1 件に壊しても Box 側は通ってしまうため
  expect(grabbed).toEqual([{ kind: "primitive", type: "Text" }]);
});

test("掴んでいるプリミティブの行だけが掴んでいるものとして示される", () => {
  render(
    <PrimitiveList
      types={["Box", "Text"]}
      grab={setupAssetGrab({
        dragged: Option.some<NodeTemplate>({ kind: "primitive", type: "Box" }),
      })}
    />,
  );

  /*
   * 見た目（背景と左端の帯）は Tailwind の class でしか表れず happy-dom では
   * 読めないので、ここで確かめるのは「掴んでいる行と掴んでいない行が別の姿になる」
   * ことまで。色そのものは Storybook の視覚差分が見る。
   */
  const [box, text] = screen.getAllByRole("listitem");
  expect(box.className).not.toBe(text.className);
});
