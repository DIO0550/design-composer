import { expect, test, vi } from "vitest";
import type { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  dragNodeOnto,
  drawn,
  drawnAt,
  renderCanvas,
  selectionFromArtboards,
} from "./setup";

/** `home` にフローの Text が `title` / `body` / `footer` の順で縦に並ぶ、未選択の対。 */
function setupSelection(): DocumentSelection {
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "title", type: "Text", props: { content: "見出し" } },
          { name: "body", type: "Text", props: { content: "本文" } },
          { name: "footer", type: "Text", props: { content: "脚注" } },
        ],
      },
    ],
    [],
  );
}

/**
 * `home` と、その直下の子が縦に並んで描かれていることにする。
 *
 * 子の中点は `title` が 20、`body` が 50、`footer` が 80。happy-dom の既定（すべて 0）
 * のままだと、どの子の中点もポインタより上になり、落ちる位置が常に末尾になる。
 */
function drawnStacked(): void {
  drawnAt("home", { left: 20, top: 0, width: 360, height: 240 });
  drawnAt("title", { left: 20, top: 10, width: 360, height: 20 });
  drawnAt("body", { left: 20, top: 40, width: 360, height: 20 });
  drawnAt("footer", { left: 20, top: 70, width: 360, height: 20 });
}

test("フローの親の上で離すと、ポインタが中点を越えた子の数の位置に挿さる", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode });
  drawnStacked();

  // 掴んだ (100, 100) から y を 65 戻して 35 で離す。中点を越えているのは `title` だけ
  dragNodeOnto("footer", drawn("home"), { x: 0, y: -65 });

  expect(onMoveNode).toHaveBeenCalledWith("footer", {
    parentName: "home",
    index: 1,
  });
});

test("縦に並ぶ親の上では、挿入線が親の幅いっぱいに引かれる", () => {
  const { getByTestId } = renderCanvas({ selection: setupSelection() });
  drawnStacked();

  pressPointer(drawn("footer"), { x: 100, y: 100 });
  movePointer(drawn("home"), { x: 100, y: 35 });

  const marker = getByTestId("drop-marker");
  expect([marker.style.left, marker.style.width]).toEqual(["20px", "360px"]);
});
