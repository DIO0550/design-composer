import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { nameField } from "@/features/editor/features/sidebar/__tests__/name-field";
import { spyRenameActions } from "@/features/editor/features/sidebar/__tests__/rename-actions";
import { Option } from "@/utils/Option";
import { DocumentTree } from "../index";
import { setupSelection } from "./setup";

/*
 * ツリーの行の右クリック（docs/06-ui.md「コンテキストメニュー」の「出る場所はキャンバスと
 * ツリー」）。メニューを出すのは呼び出し側で、ここは押された行と位置を伝えるところまで。
 */

/**
 * ツリーを描く。
 *
 * @param renaming 名前を編集中のもの
 * @returns 右クリックの受け口（呼ばれたことを記録する）
 */
function renderTree(renaming: Option<string>): ReturnType<typeof vi.fn> {
  const onOpenContextMenu = vi.fn();
  render(
    <DocumentTree
      filter={Option.none}
      selection={setupSelection()}
      renaming={renaming}
      onSelect={vi.fn()}
      onOpenContextMenu={onOpenContextMenu}
      onReorder={vi.fn()}
      renameActions={spyRenameActions()}
    />,
  );
  return onOpenContextMenu;
}

test("行を右クリックすると、その行のノードの名前と押した窓の座標が伝わる", () => {
  const onOpenContextMenu = renderTree(Option.none);

  fireEvent.contextMenu(screen.getByRole("button", { name: "lead" }), {
    clientX: 40,
    clientY: 120,
  });

  expect(onOpenContextMenu).toHaveBeenCalledWith("lead", { x: 40, y: 120 });
});

test("行の右クリックはブラウザ既定のメニューを止める", () => {
  renderTree(Option.none);

  const isDefaultKept = fireEvent.contextMenu(
    screen.getByRole("button", { name: "lead" }),
  );

  expect(isDefaultKept).toBe(false);
});

test("名前を編集中の行を右クリックしても伝わらない", () => {
  const onOpenContextMenu = renderTree(Option.some("lead"));

  fireEvent.contextMenu(nameField());

  expect(onOpenContextMenu).not.toHaveBeenCalled();
});

test("名前を編集中の行の右クリックは、切り取り / 貼り付けのために既定のメニューを残す", () => {
  renderTree(Option.some("lead"));

  const isDefaultKept = fireEvent.contextMenu(nameField());

  expect(isDefaultKept).toBe(true);
});
