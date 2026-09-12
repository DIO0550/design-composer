import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import {
  enterPointer,
  pressPointer,
  releasePointer,
} from "@/components/__tests__/pointer-gesture";
import { rowOf } from "@/components/__tests__/row-drag";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { nameField } from "@/features/sidebar/__tests__/name-field";
import { spyRenameActions } from "@/features/sidebar/__tests__/rename-actions";
import type { LeftPaneRenameActions } from "@/features/sidebar/types/LeftPaneRenameActions";
import { Option } from "@/utils/Option";
import { DocumentTree } from "../index";

/*
 * ツリーの行でその場で名前を打ち替える（docs/06-ui.md「名前の変更」）。
 */

function setupSelection(): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "title", type: "Text" },
            { name: "lead", type: "Text" },
          ],
        },
      ],
    }),
    [],
  );
}

/**
 * ツリーを描く。
 *
 * @param renaming 名前を編集中のもの
 * @returns 名前の変更の受け口（呼ばれたことを記録する）
 */
function renderTree(renaming: Option<string>): LeftPaneRenameActions {
  return renderTreeWithReorder(renaming).renameActions;
}

/**
 * ツリーを描く。並べ替えの受け口も返す。
 *
 * @param renaming 名前を編集中のもの
 * @returns 名前の変更と並べ替えの受け口、行が並んでいる領域
 */
function renderTreeWithReorder(renaming: Option<string>): {
  renameActions: LeftPaneRenameActions;
  onReorder: ReturnType<typeof vi.fn>;
  tree: HTMLElement;
} {
  const renameActions = spyRenameActions();
  const onReorder = vi.fn();
  const { container } = render(
    <DocumentTree
      selection={setupSelection()}
      renaming={renaming}
      onSelect={vi.fn()}
      onReorder={onReorder}
      renameActions={renameActions}
    />,
  );
  return { renameActions, onReorder, tree: container };
}

test("行をダブルクリックすると、その行の名前の編集が始まる", async () => {
  const renameActions = renderTree(Option.none);

  await userEvent.dblClick(screen.getByRole("button", { name: "lead" }));

  expect(renameActions.startAt).toHaveBeenCalledWith("lead");
});

test("編集中の行は、今の名前が入った入力欄になる", () => {
  renderTree(Option.some("title"));

  expect(nameField().value).toBe("title");
});

test("入力欄は開いた時点で打てる", () => {
  renderTree(Option.some("title"));

  expect(document.activeElement).toBe(nameField());
});

test("編集中でない行は名前のままで、入力欄は 1 つだけ出る", () => {
  renderTree(Option.some("title"));

  expect(screen.getByRole("button", { name: "lead" })).toBeDefined();
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
});

test("入力欄で打ち替えて Enter を押すと、その名前が伝わる", async () => {
  const renameActions = renderTree(Option.some("title"));

  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "caption{Enter}");

  expect(renameActions.commit).toHaveBeenCalledWith("caption");
});

test("開いた時点で名前が選ばれているので、そのまま打つと置き換わる", async () => {
  const renameActions = renderTree(Option.some("title"));

  await userEvent.keyboard("x{Enter}");

  expect(renameActions.commit).toHaveBeenCalledWith("x");
});

test("入力欄で Escape を押すと編集が取り消される", async () => {
  const renameActions = renderTree(Option.some("title"));

  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "caption{Escape}");

  expect(renameActions.cancel).toHaveBeenCalled();
  expect(renameActions.commit).not.toHaveBeenCalled();
});

test("打ち替えずに Enter を押すと、確定ではなく取り消しになる", async () => {
  const renameActions = renderTree(Option.some("title"));

  await userEvent.type(nameField(), "{Enter}");

  expect(renameActions.cancel).toHaveBeenCalled();
  expect(renameActions.commit).not.toHaveBeenCalled();
});

test("打ち替えてフォーカスを外すと、終える側へ伝わる", async () => {
  const renameActions = renderTree(Option.some("title"));

  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "caption");
  await userEvent.tab();

  expect(renameActions.finish).toHaveBeenCalledWith("caption");
  expect(renameActions.commit).not.toHaveBeenCalled();
});

test("名前の入力欄を掴んで別の行の上で離しても、並べ替えは起きない", () => {
  const { onReorder, tree } = renderTreeWithReorder(Option.some("title"));

  pressPointer(nameField(), { x: 0, y: 0 });
  enterPointer(rowOf(tree, "lead"));
  releasePointer(rowOf(tree, "lead"), { x: 0, y: 0 });

  expect(onReorder).not.toHaveBeenCalled();
});
