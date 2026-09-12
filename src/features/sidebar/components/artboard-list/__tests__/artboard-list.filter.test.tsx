import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { dragRowNamed } from "@/components/__tests__/row-drag";
import { rowNames } from "@/components/__tests__/row-names";
import { NoMatchMessage } from "@/components/search-field";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { spyRenameActions } from "@/features/sidebar/__tests__/rename-actions";
import { Option } from "@/utils/Option";
import { ArtboardList, type ArtboardListing } from "../index";

/**
 * 絞った並びを渡されたときの出方を見る（docs/06-ui.md「絞り込み」）。
 * 何を残すかを決めるのはパネル側（`layers-panel`）なので、ここでは渡されたものの扱いだけ。
 */
function setupSelection(): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        { name: "login", width: 375, height: 812, children: [] },
        { name: "settings", width: 375, height: 812, children: [] },
      ],
    }),
    [],
  );
}

function renderList(listing: ArtboardListing): {
  container: HTMLElement;
  reorder: ReturnType<typeof vi.fn>;
} {
  const reorder = vi.fn();
  const { container } = render(
    <ArtboardList
      listing={listing}
      selection={setupSelection()}
      renaming={Option.none}
      onSelect={vi.fn()}
      artboardActions={{ add: vi.fn(), reorder }}
      renameActions={spyRenameActions()}
    />,
  );
  return { container, reorder };
}

test("渡された並びの行だけが出る", () => {
  const { container } = renderList({
    artboards: setupSelection().document.artboards.slice(0, 1),
    emptyNotice: NoMatchMessage,
    isReorderable: false,
  });

  expect(rowNames(container)).toEqual(["login"]);
});

test("絞り込んでいる間は行を掴んでも並べ替わらない", () => {
  const { container, reorder } = renderList({
    artboards: setupSelection().document.artboards,
    emptyNotice: NoMatchMessage,
    isReorderable: false,
  });

  dragRowNamed(container, { from: "settings", to: "login" });

  expect(reorder).not.toHaveBeenCalled();
});

test("1 つも無いときは渡された知らせが出る", () => {
  const { container } = renderList({
    artboards: [],
    emptyNotice: NoMatchMessage,
    isReorderable: false,
  });

  expect(container.textContent).toContain(NoMatchMessage);
});
