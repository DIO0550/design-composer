import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import {
  pressedSegmentsOf,
  segmentOf,
} from "@/components/__tests__/segmented-controls";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/document-selection";
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
 * 渡した編集がドキュメントに入り、その結果が欄へ戻ってくることを、domains の実物を
 * 通して確かめる。書き込みは `DesignDocument.applyPropEdit`（編集画面の reducer が
 * 呼ぶのと同じ関数）で、通らなかった編集は捨てて今の値を保つ。
 *
 * 編集画面の配線（reducer → 履歴 → キャンバス）は
 * `opened-document-editor.prop-edit.test.tsx` が通す。ここが見るのはパネルの往復だけ。
 */
function EditablePanel({ selected }: Readonly<{ selected: string }>) {
  const [selection, setSelection] = useState(() =>
    DocumentSelection.fromNames(EditedDocument, [selected]),
  );

  return (
    <PropertyPanel.Body
      selection={selection}
      isFrozen={false}
      instance={{
        goToSource: vi.fn(),
        selectAllInstances: vi.fn(),
        detach: vi.fn(),
      }}
      onEditProp={(edit) =>
        setSelection((current) => {
          const edited = DesignDocument.applyPropEdit(
            current.document,
            selected,
            edit,
          );
          return edited.ok
            ? DocumentSelection.fromNames(edited.value, [selected])
            : current;
        })
      }
      onClearSelection={vi.fn()}
    />
  );
}

function setupPanel(selected: string) {
  render(<EditablePanel selected={selected} />);
  return userEvent.setup();
}

test("セグメントを押すとその値が選ばれた状態になる", async () => {
  const user = setupPanel("home-title");

  await user.click(segmentOf("Align", "center"));

  expect(pressedSegmentsOf("Align")).toEqual(["center"]);
});

test("選ばれているセグメントをもう一度押すと未指定へ戻り既定が効く表示になる", async () => {
  const user = setupPanel("home-title");
  await user.click(segmentOf("Align", "center"));

  await user.click(segmentOf("Align", "center"));

  expect(screen.getByText("未指定（既定: left）")).toBeDefined();
});

test("同じ選択肢を持つ 2 つの enum は取り違えずに別々に編集できる", async () => {
  /*
   * Box の `align` と `justify` はどちらも start / center / end を持つ。
   * 取り違えると押した側が空になり、押していない側が `center` になって落ちる。
   */
  const user = setupPanel("home-body");

  await user.click(segmentOf("Justify", "center"));

  expect([pressedSegmentsOf("Align"), pressedSegmentsOf("Justify")]).toEqual([
    [],
    ["center"],
  ]);
});

test("文字入力の prop を書き換えるとその値が入力欄に反映される", async () => {
  const user = setupPanel("home-title");

  await user.clear(screen.getByRole("textbox", { name: "Content" }));
  await user.type(screen.getByRole("textbox", { name: "Content" }), "設定");

  expect(screen.getByRole("textbox", { name: "Content" })).toHaveProperty(
    "value",
    "設定",
  );
});

test("トークン参照の prop を選び直すとその値が入力欄に反映される", async () => {
  const user = setupPanel("home-title");

  await user.selectOptions(screen.getByRole("combobox", { name: "Color" }), [
    "primary",
  ]);

  expect(screen.getByRole("combobox", { name: "Color" })).toHaveProperty(
    "value",
    "primary",
  );
});

test("インスタンスの公開 prop を書き換えると overrides として反映される", async () => {
  const user = setupPanel("home-action");

  await user.type(screen.getByRole("textbox", { name: "Label" }), "ログイン");

  expect(screen.getByRole("textbox", { name: "Label" })).toHaveProperty(
    "value",
    "ログイン",
  );
});

/*
 * 空欄を「値が無い」と読むのはこのパネルの入力欄の約束事（`valueFrom`）なので、
 * ドメイン側ではなくここで守る。上書きが解けたかは `overridden` の添え書きで見る
 * （入力欄の `value` は、空文字を設定してしまう壊し方でも空のままになる）。
 */
test("インスタンスの公開 prop の入力欄を空にすると上書きが解かれる", async () => {
  const user = setupPanel("home-action");
  await user.type(screen.getByRole("textbox", { name: "Label" }), "ログイン");

  await user.clear(screen.getByRole("textbox", { name: "Label" }));

  expect(screen.queryByText(/overridden/)).toBeNull();
});

test("サイズのモードを fixed にすると長さの入力欄が現れる", async () => {
  const user = setupPanel("home-body");
  expect(screen.queryByRole("spinbutton", { name: "Width" })).toBeNull();

  await user.click(segmentOf("Width Mode", "fixed"));

  expect(screen.getByRole("spinbutton", { name: "Width" })).toBeDefined();
});

test("サイズのモードを fixed から戻すと長さの入力欄が消える", async () => {
  const user = setupPanel("home-body");
  await user.click(segmentOf("Width Mode", "fixed"));

  await user.click(segmentOf("Width Mode", "hug"));

  expect(screen.queryByRole("spinbutton", { name: "Width" })).toBeNull();
});

test("数値入力の prop を書き換えるとその値が入力欄に反映される", async () => {
  const user = setupPanel("home-body");
  await user.click(segmentOf("Width Mode", "fixed"));

  await user.type(screen.getByRole("spinbutton", { name: "Width" }), "240");

  expect(screen.getByRole("spinbutton", { name: "Width" })).toHaveProperty(
    "value",
    "240",
  );
});
