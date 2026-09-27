import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { dragRowNamed } from "@/components/__tests__/row-drag";
import { openedAt } from "@/domains/__tests__/sample-document";
import { OpenedDocuments } from "@/domains/session/opened-documents";
import type { IndexMove } from "@/types/IndexMove";
import { DocumentTabBar } from "../index";

const FirstPath = "/work/login.dcmp";
const SecondPath = "/work/settings.dcmp";

/**
 * 2 つ開いて 2 つ目を見ている帯を描く。
 *
 * @returns 押された先と、運ばれた移動を記録する並び
 */
function renderTwoTabs(): Readonly<{
  selected: string[];
  closed: string[];
  moves: IndexMove[];
}> {
  const selected: string[] = [];
  const closed: string[] = [];
  const moves: IndexMove[] = [];
  const opened = OpenedDocuments.open(
    OpenedDocuments.create(openedAt(FirstPath)),
    openedAt(SecondPath),
  );

  render(
    <DocumentTabBar
      opened={opened}
      onSelect={(path) => selected.push(path)}
      onClose={(path) => closed.push(path)}
      onReorder={(move) => moves.push(move)}
    />,
  );

  return { selected, closed, moves };
}

test("開いているファイルの名前が、並び順に並ぶ", () => {
  renderTwoTabs();

  const names = screen
    .getAllByRole("button")
    .filter((button) => button.hasAttribute("title"))
    .map((button) => button.textContent);

  expect(names).toStrictEqual(["login.dcmp", "settings.dcmp"]);
});

test("タブはフルパスを手がかりとして持つ", () => {
  renderTwoTabs();

  const paths = screen
    .getAllByRole("button")
    .map((button) => button.getAttribute("title"))
    .filter((title) => title !== null);

  expect(paths).toStrictEqual([FirstPath, SecondPath]);
});

test("見ていないタブを押すと、そのパスへ移ることが伝わる", async () => {
  const { selected } = renderTwoTabs();

  await userEvent.click(screen.getByTitle(FirstPath));

  expect(selected).toStrictEqual([FirstPath]);
});

test("見ているタブを押しても、そのパスが伝わる", async () => {
  const { selected } = renderTwoTabs();

  await userEvent.click(screen.getByTitle(SecondPath));

  expect(selected).toStrictEqual([SecondPath]);
});

test("閉じるボタンを押すと、そのパスを閉じることが伝わる", async () => {
  const { closed } = renderTwoTabs();

  await userEvent.click(
    screen.getByRole("button", { name: `${FirstPath} を閉じる` }),
  );

  expect(closed).toStrictEqual([FirstPath]);
});

test("1 つだけ開いているときも、閉じるボタンは出る", () => {
  render(
    <DocumentTabBar
      opened={OpenedDocuments.create(openedAt(FirstPath))}
      onSelect={vi.fn()}
      onClose={vi.fn()}
      onReorder={vi.fn()}
    />,
  );

  expect(
    screen.getByRole("button", { name: `${FirstPath} を閉じる` }),
  ).toBeDefined();
});

test("見ているタブだけが、見ている印を持つ", () => {
  renderTwoTabs();

  expect(screen.getByTitle(SecondPath).getAttribute("aria-current")).toBe(
    "true",
  );
  expect(screen.getByTitle(FirstPath).getAttribute("aria-current")).toBe(
    "false",
  );
});

test("タブを掴んで別のタブの上で離すと、並びの位置での移動が伝わる", () => {
  const { moves } = renderTwoTabs();

  dragRowNamed(screen.getByRole("list"), {
    from: "settings.dcmp",
    to: "login.dcmp",
  });

  expect(moves).toStrictEqual([{ fromIndex: 1, toIndex: 0 }]);
});
