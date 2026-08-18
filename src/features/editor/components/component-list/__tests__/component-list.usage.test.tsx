import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { setupAssetGrab } from "@/features/editor/__tests__/asset-grab";
import { Option } from "@/utils/Option";
import { ComponentList } from "../index";

test("見出しの並びに部品の数が出る", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[
        { name: "card", publicPropNames: [], refCount: 4 },
        { name: "button", publicPropNames: [], refCount: 2 },
        { name: "badge", publicPropNames: [], refCount: 0 },
      ]}
      grab={setupAssetGrab()}
    />,
  );

  expect(screen.getByText("3")).toBeDefined();
});

test("部品が無いときは見出しの数が0になる", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[]}
      grab={setupAssetGrab()}
    />,
  );

  expect(screen.getByText("0")).toBeDefined();
});

test("部品の行にその部品の使用数が出る", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[{ name: "card", publicPropNames: [], refCount: 4 }]}
      grab={setupAssetGrab()}
    />,
  );

  expect(screen.getByText("×4")).toBeDefined();
});

test("どこからも使われていない部品の行には使われていない旨が出る", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[{ name: "card", publicPropNames: [], refCount: 0 }]}
      grab={setupAssetGrab()}
    />,
  );

  expect(screen.getByText("unused")).toBeDefined();
});

test("どこからも使われていない部品の行には ×0 を出さない", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[{ name: "card", publicPropNames: [], refCount: 0 }]}
      grab={setupAssetGrab()}
    />,
  );

  expect(screen.queryByText("×0")).toBeNull();
});

test("部品の行にその部品が公開している prop の名前が出る", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[
        { name: "primary-button", publicPropNames: ["label"], refCount: 1 },
      ]}
      grab={setupAssetGrab()}
    />,
  );

  expect(screen.getByText("label")).toBeDefined();
});

test("公開している prop が複数あるときは読点で連ねて出る", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[
        { name: "card", publicPropNames: ["title", "body"], refCount: 2 },
      ]}
      grab={setupAssetGrab()}
    />,
  );

  expect(screen.getByText("title, body")).toBeDefined();
});

test("公開している prop が無い部品の行には prop 名の行が出ない", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[{ name: "divider", publicPropNames: [], refCount: 0 }]}
      grab={setupAssetGrab()}
    />,
  );

  // 行に出るのは型アイコン・名前・使用数だけ。
  // 名前の下に空の行が残ると、prop を公開している部品との間で行の高さがずれる。
  expect(screen.getByRole("listitem").textContent).toBe("◆dividerunused");
});

test("部品は渡された並びのとおりに出る", () => {
  render(
    <ComponentList
      sourceName={Option.none}
      assets={[
        { name: "card", publicPropNames: [], refCount: 0 },
        { name: "button", publicPropNames: [], refCount: 0 },
        { name: "badge", publicPropNames: [], refCount: 0 },
      ]}
      grab={setupAssetGrab()}
    />,
  );

  /*
   * 行を一意に指せる読み上げ名は無い（行は押せるが、押して起きるのは掴むことだけで
   * ボタンではない）ので、名前の文字から行を引いて並びの位置を見る。
   */
  const rows = screen.getAllByRole("listitem");
  const positionOf = (name: string) =>
    rows.indexOf(screen.getByText(name).closest("li") as HTMLLIElement);

  expect([
    positionOf("card"),
    positionOf("button"),
    positionOf("badge"),
  ]).toEqual([0, 1, 2]);
});
