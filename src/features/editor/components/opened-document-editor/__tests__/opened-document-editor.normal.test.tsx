import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { renderOpenedDocument } from "./setup";

test("ドキュメントを開くと3つのペインが表示される", async () => {
  await renderOpenedDocument();

  const panes = [
    screen.getByRole("complementary", { name: "左ペイン" }),
    screen.getByRole("main", { name: "キャンバス" }),
    screen.getByRole("complementary", { name: "プロパティパネル" }),
  ];

  expect(panes).toHaveLength(3);
});

test("ドキュメントの artboard がツリービューとキャンバスの両方に表示される", async () => {
  await renderOpenedDocument();

  const tree = screen.getByRole("complementary", {
    name: "左ペイン",
  });
  const canvas = screen.getByRole("main", { name: "キャンバス" });

  expect(within(tree).getByRole("button", { name: "home" })).toBeDefined();
  expect(within(canvas).getByRole("button", { name: /home/ })).toBeDefined();
});

test("ドキュメントを開いた直後はプロパティパネルに何も選択されていないと表示される", async () => {
  await renderOpenedDocument();

  const propertyPanel = screen.getByRole("complementary", {
    name: "プロパティパネル",
  });

  expect(within(propertyPanel).getByText("選択されていません")).toBeDefined();
});

test("ツリービューで artboard を選ぶとプロパティパネルにその名前が表示される", async () => {
  await renderOpenedDocument();
  const tree = screen.getByRole("complementary", {
    name: "左ペイン",
  });

  await userEvent.click(within(tree).getByRole("button", { name: "home" }));

  const propertyPanel = screen.getByRole("complementary", {
    name: "プロパティパネル",
  });
  expect(within(propertyPanel).getByText("home")).toBeDefined();
});

test("キャンバスで artboard を選ぶとツリービューの表示も選択中に変わる", async () => {
  await renderOpenedDocument();
  const canvas = screen.getByRole("main", { name: "キャンバス" });

  await userEvent.click(within(canvas).getByRole("button", { name: /home/ }));

  const tree = screen.getByRole("complementary", {
    name: "左ペイン",
  });
  expect(
    within(tree)
      .getByRole("button", { name: "home" })
      .getAttribute("aria-current"),
  ).toBe("true");
});

test("選択を解除するとプロパティパネルが未選択の表示に戻る", async () => {
  await renderOpenedDocument();
  const tree = screen.getByRole("complementary", {
    name: "左ペイン",
  });
  await userEvent.click(within(tree).getByRole("button", { name: "home" }));

  await userEvent.click(screen.getByRole("button", { name: "選択を解除" }));

  const propertyPanel = screen.getByRole("complementary", {
    name: "プロパティパネル",
  });
  expect(within(propertyPanel).getByText("選択されていません")).toBeDefined();
});

test("選択を解除すると見出しから選んでいたものが消える", async () => {
  await renderOpenedDocument();
  const tree = screen.getByRole("complementary", {
    name: "左ペイン",
  });
  await userEvent.click(within(tree).getByRole("button", { name: "home" }));

  await userEvent.click(screen.getByRole("button", { name: "選択を解除" }));

  /*
   * 押す前は帯に `home` と `Artboard` が出ている状態から始めているので、
   * 帯を消し忘れる実装ではここが落ちる（選択が無いのに出ないことを見るのではなく、
   * 出ていたものが消えることを見る / rules/testing.md「その assert は落ちうるか」）。
   */
  const propertyPanel = screen.getByRole("complementary", {
    name: "プロパティパネル",
  });
  expect(within(propertyPanel).queryByText("Artboard")).toBeNull();
});
