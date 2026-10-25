import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { dragRowNamed } from "@/components/__tests__/row-drag";
import { rowNames } from "@/components/__tests__/row-names";
import { SampleDocumentWithSameComponentInstances } from "@/features/editor/__tests__/sample-document";
import { canvasPane, propertyPane, renderOpenedDocument, tree } from "./setup";

test("ツリービューで子を後ろの行の上へ運ぶと兄弟の並びがその順序に変わる", async () => {
  await renderOpenedDocument();

  dragRowNamed(tree(), { from: "home-title", to: "home-login" });

  expect(rowNames(tree())).toEqual(["home-login", "home-title"]);
});

/*
 * 旧「並べ替えたあとは動かした先の位置に合わせて移動できる向きが変わる」の
 * 置き換え。`↑` / `↓` の出し分けが無くなったので、代わりに**動かした先から
 * もう一度運べる**ことを見る（並べ替えのたびに位置を数え直しているか）。
 */
test("並べ替えたあとも動かした先から運び直せる", async () => {
  await renderOpenedDocument();
  dragRowNamed(tree(), { from: "home-title", to: "home-login" });

  dragRowNamed(tree(), { from: "home-title", to: "home-login" });

  expect(rowNames(tree())).toEqual(["home-title", "home-login"]);
});

test("選んでいるノードは ⌘] で兄弟の並びの中を前面へ動く", async () => {
  await renderOpenedDocument();
  await userEvent.click(screen.getByRole("button", { name: "home-title" }));

  await userEvent.keyboard("{Meta>}]{/Meta}");

  expect(rowNames(tree())).toEqual(["home-login", "home-title"]);
});

test("並べ替えても選択していたノードは選択されたままになる", async () => {
  await renderOpenedDocument();
  await userEvent.click(screen.getByRole("button", { name: "home-title" }));

  dragRowNamed(tree(), { from: "home-title", to: "home-login" });

  expect(
    screen
      .getByRole("button", { name: "home-title" })
      .getAttribute("aria-current"),
  ).toBe("true");
});

test("同じ親の兄弟をまとめて選んでいるときは ⌘[ でまとめて背面へ動く", async () => {
  await renderOpenedDocument(SampleDocumentWithSameComponentInstances);
  await userEvent.click(within(canvasPane()).getByText("ログイン"));
  await userEvent.click(
    within(propertyPane()).getByRole("button", {
      name: "Select all 2 instances",
    }),
  );

  await userEvent.keyboard("{Meta>}[[{/Meta}");

  expect(rowNames(tree())).toEqual(["home-login", "home-signup", "home-title"]);
});
