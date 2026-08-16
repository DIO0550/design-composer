import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { PropertyPanel } from "../index";

/**
 * 複数選んでいるときの右ペイン（docs/06-ui.md「選択」）。
 *
 * 帯には件数だけを出し、本文には編集欄を出さない。UI 案
 * （docs/Design Composer.html）は複数選択の画面を描いていないので、綴りは最小にしている。
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: DocumentTemplate.Default.components,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "home-login", ref: "primary-button" },
            { name: "home-signup", ref: "primary-button" },
          ],
        },
      ],
    }),
  );
}

/** 同じ部品を指す 2 つのインスタンスを選んだ状態。 */
function setupMultiSelected(): EditorState {
  return Option.unwrap(
    EditorState.selectAllInstances(
      EditorState.select(setupState(), "home-login"),
    ),
  );
}

function renderPanel(state: EditorState) {
  render(
    <PropertyPanel
      state={state}
      instance={{
        goToSource: vi.fn(),
        selectAllInstances: vi.fn(),
        detach: vi.fn(),
      }}
      onEditProp={vi.fn()}
      onClearSelection={vi.fn()}
    />,
  );
}

test("複数選んでいると帯に選択数が出る", () => {
  renderPanel(setupMultiSelected());

  expect(screen.getByRole("heading", { name: "2 selected" })).toBeDefined();
});

test("複数選んでいると帯に1つの名前は出ない", () => {
  renderPanel(setupMultiSelected());

  expect(screen.queryByRole("heading", { name: "home-login" })).toBeNull();
});

test("1つだけ選んでいるときは帯にその名前が出る", () => {
  // 「件数を出す」側の対照。これが無いと、帯を丸ごと消しても上の 2 件は通る
  renderPanel(EditorState.select(setupState(), "home-login"));

  expect(screen.getByRole("heading", { name: "home-login" })).toBeDefined();
});

test("複数選んでいると公開 prop の節が出ない", () => {
  renderPanel(setupMultiSelected());

  expect(screen.queryByRole("heading", { name: "Public props" })).toBeNull();
});

test("1つだけ選んでいるときは公開 prop の節が出る", () => {
  // 上の対照。同じドキュメントで、単一選択なら節が引けることを見る
  renderPanel(EditorState.select(setupState(), "home-login"));

  expect(screen.getByRole("heading", { name: "Public props" })).toBeDefined();
});

test("複数選んでいるとインスタンスの操作が出ない", () => {
  renderPanel(setupMultiSelected());

  expect(screen.queryByRole("button", { name: "Detach instance" })).toBeNull();
});

test("複数選んでいても選択を解除できる", () => {
  renderPanel(setupMultiSelected());

  expect(screen.getByRole("button", { name: "選択を解除" })).toBeDefined();
});
