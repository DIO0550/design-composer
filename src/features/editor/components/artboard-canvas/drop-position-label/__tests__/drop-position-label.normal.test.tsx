import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { DropTarget } from "@/features/editor/domains/node-drop";
import { DropPositionLabel } from "../index";

/*
 * 落ちる位置の綴り（UI 案 docs/Design Composer.html の `into login-form · child 3 of 5`）。
 * 綴りをドメインに持たせず表示側で組んでいるので、組み方はここが持つ。
 */

/** 親と子の数だけを変えた落とし先。矩形は綴りに関わらないので固定でよい。 */
function setupTarget(
  position: DropTarget["position"],
  childCount: number,
): DropTarget {
  return {
    position,
    marker: { left: 100, top: 70, width: 2, height: 108 },
    childCount,
    parentBounds: { left: 80, top: 60, width: 256, height: 128 },
  };
}

test("落ちる先は、どの親の何番目かと子の数を並べた 1 行として読める", () => {
  render(
    <DropPositionLabel
      target={setupTarget({ parentName: "login-form", index: 3 }, 5)}
    />,
  );

  expect(screen.getByText("into login-form · child 3 of 5")).toBeDefined();
});

test("何番目かと子の数は、入れ替わらずにこの順で出る", () => {
  // 2 つが同じ数になる入力だと、入れ替えても綴りが変わらず実装を守れない
  render(
    <DropPositionLabel
      target={setupTarget({ parentName: "home", index: 0 }, 3)}
    />,
  );

  expect(screen.getByText("into home · child 0 of 3")).toBeDefined();
});

test("子がいない親へ落ちるときも子の数が出る", () => {
  render(
    <DropPositionLabel
      target={setupTarget({ parentName: "home-panel", index: 0 }, 0)}
    />,
  );

  expect(screen.getByText("into home-panel · child 0 of 0")).toBeDefined();
});

test("落ちる位置の知らせは読み上げられない", () => {
  /*
   * 同じことをドロップ先の枠と線でも伝えているので、読み上げでは繰り返さない
   * （`TypeGlyph` を読み上げから外すのと同じ扱い）。
   */
  const { container } = render(
    <DropPositionLabel
      target={setupTarget({ parentName: "login-form", index: 3 }, 5)}
    />,
  );

  expect(container.querySelector("p")?.getAttribute("aria-hidden")).toBe(
    "true",
  );
});
