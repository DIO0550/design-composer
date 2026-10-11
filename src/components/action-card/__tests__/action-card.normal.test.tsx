import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { ExportContent, ImportContent } from "../__stories__/sample-contents";
import { ActionCard } from "../index";

test("見出しがボタンの名前になり、説明とショートカットは名前に混ざらない", () => {
  render(
    <ActionCard content={ExportContent} onClick={() => {}} disabled={false} />,
  );

  expect(screen.getByRole("button", { name: "書き出す" })).toBeDefined();
});

test("説明がボタンの説明として添えられる", () => {
  render(
    <ActionCard content={ExportContent} onClick={() => {}} disabled={false} />,
  );

  expect(
    screen.getByRole("button", { description: /選んだ部品を画像にする/ }),
  ).toBeDefined();
});

test("ショートカットがボタンの説明として添えられる", () => {
  render(
    <ActionCard content={ExportContent} onClick={() => {}} disabled={false} />,
  );

  expect(screen.getByRole("button", { description: /⌘E/ })).toBeDefined();
});

test("押すと、渡した手続きが 1 回呼ばれる", () => {
  const clicks: string[] = [];
  render(
    <ActionCard
      content={ExportContent}
      onClick={() => clicks.push("clicked")}
      disabled={false}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: "書き出す" }));

  expect(clicks).toHaveLength(1);
});

test("押させたくないときは、押せない状態で出る", () => {
  render(
    <ActionCard content={ExportContent} onClick={() => {}} disabled={true} />,
  );

  expect(
    screen.getByRole("button", { name: "書き出す" }).hasAttribute("disabled"),
  ).toBe(true);
});

test("2 枚並べても、それぞれの見出しがそれぞれの名前になる", () => {
  render(
    <>
      <ActionCard content={ImportContent} onClick={() => {}} disabled={false} />
      <ActionCard content={ExportContent} onClick={() => {}} disabled={false} />
    </>,
  );

  expect(screen.getByRole("button", { name: "取り込む" })).toBeDefined();
  expect(screen.getByRole("button", { name: "書き出す" })).toBeDefined();
});
