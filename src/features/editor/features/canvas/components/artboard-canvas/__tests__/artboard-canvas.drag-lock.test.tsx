import { expect, test, vi } from "vitest";
import type { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  dragNodeOnto,
  drawn,
  injectedStyles,
  renderCanvas,
  selectionFromArtboards,
} from "./setup";

/*
 * ロックした Box の中へはキャンバスのドラッグで入れられないこと（docs/03-schema.md「ロック」/
 * docs/06-ui.md「キャンバス直接操作」）。
 */

/**
 * `home` の直下に、フローの Text `title`、絶対配置の Text `pin`、Box の `panel` が並び、
 * `panel` の中にロックした Box `sealed`、その中に空の Box `inner` がある、未選択の対。
 *
 * @returns そのドキュメントと未選択の対
 */
function setupSelection(): DocumentSelection {
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "title", type: "Text", props: { content: "ホーム" } },
          {
            name: "pin",
            type: "Text",
            props: { content: "!", placement: "absolute", x: 10, y: 8 },
          },
          {
            name: "panel",
            type: "Box",
            children: [
              {
                name: "sealed",
                type: "Box",
                props: { locking: "locked" },
                children: [{ name: "inner", type: "Box", children: [] }],
              },
            ],
          },
        ],
      },
    ],
    [],
  );
}

test("フローのノードをロックの中の Box の上で離すと、ロックの外側の Box の子になる", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode });

  dragNodeOnto("title", drawn("inner"), { x: 30, y: 40 });

  expect(onMoveNode).toHaveBeenCalledWith(
    "title",
    expect.objectContaining({ parentName: "panel" }),
  );
});

test("絶対配置のノードをロックの中の Box の上で離すと、ロックの外側の Box へ親が付け替わる", () => {
  const onRepositionNodes = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNodes });

  dragNodeOnto("pin", drawn("inner"), { x: 30, y: 40 });

  expect(onRepositionNodes).toHaveBeenCalledWith([
    expect.objectContaining({
      name: "pin",
      edit: expect.objectContaining({
        to: expect.objectContaining({ parentName: "panel" }),
      }),
    }),
  ]);
});

test("ロックの中の Box の上へ運んでいる間、落とし先の枠はロックの外側の Box に出る", () => {
  renderCanvas({ selection: setupSelection() });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(drawn("inner"), { x: 130, y: 140 });

  expect(injectedStyles()).toContain('[data-name="panel"]{outline:2px dashed');
});
