import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { TokenList } from "../index";

const NOOP = () => {};

/** 5 種別すべてに 1 件ずつ持つドキュメントの編集状態。 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: {
        colors: { primary: "#3b82f6" },
        spacing: { lg: 24 },
        radius: { md: 8 },
        shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
        typography: {
          body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
        },
      },
    }),
  );
}

function renderList(state: EditorState = setupState()) {
  render(<TokenList state={state} onSelectToken={NOOP} onAddToken={NOOP} />);
}

test("5種別すべての見出しが件数付きで並ぶ", () => {
  renderList();

  for (const kind of ["colors", "spacing", "radius", "shadows", "typography"]) {
    expect(
      screen.getByRole("button", { name: new RegExp(`^${kind} 1$`) }),
    ).toBeDefined();
  }
});

test("開いた直後は最初の種別だけが開いている", () => {
  renderList();

  expect(screen.getByText("primary")).toBeDefined();
  expect(screen.queryByText("lg")).toBeNull();
});

test("見出しを押すとその種別の中身が開く", async () => {
  const user = userEvent.setup();
  renderList();

  await user.click(screen.getByRole("button", { name: /^spacing 1$/ }));

  expect(screen.getByText("24px")).toBeDefined();
});

test("色の行には hex が出る", () => {
  renderList();

  expect(screen.getByText("#3b82f6")).toBeDefined();
});

test("値が1つの値で表せる種別には追加ボタンが出る", () => {
  renderList();

  expect(
    screen.getByRole("button", { name: "colors にトークンを追加" }),
  ).toBeDefined();
});

test("複合オブジェクトの種別には追加ボタンを出さない", async () => {
  const user = userEvent.setup();
  renderList();

  await user.click(screen.getByRole("button", { name: /^shadows 1$/ }));

  expect(
    screen.queryByRole("button", { name: "shadows にトークンを追加" }),
  ).toBeNull();
});

test("複合オブジェクトの種別の行は押せる形にしない", async () => {
  const user = userEvent.setup();
  renderList();

  await user.click(screen.getByRole("button", { name: /^typography 1$/ }));

  expect(screen.getByText("body")).toBeDefined();
  expect(screen.queryByRole("button", { name: /body/ })).toBeNull();
});

test("選択中のトークンの行が選択済みとして示される", () => {
  renderList(
    EditorState.selectToken(setupState(), { kind: "colors", name: "primary" }),
  );

  expect(
    screen
      .getByRole("button", { name: /primary/ })
      .getAttribute("aria-current"),
  ).toBe("true");
});

test("同じ名前でも種別が違えば選択済みにならない", async () => {
  const user = userEvent.setup();
  renderList(
    EditorState.selectToken(setupState(), { kind: "shadows", name: "sm" }),
  );

  await user.click(screen.getByRole("button", { name: /^radius 1$/ }));

  expect(
    screen.getByRole("button", { name: /md/ }).getAttribute("aria-current"),
  ).toBe("false");
});
