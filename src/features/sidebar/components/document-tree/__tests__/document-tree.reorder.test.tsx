import { render } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { dragRowNamed } from "@/components/__tests__/row-drag";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { DocumentTree } from "../index";

/**
 * artboard を 2 枚持たせて、2 枚目を見ている状態で確かめられるようにする。
 * 先頭の `home` を見ていると、親の名前を「先頭の artboard」に取り違えても
 * `DocumentSelection.currentArtboard` の既定と同じ答えになって落ちないため。
 *
 * 落ちる先の決まり方（同じ親の中だけ・掴んだ行の上で離せば何も起きない）は行を
 * 並べる器（`src/components/nested-row-list`）が持つので、そちらで確かめる。
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

function renderTree(): {
  tree: HTMLElement;
  onReorder: ReturnType<typeof vi.fn>;
} {
  const onReorder = vi.fn();
  const { container } = render(
    <DocumentTree
      selection={DocumentSelection.fromNames(setupDocument(), ["settings"])}
      onSelect={vi.fn()}
      onReorder={onReorder}
    />,
  );
  return { tree: container, onReorder };
}

test("子を後ろへ運ぶと今見ている artboard の中の位置として伝わる", () => {
  const { tree, onReorder } = renderTree();

  dragRowNamed(tree, { from: "title", to: "body" });

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
test("孫ノードの並べ替えはその親の中の位置として伝わる", () => {
  const { tree, onReorder } = renderTree();

  dragRowNamed(tree, { from: "body-action", to: "body-text" });

  expect(onReorder).toHaveBeenCalledWith({ parentName: "body", index: 1 }, 0);
});
