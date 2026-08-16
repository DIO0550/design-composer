import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { PropEdit } from "@/domains/node";
import {
  pressedSegmentsOf,
  segmentOf,
} from "@/features/editor/__tests__/segmented-controls";
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import { EditorState } from "@/features/editor/domains/editor-state";
import { PropertyPanel } from "../index";

const EditedDocument = DesignDocument.create({
  tokens: DocumentTemplate.Default.tokens,
  components: DocumentTemplate.Default.components,
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
      instance={{
        goToSource: vi.fn(),
        selectAllInstances: vi.fn(),
        detach: vi.fn(),
      }}
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
    <EditorProvider initialDocument={EditedDocument}>
      <EditablePanel selected={selected} />
    </EditorProvider>,
  );
  await user.click(screen.getByRole("button", { name: "選択する" }));
  return user;
}

test("セグメントを押すとその値が選ばれた状態になる", async () => {
  const user = await setupPanel("home-title");

  await user.click(segmentOf("Align", "center"));

  expect(pressedSegmentsOf("Align")).toEqual(["center"]);
});

test("選ばれているセグメントをもう一度押すと未指定へ戻り既定が効く表示になる", async () => {
  const user = await setupPanel("home-title");
  await user.click(segmentOf("Align", "center"));

  await user.click(segmentOf("Align", "center"));

  expect(screen.getByText("未指定（既定: left）")).toBeDefined();
});

test("同じ選択肢を持つ 2 つの enum は取り違えずに別々に編集できる", async () => {
  /*
   * Box の `align` と `justify` はどちらも start / center / end を持つ。
   * 取り違えると押した側が空になり、押していない側が `center` になって落ちる。
   */
  const user = await setupPanel("home-body");

  await user.click(segmentOf("Justify", "center"));

  expect([pressedSegmentsOf("Align"), pressedSegmentsOf("Justify")]).toEqual([
    [],
    ["center"],
  ]);
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

test("トークン参照の prop を選び直すとその値が入力欄に反映される", async () => {
  const user = await setupPanel("home-title");

  await user.selectOptions(screen.getByRole("combobox", { name: "Color" }), [
    "primary",
  ]);

  expect(screen.getByRole("combobox", { name: "Color" })).toHaveProperty(
    "value",
    "primary",
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

  await user.click(segmentOf("Width Mode", "fixed"));

  expect(screen.getByRole("spinbutton", { name: "Width" })).toBeDefined();
});

test("サイズのモードを fixed から戻すと長さの入力欄が消える", async () => {
  const user = await setupPanel("home-body");
  await user.click(segmentOf("Width Mode", "fixed"));

  await user.click(segmentOf("Width Mode", "hug"));

  expect(screen.queryByRole("spinbutton", { name: "Width" })).toBeNull();
});

test("数値入力の prop を書き換えるとその値が入力欄に反映される", async () => {
  const user = await setupPanel("home-body");
  await user.click(segmentOf("Width Mode", "fixed"));

  await user.type(screen.getByRole("spinbutton", { name: "Width" }), "240");

  expect(screen.getByRole("spinbutton", { name: "Width" })).toHaveProperty(
    "value",
    "240",
  );
});
