import { expect, test, vi } from "vitest";
import { RepositionEdit } from "@/domains/dcmp/reposition-edit";
import { canvasSurface } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  wheel,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import {
  drawnTurnedFrame,
  turnedFrameSelection,
} from "@/features/editor/features/canvas/__tests__/canvas-turned-frame";
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
} from "./setup";

/*
 * 祖先が回っているノードの座標の置き直し（docs/06-ui.md「キャンバス直接操作」の座標の
 * 置き直し）。座標は親の座標（定義は同じ節の `layout: free` の項）で書かれ、画面上では
 * ポインタが動いた向き・量だけ動く。向きの違う親へ付け替えると、自分の向きも向きの差だけ
 * 書き換わり、座標は画面上の中心を保つ値になる。
 *
 * 運ぶ量は縦横の片方だけにする。90 度回った親の中では画面の左が親の座標の y の正の向きに
 * なるので、戻し忘れると x と y が入れ替わって落ちる。
 */

/**
 * `turnedFrameSelection(rotation)` を、`frame` が回っていないのと同じ形で描く（360 度の倍数の
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
  renderCanvas({ selection: turnedFrameSelection(90), onRepositionNode });
  drawnTurnedFrame();

  dragNode("chip", { x: -7, y: 0 });

  expect(onRepositionNode).toHaveBeenCalledWith(
    "chip",
    RepositionEdit.create({
      parentName: "frame",
      placement: { mode: "absolute", x: 10, y: 17 },
    }),
  );
});

test("90 度回った Box の中のノードを運んでいる間、ずらして見せる量は親の向きへ戻した量になる", () => {
  // ずらし量は親と一緒に回って効くので、戻さないと画面上では上へずれて見える
  renderCanvas({ selection: turnedFrameSelection(90) });
  drawnTurnedFrame();

  carryNode("chip", { x: -7, y: 0 });

  expect(injectedStyles()).toContain(previewRule("chip", { x: 0, y: 7 }));
});

test("90 度回った Box の中のノードを落とせる親が無い場所へ運んでも、ずらして見せる量は親の向きへ戻した量になる", () => {
  renderCanvas({ selection: turnedFrameSelection(90) });
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
  renderCanvas({ selection: turnedFrameSelection(90), onRepositionNode });
  drawnTurnedFrame();

  dragNode("chip", { x: 8, y: 0 });

  expect(onRepositionNode).toHaveBeenCalledWith(
    "chip",
    RepositionEdit.create({
      parentName: "frame",
      placement: { mode: "absolute", x: 10, y: 0 },
    }),
  );
});

test("⌘ / Ctrl を押しながら 90 度回った親の中で同じ量運ぶと寄らず、親の座標で y が運んだ量だけ減る", () => {
  // 上のテストの対照。寄せ量が無ければ y は 10 - 8
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: turnedFrameSelection(90), onRepositionNode });
  drawnTurnedFrame();

  dragNode("chip", { x: 8, y: 0 }, "ctrl");

  expect(onRepositionNode).toHaveBeenCalledWith(
    "chip",
    RepositionEdit.create({
      parentName: "frame",
      placement: { mode: "absolute", x: 10, y: 2 },
    }),
  );
});

test("90 度回った Box の中の回っていない Box の中のノードも、祖先の向きで親の座標へ戻される", () => {
  // 親の向きを自分の `rotation` から引くと、回っていない `inset` の 0 度になる
  const onRepositionNode = vi.fn();
  renderCanvas({
    selection: turnedFrameSelection(90, { nested: true }),
    onRepositionNode,
  });
  drawnTurnedFrame(true);

  dragNode("dot", { x: -7, y: 0 });

  expect(onRepositionNode).toHaveBeenCalledWith(
    "dot",
    RepositionEdit.create({
      parentName: "inset",
      placement: { mode: "absolute", x: 10, y: 17 },
    }),
  );
});

test("90 度回った Box の中から回っていない親へ付け替えると、画面上の向きと中心を保つ向きと座標が書かれる", () => {
  /*
   * `frame` の座標の原点（回って描かれた左上の角）は `home` の座標で (250, 0)。運んだ先
   * (10, 17) を `home` の向きへ回すと (-17, 10) で、原点の位置を足して (233, 10)。自分の向きを
   * 90 度にすると中心が左上のまわりに回るので、20x12 の中心を保つ分 (-16, 4) だけ直して (217, 14)
   */
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: turnedFrameSelection(90), onRepositionNode });
  drawnTurnedFrame();

  dragNodeOnto("chip", drawn("home"), { x: -7, y: 0 });

  expect(onRepositionNode).toHaveBeenCalledWith(
    "chip",
    RepositionEdit.rotatedTo(
      {
        parentName: "home",
        placement: { mode: "absolute", x: 217, y: 14 },
      },
      90,
    ),
  );
});

test("90 度回った Box の中の 30 度回ったノードを回っていない親へ付け替えると、向きは差を足した 120 度になる", () => {
  /*
   * 中心 (334, 80) のまま画面上で 120 度に立っている。回る前の大きさは同じなので、書かれる
   * 座標は回っていないノードと同じ (217, 14)
   */
  const onRepositionNode = vi.fn();
  renderCanvas({
    selection: turnedFrameSelection(90, { rotation: 30 }),
    onRepositionNode,
  });
  drawnTurnedFrame();
  drawnTurnedAt(
    "chip",
    { left: 323.804, top: 68.34, width: 20.392, height: 23.32 },
    { width: 20, height: 12 },
  );

  dragNodeOnto("chip", drawn("home"), { x: -7, y: 0 });

  expect(onRepositionNode).toHaveBeenCalledWith(
    "chip",
    RepositionEdit.rotatedTo(
      {
        parentName: "home",
        placement: { mode: "absolute", x: 217, y: 14 },
      },
      120,
    ),
  );
});

test("回っていない親から 90 度回った Box へ付け替えると、同じ規則で向きと回った親の座標が書かれる", () => {
  /*
   * `home` の座標の原点は `frame` の座標で (0, 250)。運んだ先 (200, 30) を `frame` の向きへ
   * 戻すと (30, -200) で、原点の位置を足して (30, 50)。向きを -90 度にして中心を保つ分
   * (-4, -16) だけ直して (26, 34)
   */
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: turnedFrameSelection(90), onRepositionNode });
  drawnTurnedFrame();

  dragNodeOnto("pin", drawn("frame"), { x: 180, y: -120 });

  expect(onRepositionNode).toHaveBeenCalledWith(
    "pin",
    RepositionEdit.rotatedTo(
      {
        parentName: "frame",
        placement: { mode: "absolute", x: 26, y: 34 },
      },
      -90,
    ),
  );
});

test("倍率を上げても、90 度回った親の中の寄せ量が親の座標へ戻される", () => {
  /*
   * 1.2 倍では `chip` の外接矩形の右辺が 388 + 9 = 397 に来て、`frame` の右辺 400 へ 3 寄る。
   * 画面上で右へ 12 運んだことになり、倍率で割り戻して親の向きへ戻すと y が 10 減る
   */
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: turnedFrameSelection(90), onRepositionNode });
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

  expect(onRepositionNode).toHaveBeenCalledWith(
    "chip",
    RepositionEdit.create({
      parentName: "frame",
      placement: { mode: "absolute", x: 10, y: 0 },
    }),
  );
});

test("倍率を上げても、90 度回った Box の中から回っていない親へ付け替えると、画面上の向きと中心を保つ向きと座標が書かれる", () => {
  /*
   * 1.2 倍で画面上の左へ 8.4 運ぶと、倍率で割り戻して 7 になり、1 倍で 7 運んだときと同じ
   * (217, 14) になる。中心も倍率で割り戻さないと、座標がずれて書かれる
   */
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: turnedFrameSelection(90), onRepositionNode });
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

  dragNodeOnto("chip", drawn("home"), { x: -8.4, y: 0 });

  expect(onRepositionNode).toHaveBeenCalledWith(
    "chip",
    RepositionEdit.rotatedTo(
      {
        parentName: "home",
        placement: { mode: "absolute", x: 217, y: 14 },
      },
      90,
    ),
  );
});

test("360 度回った Box の中のノードは、回っていない Box の中と同じ座標が書かれる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: turnedFrameSelection(360), onRepositionNode });
  drawnUprightFrame();

  dragNode("chip", { x: 12, y: 5 });

  expect(onRepositionNode).toHaveBeenCalledWith(
    "chip",
    RepositionEdit.create({
      parentName: "frame",
      placement: { mode: "absolute", x: 22, y: 15 },
    }),
  );
});

test("360 度回った Box の中から回っていない親へ付け替えても、向きは書かれない", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: turnedFrameSelection(360), onRepositionNode });
  drawnUprightFrame();

  dragNodeOnto("chip", drawn("home"), { x: 12, y: 5 });

  // 付け替えは起きる（`home` を指す）が、向きの差が 1 回りなので左上を保って向きは書かない
  expect(onRepositionNode).toHaveBeenCalledWith(
    "chip",
    RepositionEdit.create({
      parentName: "home",
      placement: { mode: "absolute", x: 122, y: 65 },
    }),
  );
});
