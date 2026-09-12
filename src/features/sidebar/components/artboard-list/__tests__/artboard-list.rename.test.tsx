import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { nameField } from "@/features/sidebar/__tests__/name-field";
import { spyRenameActions } from "@/features/sidebar/__tests__/rename-actions";
import type { LeftPaneRenameActions } from "@/features/sidebar/types/LeftPaneRenameActions";
import { Option } from "@/utils/Option";
import { ArtboardList } from "../index";

/*
 * artboard の行でその場で名前を打ち替える（docs/06-ui.md「名前の変更」）。
 */

function setupSelection(): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        { name: "home", width: 375, height: 812, children: [] },
        { name: "settings", width: 375, height: 812, children: [] },
      ],
    }),
    [],
  );
}

/**
 * 一覧を描く。
 *
 * @param renaming 名前を編集中のもの
 * @returns 名前の変更の受け口（呼ばれたことを記録する）
 */
function renderList(renaming: Option<string>): LeftPaneRenameActions {
  const renameActions = spyRenameActions();
  render(
    <ArtboardList
      selection={setupSelection()}
      renaming={renaming}
      onSelect={vi.fn()}
      artboardActions={{ add: vi.fn(), reorder: vi.fn() }}
      renameActions={renameActions}
    />,
  );
  return renameActions;
}

test("行をダブルクリックすると、その artboard の名前の編集が始まる", async () => {
  const renameActions = renderList(Option.none);

  await userEvent.dblClick(screen.getByRole("button", { name: "settings" }));

  expect(renameActions.startAt).toHaveBeenCalledWith("settings");
});

test("編集中の行は、今の名前が入った入力欄になる", () => {
  renderList(Option.some("home"));

  expect(nameField().value).toBe("home");
});

test("編集中でない行は名前のままで、入力欄は 1 つだけ出る", () => {
  renderList(Option.some("home"));

  expect(screen.getByRole("button", { name: "settings" })).toBeDefined();
  expect(screen.getAllByRole("textbox")).toHaveLength(1);
});

test("入力欄で打ち替えて Enter を押すと、その名前が伝わる", async () => {
  const renameActions = renderList(Option.some("home"));

  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "top{Enter}");

  expect(renameActions.commit).toHaveBeenCalledWith("top");
});

test("入力欄で Escape を押すと編集が取り消される", async () => {
  const renameActions = renderList(Option.some("home"));

  await userEvent.clear(nameField());
  await userEvent.type(nameField(), "top{Escape}");

  expect(renameActions.cancel).toHaveBeenCalled();
  expect(renameActions.commit).not.toHaveBeenCalled();
});
