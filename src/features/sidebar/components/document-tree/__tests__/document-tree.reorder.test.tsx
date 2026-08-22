import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { SelectionState } from "@/domains/selection-state";
import { DocumentTree } from "../index";

/**
 * artboard を 2 枚持たせて、2 枚目を見ている状態で確かめられるようにする。
 * 先頭の `home` を見ていると、親の名前を「先頭の artboard」に取り違えても
 * `DocumentSelection.currentArtboard` の既定と同じ答えになって落ちないため。
 *
 * ボタンの出し分け（端では出さない・兄弟がいなければ出さない）は行を並べる器
 * （`src/components/nested-row-list`）が持つので、そちらで確かめる。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [{ name: "home-title", type: "Text" }],
      },
      {
        name: "settings",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          {
            name: "body",
            type: "Box",
            children: [
              { name: "body-text", type: "Text" },
              { name: "body-action", type: "Text" },
            ],
          },
        ],
      },
    ],
  });
}

function renderTree(): ReturnType<typeof vi.fn> {
  const onReorder = vi.fn();
  render(
    <DocumentTree
      selection={DocumentSelection.create(
        setupDocument(),
        SelectionState.create(["settings"]),
      )}
      onSelect={vi.fn()}
      onReorder={onReorder}
    />,
  );
  return onReorder;
}

test("子を下へ動かすと今見ている artboard の中の1つ後ろの位置へ移す指示が伝わる", async () => {
  const onReorder = renderTree();

  await userEvent.click(screen.getByRole("button", { name: "title を下へ" }));

  expect(onReorder).toHaveBeenCalledWith(
    { parentName: "settings", index: 0 },
    1,
  );
});

/*
 * 器にも「子の行の並べ替えはその親の中の位置として伝わる」がある。ここで重ねて置くのは、
 * 器が見ているのが描画をたどって作る位置なのに対し、こちらが見ているのは
 * `rowFromNode` が Node の木を行の木へ再帰で移すときに親子関係を保っていることだから。
 */
test("孫ノードの並べ替えはその親の中の位置として伝わる", async () => {
  const onReorder = renderTree();

  await userEvent.click(
    screen.getByRole("button", { name: "body-action を上へ" }),
  );

  expect(onReorder).toHaveBeenCalledWith({ parentName: "body", index: 1 }, 0);
});
