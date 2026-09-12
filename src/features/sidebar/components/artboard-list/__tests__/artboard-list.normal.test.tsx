import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { currentRowNames, rowNames } from "@/components/__tests__/row-names";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { spyRenameActions } from "@/features/sidebar/__tests__/rename-actions";
import { Option } from "@/utils/Option";
import { ArtboardList } from "../index";

/**
 * artboard 2 枚。ノードは 2 枚目（`settings`）だけに置く。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      { name: "home", width: 360, height: 240, children: [] },
      {
        name: "settings",
        width: 375,
        height: 812,
        children: [{ name: "settings-title", type: "Text" }],
      },
    ],
  });
}

function renderList(selection: DocumentSelection): {
  list: HTMLElement;
  onSelect: ReturnType<typeof vi.fn>;
} {
  const onSelect = vi.fn();
  const { container } = render(
    <ArtboardList
      selection={selection}
      onSelect={onSelect}
      artboardActions={{ add: vi.fn(), reorder: vi.fn() }}
      renaming={Option.none}
      renameActions={spyRenameActions()}
    />,
  );
  return { list: container, onSelect };
}

test("ドキュメントの artboard がファイルに並んでいる順で出る", () => {
  const { list } = renderList(DocumentSelection.fromNames(setupDocument(), []));

  expect(rowNames(list)).toEqual(["home", "settings"]);
});

test("行を押すとその artboard の名前が選択として伝わる", async () => {
  const { onSelect } = renderList(
    DocumentSelection.fromNames(setupDocument(), []),
  );

  await userEvent.click(screen.getByRole("button", { name: "settings" }));

  expect(onSelect).toHaveBeenCalledWith("settings");
});

test("何も選んでいないときは先頭の artboard が今見ている1枚として示される", () => {
  const { list } = renderList(DocumentSelection.fromNames(setupDocument(), []));

  expect(currentRowNames(list)).toEqual(["home"]);
});

test("artboard を選ぶとその artboard が今見ている1枚として示される", () => {
  const { list } = renderList(
    DocumentSelection.fromNames(setupDocument(), ["settings"]),
  );

  expect(currentRowNames(list)).toEqual(["settings"]);
});

test("配下のノードを選んでいるときはそれを載せている artboard が今見ている1枚として示される", () => {
  const { list } = renderList(
    DocumentSelection.fromNames(setupDocument(), ["settings-title"]),
  );

  expect(currentRowNames(list)).toEqual(["settings"]);
});

test("artboard が1枚も無いときはその旨が表示される", () => {
  renderList(
    DocumentSelection.fromNames(DesignDocument.create({ artboards: [] }), []),
  );

  expect(screen.getByText("artboard がありません")).toBeDefined();
});
