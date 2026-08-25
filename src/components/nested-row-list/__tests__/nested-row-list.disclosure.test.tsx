import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { contentTexts, renderRowList } from "./setup";

test("初めて描いたときはどの枝も開いた状態として示される", () => {
  renderRowList();

  // 枝は body / deep / aside の 3 つ。畳んだ側を持つ設計を壊すとこの引き方が失敗する
  expect(screen.getAllByRole("button", { expanded: true })).toHaveLength(3);
});

test("子を持つ行には開閉の操作が出る", () => {
  renderRowList();

  expect(screen.getByRole("button", { name: "body の開閉" })).toBeDefined();
});

test("子を持たない行には開閉の操作が出ない", () => {
  renderRowList();

  expect(screen.queryByRole("button", { name: "title の開閉" })).toBeNull();
});

test("枝を畳むとその枝の開閉の操作は閉じた状態として示される", async () => {
  renderRowList();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(
    screen.getByRole("button", { name: "body の開閉", expanded: false }),
  ).toBeDefined();
});

test("開いている枝の三角は下向きになる", () => {
  renderRowList();

  expect(screen.getByRole("button", { name: "body の開閉" }).textContent).toBe(
    "▾",
  );
});

test("畳んだ枝の三角は右向きになる", async () => {
  renderRowList();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(screen.getByRole("button", { name: "body の開閉" }).textContent).toBe(
    "▸",
  );
});

test("枝を畳むとその枝の子が並びから消える", async () => {
  renderRowList();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(screen.queryByRole("button", { name: "body-text" })).toBeNull();
});

test("枝を畳むとその枝の孫も並びから消える", async () => {
  renderRowList();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(screen.queryByRole("button", { name: "deep-text" })).toBeNull();
});

test("枝を畳んでもその枝自身の行は並びに残る", async () => {
  const { list } = renderRowList();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(contentTexts(list)).toEqual([
    "title",
    "body",
    "aside",
    "aside-only",
    "footer",
  ]);
});

test("枝を畳んでも兄弟の枝の子は並んだままになる", async () => {
  renderRowList();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(screen.getByRole("button", { name: "aside-only" })).toBeDefined();
});

test("畳んだ枝をもう一度開くと子が並びに戻る", async () => {
  renderRowList();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));
  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(screen.getByRole("button", { name: "body-text" })).toBeDefined();
});

test("開閉を押しても行の中身の操作は起こらない", async () => {
  const { onSelect } = renderRowList();

  await userEvent.click(screen.getByRole("button", { name: "body の開閉" }));

  expect(onSelect).not.toHaveBeenCalled();
});
