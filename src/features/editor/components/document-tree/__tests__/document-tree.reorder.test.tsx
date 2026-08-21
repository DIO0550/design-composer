import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { DocumentTree } from "../index";

/**
 * artboard を 2 枚持たせて、2 枚目を見ている状態で確かめられるようにする。
 * 先頭の `home` を見ていると、親の名前を「先頭の artboard」に取り違えても
 * `EditorState.currentArtboard` の既定と同じ答えになって落ちないため。
 *
 * ボタンの出し分け（端では出さない・兄弟がいなければ出さない）は行を並べる器
 * （`src/components/nested-row-list`）が持つので、そちらで確かめる。
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
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
    }),
  );
}

function renderTree(): ReturnType<typeof vi.fn> {
  const onReorder = vi.fn();
  render(
    <DocumentTree
      state={EditorState.select(setupState(), "settings")}
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

test("孫ノードの並べ替えはその親の中の位置として伝わる", async () => {
  const onReorder = renderTree();

  await userEvent.click(
    screen.getByRole("button", { name: "body-action を上へ" }),
  );

  expect(onReorder).toHaveBeenCalledWith({ parentName: "body", index: 1 }, 0);
});
