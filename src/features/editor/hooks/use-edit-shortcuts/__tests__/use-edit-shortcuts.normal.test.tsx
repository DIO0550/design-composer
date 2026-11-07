import { act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { DocumentSelection } from "@/domains/session/document-selection";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { setup } from "./setup";

/*
 * 編集操作の割り当てが、それぞれの操作へ届くことを確かめる（docs/06-ui.md「編集操作の一覧」）。
 * どの組み合わせを割り当てるかは各ショートカットのフックで確かめているので、ここでは
 * 割り当てごとに届く先だけを見る。
 */

test("Delete を押すと、選んでいるノードが消える", async () => {
  const user = userEvent.setup();
  const { current } = setup(["title"]);

  await user.keyboard("{Delete}");

  expect(
    DesignDocument.findNode(
      EditorState.document(current().editor.state),
      "title",
    ),
  ).toEqual(Option.none);
});

test("Ctrl+C を押すと、選んでいるものがコピーされ、別の Box を選んで貼れる", async () => {
  const user = userEvent.setup();
  const { current } = setup(["title"]);

  await user.keyboard("{Control>}c{/Control}");
  act(() => current().editor.dispatch({ type: "select", name: "panel" }));
  act(() => current().editor.dispatch({ type: "paste_copied" }));

  expect(
    DesignDocument.findChildPosition(
      EditorState.document(current().editor.state),
      "title-2",
    ),
  ).toEqual(Option.some({ parentName: "panel", index: 1 }));
});

test("Ctrl+V を押すと、コピー済みのものが選んでいる Box へ貼られる", async () => {
  const user = userEvent.setup();
  const { current } = setup([]);
  act(() => current().editor.dispatch({ type: "select", name: "title" }));
  act(() => current().editor.dispatch({ type: "copy_selected" }));
  act(() => current().editor.dispatch({ type: "select", name: "panel" }));

  await user.keyboard("{Control>}v{/Control}");

  expect(
    DesignDocument.findChildPosition(
      EditorState.document(current().editor.state),
      "title-2",
    ),
  ).toEqual(Option.some({ parentName: "panel", index: 1 }));
});

test("Ctrl+D を押すと、選んでいるものの複製が直後へ挿される", async () => {
  const user = userEvent.setup();
  const { current } = setup(["title"]);

  await user.keyboard("{Control>}d{/Control}");

  expect(
    DesignDocument.findChildPosition(
      EditorState.document(current().editor.state),
      "title-2",
    ),
  ).toEqual(Option.some({ parentName: "home", index: 1 }));
});

test("Ctrl+Z を押すと、直前の編集が取り消される", async () => {
  const user = userEvent.setup();
  const { current } = setup(["title"]);
  act(() => current().editor.dispatch({ type: "remove_selected" }));

  await user.keyboard("{Control>}z{/Control}");

  expect(
    DesignDocument.findChildPosition(
      EditorState.document(current().editor.state),
      "title",
    ),
  ).toEqual(Option.some({ parentName: "home", index: 0 }));
});

test("Ctrl+Shift+Z を押すと、取り消した編集がやり直される", async () => {
  const user = userEvent.setup();
  const { current } = setup(["title"]);
  act(() => current().editor.dispatch({ type: "remove_selected" }));
  act(() => current().editor.dispatch({ type: "undo" }));

  await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");

  expect(
    DesignDocument.findNode(
      EditorState.document(current().editor.state),
      "title",
    ),
  ).toEqual(Option.none);
});

test("Escape を押すと、ドキュメントを変えずに選択だけが外れる", async () => {
  const user = userEvent.setup();
  const { current } = setup(["title"]);

  await user.keyboard("{Escape}");

  const { state } = current().editor;
  expect({
    selected: DocumentSelection.names(EditorState.documentSelection(state)),
    title: DesignDocument.findChildPosition(
      EditorState.document(state),
      "title",
    ),
  }).toEqual({
    selected: [],
    title: Option.some({ parentName: "home", index: 0 }),
  });
});

test("Ctrl+] を押すと、選んでいるノードが兄弟の並びで前面へ 1 つ動く", async () => {
  const user = userEvent.setup();
  const { current } = setup(["panel"]);

  await user.keyboard("{Control>}]{/Control}");

  expect(
    DesignDocument.findChildPosition(
      EditorState.document(current().editor.state),
      "panel",
    ),
  ).toEqual(Option.some({ parentName: "home", index: 3 }));
});

test("→ を押すと、選んでいる絶対配置のノードが右へ 1 ずれる", async () => {
  const user = userEvent.setup();
  const { current } = setup(["footer"]);

  await user.keyboard("{ArrowRight}");

  const footer = Option.unwrap(
    DesignDocument.findNode(
      EditorState.document(current().editor.state),
      "footer",
    ),
  );
  expect(Node.writtenPropsOf(footer).x).toBe(41);
});

test("Ctrl+R を押すと、選んでいるものの名前の編集に入る", async () => {
  const user = userEvent.setup();
  const { current } = setup(["title"]);

  await user.keyboard("{Control>}r{/Control}");

  expect(EditorState.renamingName(current().editor.state)).toEqual(
    Option.some("title"),
  );
});

test("Ctrl+G を押すと、選んでいるノードが新しい Box の中へ入る", async () => {
  const user = userEvent.setup();
  const { current } = setup(["title", "panel"]);

  await user.keyboard("{Control>}g{/Control}");

  const document = EditorState.document(current().editor.state);
  const parentName = Option.unwrap(
    DesignDocument.findChildPosition(document, "title"),
  ).parentName;
  expect(
    Option.unwrap(DesignDocument.findNode(document, parentName)),
  ).toMatchObject({ type: "Box" });
});

test("Ctrl+Shift+G を押すと、選んでいる Box が外れて子が親へ戻る", async () => {
  const user = userEvent.setup();
  const { current } = setup(["title", "panel"]);
  act(() => current().editor.dispatch({ type: "group_selected" }));

  await user.keyboard("{Control>}{Shift>}g{/Shift}{/Control}");

  expect(
    DesignDocument.findChildPosition(
      EditorState.document(current().editor.state),
      "title",
    ),
  ).toEqual(Option.some({ parentName: "home", index: 1 }));
});
