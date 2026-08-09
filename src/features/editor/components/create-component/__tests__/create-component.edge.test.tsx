import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { CreateComponent } from "../index";

/** artboard・インスタンス・部品にできるノードが揃ったドキュメント。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
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
  });
}

/**
 * 名前を選んだ状態。名前を渡さなければ何も選んでいない状態。
 *
 * @param selectedName 選んでおく名前。不在なら未選択のまま
 * @returns その選択を持つエディタの状態
 */
function setupState(selectedName: Option<string>): EditorState {
  const state = EditorState.create(setupDocument());
  return selectedName.some
    ? EditorState.select(state, selectedName.value)
    : state;
}

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
