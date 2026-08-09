import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { CreateComponent } from "../index";

/** 部品にできるノードと、既に名前空間にいる部品を 1 つずつ置く。 */
function setupState(selectedName: string): EditorState {
  return EditorState.select(
    EditorState.create(
      DesignDocument.create({
        tokens: DocumentTemplate.DEFAULT.tokens,
        components: DocumentTemplate.DEFAULT.components,
        artboards: [
          {
            name: "home",
            width: 360,
            height: 240,
            children: [
              {
                name: "home-panel",
                type: "Box",
                children: [{ name: "home-title", type: "Text" }],
              },
              { name: "home-login", ref: "primary-button" },
            ],
          },
        ],
      }),
    ),
    selectedName,
  );
}

test("部品にできるノードを選んでいると部品化のボタンを押せる", () => {
  render(
    <CreateComponent state={setupState("home-panel")} onCreate={() => {}} />,
  );

  expect(
    screen
      .getByRole("button", { name: /Create component/ })
      .hasAttribute("disabled"),
  ).toBe(false);
});

test("部品にできるノードを選んでいると元にするものの名前が出る", () => {
  render(
    <CreateComponent state={setupState("home-panel")} onCreate={() => {}} />,
  );

  expect(screen.getByText("home-panel")).toBeDefined();
});

test("部品化のボタンを押すと部品名の入力欄が出る", async () => {
  const user = userEvent.setup();
  render(
    <CreateComponent state={setupState("home-panel")} onCreate={() => {}} />,
  );

  await user.click(screen.getByRole("button", { name: /Create component/ }));

  expect(screen.getByRole("textbox", { name: "部品名" })).toBeDefined();
});

test("部品名を入れて押すとその名前で部品化が要求される", async () => {
  const user = userEvent.setup();
  const onCreate = vi.fn();
  render(
    <CreateComponent state={setupState("home-panel")} onCreate={onCreate} />,
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
  render(
    <CreateComponent state={setupState("home-panel")} onCreate={onCreate} />,
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
  render(
    <CreateComponent state={setupState("home-panel")} onCreate={() => {}} />,
  );

  await user.click(screen.getByRole("button", { name: /Create component/ }));

  expect(screen.getByText("home-panel")).toBeDefined();
});
