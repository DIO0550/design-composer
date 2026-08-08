import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/features/editor/__tests__/row-names";
import { renderOpenedDocument } from "./setup";

function tree(): HTMLElement {
  return screen.getByRole("region", { name: "ツリー" });
}

test("ツリービューで子を下へ動かすと兄弟の並びがその順序に変わる", async () => {
  await renderOpenedDocument();

  await userEvent.click(
    screen.getByRole("button", { name: "home-title を下へ" }),
  );

  expect(rowNames(tree())).toEqual(["home-login", "home-title"]);
});

test("並べ替えたあとは動かした先の位置に合わせて移動できる向きが変わる", async () => {
  await renderOpenedDocument();

  await userEvent.click(
    screen.getByRole("button", { name: "home-title を下へ" }),
  );

  expect(
    screen.queryByRole("button", { name: "home-title を下へ" }),
  ).toBeNull();
});

test("並べ替えても選択していたノードは選択されたままになる", async () => {
  await renderOpenedDocument();
  await userEvent.click(screen.getByRole("button", { name: "home-title" }));

  await userEvent.click(
    screen.getByRole("button", { name: "home-title を下へ" }),
  );

  expect(
    screen
      .getByRole("button", { name: "home-title" })
      .getAttribute("aria-current"),
  ).toBe("true");
});
