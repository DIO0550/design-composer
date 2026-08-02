import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { DocumentTree } from "../index";

function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
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
            { name: "footer", type: "Text" },
          ],
        },
        {
          name: "settings",
          width: 375,
          height: 812,
          children: [{ name: "settings-title", type: "Text" }],
        },
      ],
    }),
  );
}

function renderTree(): ReturnType<typeof vi.fn> {
  const onReorder = vi.fn();
  render(
    <DocumentTree
      state={setupState()}
      onSelect={vi.fn()}
      onReorder={onReorder}
    />,
  );
  return onReorder;
}

test("子を上へ動かすと同じ親の中の1つ前の位置へ移す指示が伝わる", async () => {
  const onReorder = renderTree();

  await userEvent.click(screen.getByRole("button", { name: "body を上へ" }));

  expect(onReorder).toHaveBeenCalledWith({ parentName: "home", index: 1 }, 0);
});

test("子を下へ動かすと同じ親の中の1つ後ろの位置へ移す指示が伝わる", async () => {
  const onReorder = renderTree();

  await userEvent.click(screen.getByRole("button", { name: "title を下へ" }));

  expect(onReorder).toHaveBeenCalledWith({ parentName: "home", index: 0 }, 1);
});

test("孫ノードの並べ替えはその親の中の位置として伝わる", async () => {
  const onReorder = renderTree();

  await userEvent.click(
    screen.getByRole("button", { name: "body-action を上へ" }),
  );

  expect(onReorder).toHaveBeenCalledWith({ parentName: "body", index: 1 }, 0);
});

test("並びの先頭の子には上へ動かすボタンが出ない", () => {
  renderTree();

  expect(screen.queryByRole("button", { name: "title を上へ" })).toBeNull();
});

test("並びの末尾の子には下へ動かすボタンが出ない", () => {
  renderTree();

  expect(screen.queryByRole("button", { name: "footer を下へ" })).toBeNull();
});

test("子が1つだけの親では並べ替えボタンが出ない", () => {
  renderTree();

  expect(
    screen.queryByRole("button", { name: /^settings-title を/ }),
  ).toBeNull();
});

test("artboard には並べ替えボタンが出ない", () => {
  renderTree();

  expect(screen.queryByRole("button", { name: /^home を/ })).toBeNull();
});
