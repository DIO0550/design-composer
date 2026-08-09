import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { PropEdit } from "@/domains/node";
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import { EditorState } from "@/features/editor/domains/editor-state";
import { PropertyPanel } from "../index";

const DOCUMENT = DesignDocument.create({
  tokens: DocumentTemplate.DEFAULT.tokens,
  components: DocumentTemplate.DEFAULT.components,
  artboards: [
    {
      name: "home",
      width: 360,
      height: 240,
      children: [
        { name: "home-title", type: "Text", props: { content: "ホーム" } },
        { name: "home-action", ref: "primary-button" },
        { name: "home-body", type: "Box" },
      ],
    },
  ],
});

/**
 * 編集がドキュメントに反映されることを、reducer と domains の実物を通して確かめる。
 * 選択は Provider の中でしか作れないので、描画直後に選択を送る。
 */
function EditablePanel({ selected }: Readonly<{ selected: string }>) {
  const { state, dispatch } = useEditor();
  const editProp = (edit: PropEdit) =>
    dispatch({ type: "apply_prop_edit", edit });

  return EditorState.isSelected(state, selected) ? (
    <PropertyPanel
      instance={{ goToSource: vi.fn(), detach: vi.fn() }}
      state={state}
      onEditProp={editProp}
      onClearSelection={() => dispatch({ type: "clear_selection" })}
    />
  ) : (
    <button
      type="button"
      onClick={() => dispatch({ type: "select", name: selected })}
    >
      選択する
    </button>
  );
}

async function setupPanel(selected: string) {
  const user = userEvent.setup();
  render(
    <EditorProvider initialDocument={DOCUMENT}>
      <EditablePanel selected={selected} />
    </EditorProvider>,
  );
  await user.click(screen.getByRole("button", { name: "選択する" }));
  return user;
}

test("選択式の prop を選ぶとその値が入力欄に反映される", async () => {
  const user = await setupPanel("home-title");

  await user.selectOptions(screen.getByRole("combobox", { name: "Align" }), [
    "center",
  ]);

  expect(screen.getByRole("combobox", { name: "Align" })).toHaveProperty(
    "value",
    "center",
  );
});

test("選択式の prop を未指定へ戻すと既定が効く表示に戻る", async () => {
  const user = await setupPanel("home-title");
  await user.selectOptions(screen.getByRole("combobox", { name: "Align" }), [
    "center",
  ]);

  await user.selectOptions(screen.getByRole("combobox", { name: "Align" }), [
    "",
  ]);

  expect(
    screen.getByRole("option", { name: "未指定（既定: left）" }),
  ).toHaveProperty("selected", true);
});

test("文字入力の prop を書き換えるとその値が入力欄に反映される", async () => {
  const user = await setupPanel("home-title");

  await user.clear(screen.getByRole("textbox", { name: "Content" }));
  await user.type(screen.getByRole("textbox", { name: "Content" }), "設定");

  expect(screen.getByRole("textbox", { name: "Content" })).toHaveProperty(
    "value",
    "設定",
  );
});

test("インスタンスの公開 prop を書き換えると overrides として反映される", async () => {
  const user = await setupPanel("home-action");

  await user.type(screen.getByRole("textbox", { name: "Label" }), "ログイン");

  expect(screen.getByRole("textbox", { name: "Label" })).toHaveProperty(
    "value",
    "ログイン",
  );
});

test("サイズのモードを fixed にすると長さの入力欄が現れる", async () => {
  const user = await setupPanel("home-body");
  expect(screen.queryByRole("spinbutton", { name: "Width" })).toBeNull();

  await user.selectOptions(
    screen.getByRole("combobox", { name: "Width Mode" }),
    ["fixed"],
  );

  expect(screen.getByRole("spinbutton", { name: "Width" })).toBeDefined();
});

test("数値入力の prop を書き換えるとその値が入力欄に反映される", async () => {
  const user = await setupPanel("home-body");
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Width Mode" }),
    ["fixed"],
  );

  await user.type(screen.getByRole("spinbutton", { name: "Width" }), "240");

  expect(screen.getByRole("spinbutton", { name: "Width" })).toHaveProperty(
    "value",
    "240",
  );
});
