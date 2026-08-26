import { fireEvent, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { PropEdit } from "@/domains/dcmp/node";
import { DocumentSelection } from "@/domains/document-selection";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import { drawn, drawnAt, renderCanvas } from "./setup";

/**
 * `home` に、文言を持つ `title`、文言を設定していない `caption`、Box の `panel` が
 * 並ぶ状態（docs/06-ui.md「Text のインライン編集」）。
 */
function setupSelection(
  selectedNames: readonly string[] = [],
): DocumentSelection {
  const designDocument = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "title", type: "Text", props: { content: "ホーム" } },
          { name: "caption", type: "Text" },
          { name: "panel", type: "Box", children: [] },
        ],
      },
    ],
  });
  return DocumentSelection.fromNames(designDocument, selectedNames);
}

/** 画面の (100, 50) に 80x20 で描かれている、という前提。 */
const TitleBounds: CanvasBounds = {
  left: 100,
  top: 50,
  width: 80,
  height: 20,
};

/** 重ねて出ている入力欄。 */
function editor(): HTMLInputElement {
  return screen.getByRole("textbox", { name: "文言を編集" });
}

test("選択中の Text をダブルクリックすると今の文言が入った入力欄が出る", () => {
  renderCanvas({ selection: setupSelection(["title"]) });

  fireEvent.doubleClick(drawn("title"));

  expect(editor().value).toBe("ホーム");
});

test("入力欄は文言が描かれている位置に重なる", () => {
  renderCanvas({ selection: setupSelection(["title"]) });

  fireEvent.doubleClick(drawnAt("title", TitleBounds));

  expect(editor().getAttribute("style")).toContain("left: 100px");
});

test("文言を設定していない Text をダブルクリックすると空の入力欄が出る", () => {
  renderCanvas({ selection: setupSelection(["caption"]) });

  fireEvent.doubleClick(drawn("caption"));

  expect(editor().value).toBe("");
});

test("Text 以外を選択中にダブルクリックしても入力欄は出ない", () => {
  renderCanvas({ selection: setupSelection(["panel"]) });

  fireEvent.doubleClick(drawn("panel"));

  expect(screen.queryByRole("textbox")).toBeNull();
});

test("選択中の Text から離れたところをダブルクリックしても入力欄は出ない", () => {
  renderCanvas({ selection: setupSelection(["title"]) });

  fireEvent.doubleClick(drawn("panel"));

  expect(screen.queryByRole("textbox")).toBeNull();
});

test("何も選択していなければダブルクリックしても入力欄は出ない", () => {
  renderCanvas({ selection: setupSelection() });

  fireEvent.doubleClick(drawn("title"));

  expect(screen.queryByRole("textbox")).toBeNull();
});

test("書き換えて Enter を押すと、その文言が content の編集として通知される", () => {
  const onEditProp = vi.fn();
  renderCanvas({ selection: setupSelection(["title"]), onEditProp });
  fireEvent.doubleClick(drawn("title"));

  fireEvent.change(editor(), { target: { value: "トップ" } });
  fireEvent.keyDown(editor(), { key: "Enter" });

  expect(onEditProp).toHaveBeenCalledWith(PropEdit.set(["content"], "トップ"));
});

test("確定すると入力欄は消える", () => {
  renderCanvas({ selection: setupSelection(["title"]) });
  fireEvent.doubleClick(drawn("title"));

  fireEvent.keyDown(editor(), { key: "Enter" });

  expect(screen.queryByRole("textbox")).toBeNull();
});

test("書き換えてフォーカスを外すと、その文言が content の編集として通知される", () => {
  const onEditProp = vi.fn();
  renderCanvas({ selection: setupSelection(["title"]), onEditProp });
  fireEvent.doubleClick(drawn("title"));

  fireEvent.change(editor(), { target: { value: "トップ" } });
  fireEvent.blur(editor());

  expect(onEditProp).toHaveBeenCalledWith(PropEdit.set(["content"], "トップ"));
});

test("書き換えて Escape を押すと文言は変わらない", () => {
  const onEditProp = vi.fn();
  renderCanvas({ selection: setupSelection(["title"]), onEditProp });
  fireEvent.doubleClick(drawn("title"));

  fireEvent.change(editor(), { target: { value: "トップ" } });
  fireEvent.keyDown(editor(), { key: "Escape" });

  expect(onEditProp).not.toHaveBeenCalled();
});

test("Escape で取り消すと入力欄は消える", () => {
  renderCanvas({ selection: setupSelection(["title"]) });
  fireEvent.doubleClick(drawn("title"));

  fireEvent.keyDown(editor(), { key: "Escape" });

  expect(screen.queryByRole("textbox")).toBeNull();
});

test("取り消したあとにダブルクリックすると元の文言から編集し直せる", () => {
  renderCanvas({ selection: setupSelection(["title"]) });
  fireEvent.doubleClick(drawn("title"));
  fireEvent.change(editor(), { target: { value: "トップ" } });
  fireEvent.keyDown(editor(), { key: "Escape" });

  fireEvent.doubleClick(drawn("title"));

  expect(editor().value).toBe("ホーム");
});
