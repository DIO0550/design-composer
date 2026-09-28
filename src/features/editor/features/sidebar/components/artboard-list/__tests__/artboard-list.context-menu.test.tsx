import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { nameField } from "@/features/editor/features/sidebar/__tests__/name-field";
import { spyRenameActions } from "@/features/editor/features/sidebar/__tests__/rename-actions";
import { Option } from "@/utils/Option";
import { ArtboardList, ArtboardListing } from "../index";
import { setupSelection } from "./setup";

/*
 * `Artboards` の行の右クリック（docs/06-ui.md「コンテキストメニュー」の「出る場所は
 * キャンバスとツリー」）。メニューを出すのは呼び出し側で、ここは押された行と位置を
 * 伝えるところまで。
 */

/**
 * 一覧を描く。
 *
 * @param renaming 名前を編集中のもの
 * @returns 右クリックの受け口（呼ばれたことを記録する）
 */
function renderList(renaming: Option<string>): ReturnType<typeof vi.fn> {
  const onOpenContextMenu = vi.fn();
  const selection = setupSelection();
  render(
    <ArtboardList
      listing={ArtboardListing.full(selection.document.artboards)}
      selection={selection}
      renaming={renaming}
      onSelect={vi.fn()}
      onOpenContextMenu={onOpenContextMenu}
      artboardActions={{ add: vi.fn(), reorder: vi.fn() }}
      renameActions={spyRenameActions()}
    />,
  );
  return onOpenContextMenu;
}

test("行を右クリックすると、その artboard の名前と押した窓の座標が伝わる", () => {
  const onOpenContextMenu = renderList(Option.none);

  fireEvent.contextMenu(screen.getByRole("button", { name: "settings" }), {
    clientX: 40,
    clientY: 120,
  });

  expect(onOpenContextMenu).toHaveBeenCalledWith("settings", {
    x: 40,
    y: 120,
  });
});

test("行の右クリックはブラウザ既定のメニューを止める", () => {
  renderList(Option.none);

  const isDefaultKept = fireEvent.contextMenu(
    screen.getByRole("button", { name: "settings" }),
  );

  expect(isDefaultKept).toBe(false);
});

test("名前を編集中の行を右クリックしても伝わらない", () => {
  const onOpenContextMenu = renderList(Option.some("settings"));

  fireEvent.contextMenu(nameField());

  expect(onOpenContextMenu).not.toHaveBeenCalled();
});

test("名前を編集中の行の右クリックは、切り取り / 貼り付けのために既定のメニューを残す", () => {
  renderList(Option.some("settings"));

  const isDefaultKept = fireEvent.contextMenu(nameField());

  expect(isDefaultKept).toBe(true);
});
