import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { Option } from "@/utils/Option";
import { CreateComponent } from "../index";
import { setupInput } from "./setup";

test("部品にできるノードを選んでいると部品化のボタンを押せる", () => {
  const input = setupInput(Option.some("home-panel"));
  render(
    <CreateComponent
      document={input.document}
      singleName={input.singleName}
      isFrozen={false}
      onCreate={() => {}}
    />,
  );

  expect(
    screen
      .getByRole("button", { name: /Create component/ })
      .hasAttribute("disabled"),
  ).toBe(false);
});

test("部品化のボタンには部品を表すアイコンが付く", () => {
  const input = setupInput(Option.some("home-panel"));
  render(
    <CreateComponent
      document={input.document}
      singleName={input.singleName}
      isFrozen={false}
      onCreate={() => {}}
    />,
  );

  expect(screen.getByText("◆")).toBeDefined();
});

test("部品にできるノードを選んでいると元にするものの名前が出る", () => {
  const input = setupInput(Option.some("home-panel"));
  render(
    <CreateComponent
      document={input.document}
      singleName={input.singleName}
      isFrozen={false}
      onCreate={() => {}}
    />,
  );

  expect(screen.getByText("home-panel")).toBeDefined();
});

test("部品化のボタンを押すと部品名の入力欄が出る", async () => {
  const user = userEvent.setup();
  const input = setupInput(Option.some("home-panel"));
  render(
    <CreateComponent
      document={input.document}
      singleName={input.singleName}
      isFrozen={false}
      onCreate={() => {}}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Create component/ }));

  expect(screen.getByRole("textbox", { name: "部品名" })).toBeDefined();
});

test("部品名を入れて押すとその名前で部品化が要求される", async () => {
  const user = userEvent.setup();
  const onCreate = vi.fn();
  const input = setupInput(Option.some("home-panel"));
  render(
    <CreateComponent
      document={input.document}
      singleName={input.singleName}
      isFrozen={false}
      onCreate={onCreate}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Create component/ }));
  await user.type(
    screen.getByRole("textbox", { name: "部品名" }),
    "info-panel",
  );
  await user.click(screen.getByRole("button", { name: /Create component/ }));

  expect(onCreate).toHaveBeenCalledWith("info-panel");
});

test("部品名を入れて Enter を押してもその名前で部品化が要求される", async () => {
  const user = userEvent.setup();
  const onCreate = vi.fn();
  const input = setupInput(Option.some("home-panel"));
  render(
    <CreateComponent
      document={input.document}
      singleName={input.singleName}
      isFrozen={false}
      onCreate={onCreate}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Create component/ }));
  await user.type(
    screen.getByRole("textbox", { name: "部品名" }),
    "info-panel{Enter}",
  );

  expect(onCreate).toHaveBeenCalledWith("info-panel");
});

test("入力欄を開いている間も元にするものの名前は出たままになる", async () => {
  const user = userEvent.setup();
  const input = setupInput(Option.some("home-panel"));
  render(
    <CreateComponent
      document={input.document}
      singleName={input.singleName}
      isFrozen={false}
      onCreate={() => {}}
    />,
  );

  await user.click(screen.getByRole("button", { name: /Create component/ }));

  expect(screen.getByText("home-panel")).toBeDefined();
});
