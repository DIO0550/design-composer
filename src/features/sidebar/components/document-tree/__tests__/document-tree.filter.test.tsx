import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { dragRowNamed } from "@/components/__tests__/row-drag";
import { rowNames } from "@/components/__tests__/row-names";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { NameFilter } from "@/domains/session/name-filter";
import { spyRenameActions } from "@/features/sidebar/__tests__/rename-actions";
import { Option } from "@/utils/Option";
import { DocumentTree } from "../index";

/**
 * 絞り込みで何が残るかを見る（docs/06-ui.md「絞り込み」）。
 *
 * `login-form` の下に `title` と `email-field`（さらにその下に `email-label`）を置いて、
 * 一致したノード・その祖先・一致しない子の 3 つを 1 本の枝で見分けられるようにする。
 * `header` は同じ artboard の中で一致しない側の対照。
 */
function setupSelection(): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        {
          name: "login",
          width: 375,
          height: 812,
          children: [
            {
              name: "login-form",
              type: "Box",
              children: [
                { name: "title", type: "Text" },
                {
                  name: "email-field",
                  type: "Box",
                  children: [{ name: "email-label", type: "Text" }],
                },
              ],
            },
            { name: "header", type: "Box" },
          ],
        },
      ],
    }),
    [],
  );
}

function tree(query: string) {
  return (
    <DocumentTree
      filter={NameFilter.create(query)}
      selection={setupSelection()}
      onSelect={vi.fn()}
      onReorder={vi.fn()}
      renaming={Option.none}
      renameActions={spyRenameActions()}
    />
  );
}

function renderTree(query: string): HTMLElement {
  return render(tree(query)).container;
}

test("検索語に一致するノードと、その祖先だけが行として残る", () => {
  const container = renderTree("email-label");

  expect(rowNames(container)).toEqual([
    "login-form",
    "email-field",
    "email-label",
  ]);
});

test("一致したノードの子は、一致していなければ残らない", () => {
  const container = renderTree("email-field");

  expect(rowNames(container)).toEqual(["login-form", "email-field"]);
});

test("畳んでいる枝の中の一致も出る", async () => {
  const { container, rerender } = render(tree(""));
  await userEvent.click(
    screen.getByRole("button", { name: "login-form の開閉" }),
  );

  rerender(tree("title"));

  expect(rowNames(container)).toEqual(["login-form", "title"]);
});

test("絞り込みを消すと、畳んでいた枝は畳まれたまま戻る", async () => {
  const { container, rerender } = render(tree(""));
  await userEvent.click(
    screen.getByRole("button", { name: "login-form の開閉" }),
  );
  rerender(tree("title"));

  rerender(tree(""));

  expect(rowNames(container)).toEqual(["login-form", "header"]);
});

test("今見ている artboard の中に一致が無ければ行が 0 になる", () => {
  const container = renderTree("settings");

  expect(rowNames(container)).toEqual([]);
});

test("行が 0 でも節の見出しと artboard 名は残る", () => {
  renderTree("settings");

  expect(screen.getByText("Layers")).toBeDefined();
  expect(screen.getByText("login")).toBeDefined();
});

test("絞り込んでいる間は行を掴んでも並べ替わらない", () => {
  const onReorder = vi.fn();
  const { container } = render(
    <DocumentTree
      filter={NameFilter.create("e")}
      selection={setupSelection()}
      onSelect={vi.fn()}
      onReorder={onReorder}
      renaming={Option.none}
      renameActions={spyRenameActions()}
    />,
  );

  // 同じ親の中の 2 行で掴む。別の親の行の上で離しても、絞り込みに依らず並べ替えは起きない
  dragRowNamed(container, { from: "login-form", to: "header" });

  expect(onReorder).not.toHaveBeenCalled();
});

/*
 * 三角を出したままにすると、押しても見た目が変わらないのに畳んだ側の名前だけが書き換わり、
 * 絞り込みを解いたときに元と違う畳み方で現れる（docs/06-ui.md「絞り込み」は畳んだ状態
 * そのものは書き換えないと定めている）。
 */
test("絞り込んでいる間は枝の開閉の三角が出ない", () => {
  renderTree("email-label");

  expect(
    screen.queryByRole("button", { name: "login-form の開閉" }),
  ).toBeNull();
});
