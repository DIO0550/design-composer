import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { TabBar } from "../index";

/** 並べる中身。名前と出す字を別に持てることを見るため、字は名前の一部にしてある。 */
const Items = [
  { name: "/work/login.dcmp", label: "login.dcmp" },
  { name: "/work/settings.dcmp", label: "settings.dcmp" },
];

/**
 * 2 枚並べた帯を描く。2 枚目を見ている状態にする。
 *
 * @returns 押された先を記録する並び
 */
function renderTabBar(): Readonly<{ selected: string[]; closed: string[] }> {
  const selected: string[] = [];
  const closed: string[] = [];

  render(
    <TabBar label="開いているもの">
      {Items.map((item) => (
        <TabBar.Tab
          key={item.name}
          name={item.name}
          isCurrent={item.name === Items[1].name}
          onSelect={() => selected.push(item.name)}
          onClose={() => closed.push(item.name)}
        >
          {item.label}
        </TabBar.Tab>
      ))}
    </TabBar>,
  );

  return { selected, closed };
}

test("並べた順にタブの字が読める", () => {
  renderTabBar();

  const labels = screen
    .getAllByRole("button")
    .filter((button) => button.hasAttribute("title"))
    .map((button) => button.textContent);

  expect(labels).toStrictEqual(["login.dcmp", "settings.dcmp"]);
});

test("出す字とは別に、そのタブが指すものを手がかりとして持つ", () => {
  renderTabBar();

  expect(screen.getByTitle("/work/login.dcmp").textContent).toBe("login.dcmp");
});

test("見ていないタブを押すと、そのタブが選ばれたことが伝わる", async () => {
  const { selected } = renderTabBar();

  await userEvent.click(screen.getByTitle("/work/login.dcmp"));

  expect(selected).toStrictEqual(["/work/login.dcmp"]);
});

test("閉じるボタンを押すと、そのタブを閉じることが伝わる", async () => {
  const { closed } = renderTabBar();

  await userEvent.click(
    screen.getByRole("button", { name: "/work/login.dcmp を閉じる" }),
  );

  expect(closed).toStrictEqual(["/work/login.dcmp"]);
});

test("見ているタブだけが、見ている印を持つ", () => {
  renderTabBar();

  expect(
    screen.getByTitle("/work/settings.dcmp").getAttribute("aria-current"),
  ).toBe("true");
  expect(
    screen.getByTitle("/work/login.dcmp").getAttribute("aria-current"),
  ).toBe("false");
});

test("帯は何の並びかを名前で答える", () => {
  renderTabBar();

  expect(
    screen.getByRole("navigation", { name: "開いているもの" }),
  ).toBeDefined();
});

test("1 枚だけでも閉じるボタンは出る", () => {
  render(
    <TabBar label="開いているもの">
      <TabBar.Tab
        name="/work/login.dcmp"
        isCurrent={true}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      >
        login.dcmp
      </TabBar.Tab>
    </TabBar>,
  );

  expect(
    screen.getByRole("button", { name: "/work/login.dcmp を閉じる" }),
  ).toBeDefined();
});
