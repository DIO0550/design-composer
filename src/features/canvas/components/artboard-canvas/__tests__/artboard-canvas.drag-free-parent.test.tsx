import { expect, test, vi } from "vitest";
import type { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
} from "@/features/canvas/__tests__/canvas-gesture";
import {
  dragNode,
  dragNodeOnto,
  drawn,
  drawnAt,
  injectedStyles,
  renderCanvas,
  selectionFromArtboards,
} from "./setup";

/**
 * `layout: free` の器の中でのドラッグ（docs/06-ui.md「キャンバス直接操作」の `absolute` の項）。
 *
 * **同じ器で 2 つの経路の答えが違う**（座標の置き直しは落とせる / 並びへは挿せない）ので、
 * 両方をこのファイルに並べる。片方だけを見ると、器を丸ごと候補から外す実装でも通る。
 */

/**
 * `home`（縦積み）の直下に `free` の Box `panel` があり、`panel` の中に絶対配置の
 * `badge`、`home` の直下に絶対配置の `pin` とフローの `title` が並ぶ、未選択の対。
 *
 * `pin` は `panel` へ**外から**運び込む側、`title` は並びへ挿す経路の対照。
 *
 * @returns そのドキュメントと未選択の対
 */
function setupFreeBoxSelection(): DocumentSelection {
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "panel",
            type: "Box",
            props: { layout: "free" },
            children: [
              {
                name: "badge",
                type: "Text",
                props: { content: "3", placement: "absolute", x: 40, y: 24 },
              },
            ],
          },
          {
            name: "pin",
            type: "Text",
            props: { content: "!", placement: "absolute", x: 10, y: 8 },
          },
          { name: "title", type: "Text", props: { content: "ホーム" } },
        ],
      },
    ],
    [],
  );
}

/** 子を並べない artboard の中に、絶対配置の `badge` だけがいる未選択の対。 */
function setupFreeArtboardSelection(): DocumentSelection {
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 240,
        props: { layout: "free" },
        children: [
          {
            name: "badge",
            type: "Text",
            props: { content: "3", placement: "absolute", x: 40, y: 24 },
          },
        ],
      },
    ],
    [],
  );
}

/**
 * `home` の中に `panel` が入れ子で描かれていることにする。
 * `panel` の左上は `home` の左上から (40, 40) ずれた場所にある。
 *
 * このずれを与えないと**原点のずれが 0 になり**、親を取り違えても座標が一致して
 * 落ちない（`setup.tsx` の `drawnAt` の doc）。
 */
function drawnNested(): void {
  drawnAt("home", { left: 100, top: 60, width: 360, height: 240 });
  drawnAt("panel", { left: 140, top: 100, width: 200, height: 120 });
}

test("free の Box の中の絶対配置の子を運ぶと、その Box を親にした座標が届く", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupFreeBoxSelection(), onRepositionNode });
  drawnNested();

  dragNode("badge", { x: 30, y: -12 });

  // 親が外側の `home` へ流れると、2 つの親の左上のずれ (40, 40) のぶん座標もずれる
  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "panel",
    placement: { mode: "absolute", x: 70, y: 12 },
  });
});

test("free の artboard の中の絶対配置の子も、運んで離せる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupFreeArtboardSelection(), onRepositionNode });

  dragNode("badge", { x: 30, y: -12 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 70, y: 12 },
  });
});

test("絶対配置の子を free の Box の上で離すと、その Box へ親が付け替わる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupFreeBoxSelection(), onRepositionNode });
  drawnNested();

  dragNodeOnto("pin", drawn("panel"), { x: 30, y: -12 });

  /*
   * 掴んだ時点 (10, 8) から (30, -12) 運んだ先は `home` 基準で (40, -4)。
   * `panel` の左上は `home` の左上から (40, 40) 右下にあるので、同じ画面上の位置は
   * `panel` 基準では (0, -44) になる。
   */
  expect(onRepositionNode).toHaveBeenCalledWith("pin", {
    parentName: "panel",
    placement: { mode: "absolute", x: 0, y: -44 },
  });
});

test("free の Box の上へ運んでいる間、その Box に落とし先の枠が出る", () => {
  renderCanvas({ selection: setupFreeBoxSelection() });
  drawnNested();

  pressPointer(drawn("pin"), { x: 100, y: 100 });
  movePointer(drawn("panel"), { x: 130, y: 88 });

  expect(injectedStyles()).toContain('[data-name="panel"]{outline:2px dashed');
});

test("free の Box の上へフローのノードを運ぶと、外側の親の並びへ挿さる", () => {
  // 並びへ挿す先は向きの軸上でしか決まらないので、`free` は飛ばして外側が選ばれる
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupFreeBoxSelection(), onMoveNode });
  drawnNested();

  dragNodeOnto("title", drawn("panel"), { x: 30, y: -12 });

  expect(onMoveNode).toHaveBeenCalledWith(
    "title",
    expect.objectContaining({ parentName: "home" }),
  );
});
