import { expect, test, vi } from "vitest";
import type { DocumentSelection } from "@/domains/session/document-selection";
import { canvasSurface } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  wheel,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  artboardList,
  carryNode,
  dragNode,
  dragNodeOnto,
  drawn,
  drawnAt,
  drawnTurnedAt,
  injectedStyles,
  previewRule,
  renderCanvas,
  selectionFromArtboards,
} from "./setup";

/*
 * 祖先だけが回っているノードの座標の置き直し（docs/06-ui.md「キャンバス直接操作」の座標の
 * 置き直し）。座標は親の座標（回る前の左上が原点・親の向きで測る）で書かれ、画面上では
 * ポインタが動いた向き・量だけ動く。
 *
 * 運ぶ量は縦横の片方だけにする。90 度回った親の中では画面の左が親の座標の y の正の向きに
 * なるので、戻し忘れると x と y が入れ替わって落ちる。
 */

/**
 * `home` の直下に `rotation` だけ回った Box `frame` と絶対配置の `pin` があり、`frame` の
 * 中に絶対配置の `chip` と、寄せ先の兄弟 `peg` が並ぶ。`chip` を選んだ対。
 *
 * `nested` なら `chip` の代わりに `dot` を置き、`frame` との間に回っていない Box `inset`
 * を挟む（`inset` は `frame` と同じ位置・大きさ）。
 *
 * @param rotation `frame` の向き（度）
 * @param nested 運ぶノードを回っていない Box で包むか
 * @returns そのドキュメントと、運ぶノードを選んだ対
 */
function setupTurnedFrame(rotation: number, nested = false): DocumentSelection {
  const carried = {
    name: nested ? "dot" : "chip",
    type: "Text",
    props: { content: "c", placement: "absolute", x: 10, y: 10 },
  };
  const peg = {
    name: "peg",
    type: "Text",
    props: { content: "p", placement: "absolute", x: 150, y: 60 },
  };
  const inset = {
    name: "inset",
    type: "Box",
    props: { placement: "absolute", x: 0, y: 0, width: 200, height: 100 },
    children: [carried],
  };
  const frameChildren = nested ? [inset, peg] : [carried, peg];
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "frame",
            type: "Box",
            props: {
              placement: "absolute",
              x: 100,
              y: 50,
              width: 200,
              height: 100,
              rotation,
            },
            children: frameChildren,
          },
          {
            name: "pin",
            type: "Text",
            props: { content: "x", placement: "absolute", x: 20, y: 150 },
          },
        ],
      },
    ],
    [carried.name],
  );
}

/**
 * `setupTurnedFrame(90)` を等倍で描く。
 *
 * `frame` は回る前の (200, 110) 200x100 を中心 (300, 160) のまま縦に立てた矩形。`chip`
 * （`nested` なら `dot`）は回る前の (210, 120) 20x12 の中心を `frame` の中心まわりに回した
 * (334, 80) に縦に立ち、`peg` も同じ規則で中心 (284, 220) に立つ。
 *
 * @param nested `setupTurnedFrame` と同じ
 */
function drawnTurnedFrame(nested = false): void {
  drawnAt("home", { left: 100, top: 60, width: 360, height: 240 });
  const frameDrawn = { left: 250, top: 60, width: 100, height: 200 };
  drawnTurnedAt("frame", frameDrawn, { width: 200, height: 100 });
  if (nested) {
    drawnTurnedAt("inset", frameDrawn, { width: 200, height: 100 });
  }
  drawnTurnedAt(
    nested ? "dot" : "chip",
    { left: 328, top: 70, width: 12, height: 20 },
    { width: 20, height: 12 },
  );
  drawnTurnedAt(
    "peg",
    { left: 278, top: 210, width: 12, height: 20 },
    { width: 20, height: 12 },
  );
  drawnAt("pin", { left: 120, top: 210, width: 20, height: 12 });
}

/**
 * `setupTurnedFrame(rotation)` を、`frame` が回っていないのと同じ形で描く（360 度の倍数の
 * 対照）。
 */
function drawnUprightFrame(): void {
  drawnAt("home", { left: 100, top: 60, width: 360, height: 240 });
  drawnAt("frame", { left: 200, top: 110, width: 200, height: 100 });
  drawnAt("chip", { left: 210, top: 120, width: 20, height: 12 });
  drawnAt("peg", { left: 350, top: 170, width: 20, height: 12 });
  drawnAt("pin", { left: 120, top: 210, width: 20, height: 12 });
}

test("90 度回った Box の中の回っていないノードを画面上で左へ運ぶと、親の座標で y が運んだ量だけ増えた座標が書かれる", () => {
  // 運んだ量を親の向きへ戻さないと (3, 10) になる
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupTurnedFrame(90), onRepositionNode });
  drawnTurnedFrame();

  dragNode("chip", { x: -7, y: 0 });

  expect(onRepositionNode).toHaveBeenCalledWith("chip", {
    parentName: "frame",
    placement: { mode: "absolute", x: 10, y: 17 },
  });
});

test("90 度回った Box の中のノードを運んでいる間、ずらして見せる量は親の向きへ戻した量になる", () => {
  // ずらし量は親と一緒に回って効くので、戻さないと画面上では上へずれて見える
  renderCanvas({ selection: setupTurnedFrame(90) });
  drawnTurnedFrame();

  carryNode("chip", { x: -7, y: 0 });

  expect(injectedStyles()).toContain(previewRule("chip", { x: 0, y: 7 }));
});

test("90 度回った Box の中のノードを落とせる親が無い場所へ運んでも、ずらして見せる量は親の向きへ戻した量になる", () => {
  renderCanvas({ selection: setupTurnedFrame(90) });
  drawnTurnedFrame();

  carryNode("chip", { x: -7, y: 0 });
  movePointer(artboardList(), { x: 93, y: 100 });

  expect(injectedStyles()).toContain(previewRule("chip", { x: 0, y: 7 }));
});

test("外接矩形の右辺が、90 度回った親の外接矩形の右辺に近づくと、親の座標で y が 0 の位置へ寄る", () => {
  /*
   * 外接矩形の右辺は 340 + 8 = 348 で、`frame` の右辺 350 へ 2 寄る。画面上で右へ 10 運んだ
   * ことになり、親の向きへ戻すと y が 10 減る
   */
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupTurnedFrame(90), onRepositionNode });
  drawnTurnedFrame();

  dragNode("chip", { x: 8, y: 0 });

  expect(onRepositionNode).toHaveBeenCalledWith("chip", {
    parentName: "frame",
    placement: { mode: "absolute", x: 10, y: 0 },
  });
});

test("⌘ / Ctrl を押しながら 90 度回った親の中で同じ量運ぶと寄らず、親の座標で y が運んだ量だけ減る", () => {
  // 上のテストの対照。寄せ量が無ければ y は 10 - 8
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupTurnedFrame(90), onRepositionNode });
  drawnTurnedFrame();

  dragNode("chip", { x: 8, y: 0 }, "ctrl");

  expect(onRepositionNode).toHaveBeenCalledWith("chip", {
    parentName: "frame",
    placement: { mode: "absolute", x: 10, y: 2 },
  });
});

test("90 度回った Box の中の回っていない Box の中のノードも、祖先の向きで親の座標へ戻される", () => {
  // 親の向きを自分の `rotation` から引くと、回っていない `inset` の 0 度になる
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupTurnedFrame(90, true), onRepositionNode });
  drawnTurnedFrame(true);

  dragNode("dot", { x: -7, y: 0 });

  expect(onRepositionNode).toHaveBeenCalledWith("dot", {
    parentName: "inset",
    placement: { mode: "absolute", x: 10, y: 17 },
  });
});

test("90 度回った Box の中から回っていない親へ付け替えると、座標が指す点が画面上で同じ位置のまま新しい親の座標が書かれる", () => {
  /*
   * `frame` の座標の原点（回って描かれた左上の角）は `home` の座標で (250, 0)。運んだ先
   * (10, 17) を `home` の向きへ回すと (-17, 10) で、原点の位置を足して (233, 10)
   */
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupTurnedFrame(90), onRepositionNode });
  drawnTurnedFrame();

  dragNodeOnto("chip", drawn("home"), { x: -7, y: 0 });

  expect(onRepositionNode).toHaveBeenCalledWith("chip", {
    parentName: "home",
    placement: { mode: "absolute", x: 233, y: 10 },
  });
});

test("回っていない親から 90 度回った Box へ付け替えると、同じ規則で回った親の座標が書かれる", () => {
  /*
   * `home` の座標の原点は `frame` の座標で (0, 250)。運んだ先 (200, 30) を `frame` の向きへ
   * 戻すと (30, -200) で、原点の位置を足して (30, 50)
   */
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupTurnedFrame(90), onRepositionNode });
  drawnTurnedFrame();

  dragNodeOnto("pin", drawn("frame"), { x: 180, y: -120 });

  expect(onRepositionNode).toHaveBeenCalledWith("pin", {
    parentName: "frame",
    placement: { mode: "absolute", x: 30, y: 50 },
  });
});

test("倍率を上げても、90 度回った親の中の寄せ量が親の座標へ戻される", () => {
  /*
   * 1.2 倍では `chip` の外接矩形の右辺が 388 + 9 = 397 に来て、`frame` の右辺 400 へ 3 寄る。
   * 画面上で右へ 12 運んだことになり、倍率で割り戻して親の向きへ戻すと y が 10 減る
   */
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupTurnedFrame(90), onRepositionNode });
  wheel(canvasSurface(), { x: 0, y: -100 }, "ctrl");
  drawnAt("home", { left: 100, top: 60, width: 432, height: 288 });
  drawnTurnedAt(
    "frame",
    { left: 280, top: 60, width: 120, height: 240 },
    { width: 200, height: 100 },
  );
  drawnTurnedAt(
    "chip",
    { left: 373.6, top: 72, width: 14.4, height: 24 },
    { width: 20, height: 12 },
  );

  dragNode("chip", { x: 9, y: 0 });

  expect(onRepositionNode).toHaveBeenCalledWith("chip", {
    parentName: "frame",
    placement: { mode: "absolute", x: 10, y: 0 },
  });
});

test("360 度回った Box の中のノードは、回っていない Box の中と同じ座標が書かれる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupTurnedFrame(360), onRepositionNode });
  drawnUprightFrame();

  dragNode("chip", { x: 12, y: 5 });

  expect(onRepositionNode).toHaveBeenCalledWith("chip", {
    parentName: "frame",
    placement: { mode: "absolute", x: 22, y: 15 },
  });
});
