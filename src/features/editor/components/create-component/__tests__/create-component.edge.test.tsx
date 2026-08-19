import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { frozen } from "@/features/editor/__tests__/frozen-state";
import { Option } from "@/utils/Option";
import { CreateComponent } from "../index";
import { setupState } from "./setup";

/** 部品化のボタンが押せない状態か。 */
function isCreateDisabled(): boolean {
  return screen
    .getByRole("button", { name: /Create component/ })
    .hasAttribute("disabled");
}

test("インスタンスを選んでいると部品化のボタンを押せない", () => {
  render(
    <CreateComponent
      state={setupState(Option.some("home-login"))}
      onCreate={() => {}}
    />,
  );

  expect(isCreateDisabled()).toBe(true);
});

test("インスタンスを選んでいると部品にできない理由が出る", () => {
  render(
    <CreateComponent
      state={setupState(Option.some("home-login"))}
      onCreate={() => {}}
    />,
  );

  expect(screen.getByText("an instance can't be componentized")).toBeDefined();
});

test("artboard を選んでいると部品化のボタンを押せない", () => {
  render(
    <CreateComponent
      state={setupState(Option.some("home"))}
      onCreate={() => {}}
    />,
  );

  expect(isCreateDisabled()).toBe(true);
});

test("artboard を選んでいると部品にできない理由が出る", () => {
  render(
    <CreateComponent
      state={setupState(Option.some("home"))}
      onCreate={() => {}}
    />,
  );

  expect(screen.getByText("an artboard can't be componentized")).toBeDefined();
});

test("何も選んでいないと部品化のボタンを押せない", () => {
  render(
    <CreateComponent state={setupState(Option.none)} onCreate={() => {}} />,
  );

  expect(isCreateDisabled()).toBe(true);
});

test("何も選んでいないと選ぶよう促される", () => {
  render(
    <CreateComponent state={setupState(Option.none)} onCreate={() => {}} />,
  );

  expect(screen.getByText("select a node to componentize")).toBeDefined();
});

test("部品名が空のままでは部品化のボタンを押せない", async () => {
  const user = userEvent.setup();
  render(
    <CreateComponent
      state={setupState(Option.some("home-panel"))}
      onCreate={() => {}}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Create component/ }));

  expect(isCreateDisabled()).toBe(true);
});

test("識別子の規則を満たさない部品名では部品化のボタンを押せない", async () => {
  const user = userEvent.setup();
  render(
    <CreateComponent
      state={setupState(Option.some("home-panel"))}
      onCreate={() => {}}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Create component/ }));
  await user.type(
    screen.getByRole("textbox", { name: "部品名" }),
    "Info Panel",
  );

  expect(isCreateDisabled()).toBe(true);
});

test("使えない部品名では Enter を押しても部品化が要求されない", async () => {
  const user = userEvent.setup();
  const onCreate = vi.fn();
  render(
    <CreateComponent
      state={setupState(Option.some("home-panel"))}
      onCreate={onCreate}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Create component/ }));
  await user.type(
    screen.getByRole("textbox", { name: "部品名" }),
    "Info Panel{Enter}",
  );

  expect(onCreate).not.toHaveBeenCalled();
});

test("使えない部品名のときはボタンにその旨が添えられる", async () => {
  const user = userEvent.setup();
  render(
    <CreateComponent
      state={setupState(Option.some("home-panel"))}
      onCreate={() => {}}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Create component/ }));
  await user.type(
    screen.getByRole("textbox", { name: "部品名" }),
    "Info Panel",
  );

  expect(
    screen
      .getByRole("button", { name: /Create component/ })
      .getAttribute("title"),
  ).toBe("使える部品名を入れると作成できます");
});

test("部品にできる別のノードを選び直すと打ちかけの部品名が消える", async () => {
  const user = userEvent.setup();
  const { rerender } = render(
    <CreateComponent
      state={setupState(Option.some("home-panel"))}
      onCreate={() => {}}
    />,
  );
  await user.click(screen.getByRole("button", { name: /Create component/ }));
  await user.type(
    screen.getByRole("textbox", { name: "部品名" }),
    "info-panel",
  );

  rerender(
    <CreateComponent
      state={setupState(Option.some("home-title"))}
      onCreate={() => {}}
    />,
  );

  expect(screen.queryByRole("textbox", { name: "部品名" })).toBeNull();
});

test("既に使われている名前では部品化のボタンを押せない", async () => {
  const user = userEvent.setup();
  render(
    <CreateComponent
      state={setupState(Option.some("home-panel"))}
      onCreate={() => {}}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Create component/ }));
  await user.type(
    screen.getByRole("textbox", { name: "部品名" }),
    "primary-button",
  );

  expect(isCreateDisabled()).toBe(true);
});

/*
 * 選択も名前も通る状態を作ってから凍結する。どちらかを外すと、凍結の条件を丸ごと
 * 消しても通るテストになる（`rules/testing.md`「その assert は落ちうるか」）。
 */
test("ファイルが不正な間は使える部品名を入れても部品化のボタンを押せない", async () => {
  const user = userEvent.setup();
  const selected = setupState(Option.some("home-panel"));
  const { rerender } = render(
    <CreateComponent state={selected} onCreate={() => {}} />,
  );

  await user.click(screen.getByRole("button", { name: /Create component/ }));
  await user.type(
    screen.getByRole("textbox", { name: "部品名" }),
    "info-panel",
  );
  expect(isCreateDisabled()).toBe(false);

  rerender(<CreateComponent state={frozen(selected)} onCreate={() => {}} />);

  expect(isCreateDisabled()).toBe(true);
});
