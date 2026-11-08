import { expect, test, vi } from "vitest";
import { RepositionEdit } from "@/domains/dcmp/reposition-edit";
import { DocumentSelection } from "@/domains/session/document-selection";
import {
  drawnTurnedFrame,
  turnedFrameDocument,
} from "@/features/editor/features/canvas/__tests__/canvas-turned-frame";
import {
  carryNode,
  dragNode,
  dragNodeOnto,
  drawn,
  drawnAt,
  injectedStyles,
  previewRule,
  renderCanvas,
  selectionFromArtboards,
  snapGuides,
  sortedFacingDistanceLabels,
} from "./setup";

/*
 * 選んでいる絶対配置の兄弟を、一員を押してまとめて運ぶ（docs/06-ui.md「キャンバス直接操作」の
 * 移動）。寄せ・ガイド線・隙間・等間隔・Alt / Option の距離は、全員を囲む矩形を 1 つ運んで
 * いるものとして見る。
 *
 * 画面上の位置はドキュメント上の座標と揃えてある（`home` の左上が (100, 60)）。`a` は
 * 右上の 200〜220・84〜96、`b` は左下の 140〜180・120〜140 にあり、2 つを囲む矩形は
 * 140〜220・84〜140。左辺は `b` の、上辺は `a` の辺になる。
 */

/**
 * `home` に絶対配置の `a`（100, 24）・`b`（40, 60）・`marker`（250, 0）とフローの `flowing`
 * がこの順で並び、隣に空の artboard `settings` がある対。
 *
 * @param selectedNames 選んでおくノードの名前
 * @returns そのドキュメントと選択の対
 */
function setupSelection(selectedNames: readonly string[]): DocumentSelection {
  const absoluteText = (name: string, x: number, y: number) => ({
    name,
    type: "Text",
    props: { content: name, placement: "absolute", x, y },
  });
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          absoluteText("a", 100, 24),
          absoluteText("b", 40, 60),
          absoluteText("marker", 250, 0),
          { name: "flowing", type: "Text", props: { content: "流" } },
        ],
      },
      { name: "settings", width: 360, height: 240, children: [] },
    ],
    selectedNames,
  );
}

/** それぞれの矩形を、ドキュメント上の座標と揃えた位置に置く。 */
function drawnSiblings(): void {
  drawnAt("home", { left: 100, top: 60, width: 360, height: 240 });
  drawnAt("a", { left: 200, top: 84, width: 20, height: 12 });
  drawnAt("b", { left: 140, top: 120, width: 40, height: 20 });
  drawnAt("marker", { left: 350, top: 60, width: 40, height: 20 });
  drawnAt("settings", { left: 500, top: 100, width: 360, height: 240 });
}

/** `home` の中の座標への、向きを書かない置き直し。 */
function inHome(name: string, x: number, y: number) {
  return {
    name,
    edit: RepositionEdit.create({
      parentName: "home",
      placement: { mode: "absolute", x, y },
    }),
  };
}

test("選んだ兄弟の一員を運んで離すと、全員ぶんの置き直しが 1 回で届き、全員が同じ量だけずれる", () => {
  const onRepositionNodes = vi.fn();
  renderCanvas({ selection: setupSelection(["a", "b"]), onRepositionNodes });
  drawnSiblings();

  // 囲む矩形は 170〜250・95〜151 へ動き、どの辺・中心線からも 6px より離れている
  dragNode("a", { x: 30, y: 11 });

  expect(onRepositionNodes.mock.calls).toEqual([
    [[inHome("a", 130, 35), inHome("b", 70, 71)]],
  ]);
});

test("選んだ兄弟の一員を運んでいる間、全員が運んだ分だけずれて見える", () => {
  renderCanvas({ selection: setupSelection(["a", "b"]) });
  drawnSiblings();

  carryNode("a", { x: 30, y: 11 });

  const styles = injectedStyles();
  expect([
    styles.includes(previewRule("a", { x: 30, y: 11 })),
    styles.includes(previewRule("b", { x: 30, y: 11 })),
  ]).toEqual([true, true]);
});

test("押した一員の辺は何にも近くなくても、囲む矩形の左辺が親の左辺に近ければ全員が寄る", () => {
  const onRepositionNodes = vi.fn();
  renderCanvas({ selection: setupSelection(["a", "b"]), onRepositionNodes });
  drawnSiblings();

  /*
   * 囲む矩形の左辺（`b` の左辺）が 97 — `home` の左辺の 3px 手前。押した `a` は 157〜177 で、
   * `a` だけを見ると寄らず a は 57、b は -3 になる
   */
  dragNode("a", { x: -43, y: 11 });

  expect(onRepositionNodes).toHaveBeenCalledWith([
    inHome("a", 60, 35),
    inHome("b", 0, 71),
  ]);
});

test("囲む矩形が揃え先に吸い付いている間、ガイド線は囲む矩形と揃え先をまたぐ長さで出る", () => {
  renderCanvas({ selection: setupSelection(["a", "b"]) });
  drawnSiblings();

  // 囲む矩形の右辺が 347 — `marker` の左辺（350）の 3px 手前
  carryNode("a", { x: 127, y: 11 });

  /*
   * 線は `marker` の上辺（60）から、囲む矩形の下辺（`b` の下辺 151）までをまたぐ。`a` だけを
   * 見ると下端は `a` の下辺 107 になる
   */
  expect(snapGuides()[0].getAttribute("style")).toContain(
    "left: 349px; top: 60px; width: 2px; height: 91px",
  );
});

test("まとめて運んでいる一員どうしは、互いの揃え先にならない", () => {
  const onRepositionNodes = vi.fn();
  renderCanvas({ selection: setupSelection(["a", "b"]), onRepositionNodes });
  drawnSiblings();

  /*
   * 囲む矩形の左辺 144 は、動く前の `b` の左辺（140）の 4px 先。`b` が揃え先に残っていると
   * 140 へ寄って動かなくなる
   */
  dragNode("a", { x: 4, y: 11 });

  expect(onRepositionNodes).toHaveBeenCalledWith([
    inHome("a", 104, 35),
    inHome("b", 44, 71),
  ]);
});

test("選んでいない兄弟の列と同じ間隔の近くまで運ぶと、囲む矩形がその間隔になる位置へ寄る", () => {
  /*
   * 列は `first`（120〜160）と `second`（190〜230）で間隔 30、後ろの端は 260。`p` は列と
   * 縦に重ならず（80〜92）、`q` だけが重なる（150〜170）。囲む矩形の左辺 263 が 260 へ寄る。
   * `p` だけを見ると列と縦に重ならないので寄らず、p は 163 になる
   */
  const absoluteText = (name: string, x: number, y: number) => ({
    name,
    type: "Text",
    props: { content: name, placement: "absolute", x, y },
  });
  const onRepositionNodes = vi.fn();
  renderCanvas({
    selection: selectionFromArtboards(
      [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            absoluteText("first", 20, 100),
            absoluteText("second", 90, 100),
            absoluteText("p", 200, 20),
            absoluteText("q", 230, 90),
          ],
        },
      ],
      ["p", "q"],
    ),
    onRepositionNodes,
  });
  drawnAt("home", { left: 100, top: 60, width: 360, height: 240 });
  drawnAt("first", { left: 120, top: 160, width: 40, height: 40 });
  drawnAt("second", { left: 190, top: 160, width: 40, height: 40 });
  drawnAt("p", { left: 300, top: 80, width: 20, height: 12 });
  drawnAt("q", { left: 330, top: 150, width: 20, height: 20 });

  dragNode("p", { x: -37, y: 0 });

  expect(onRepositionNodes).toHaveBeenCalledWith([
    inHome("p", 160, 20),
    inHome("q", 190, 90),
  ]);
});

test("Alt を押しながらまとめて運んでいる間、距離は囲む矩形から測る", () => {
  renderCanvas({ selection: setupSelection(["a", "b"]) });
  drawnSiblings();

  /*
   * 囲む矩形 170〜250・95〜151 から `home` の辺まで、左 70・右 210・上 35・下 149。
   * `a` だけを見ると左 130・下 193 になる
   */
  carryNode("a", { x: 30, y: 11 }, "alt");

  expect(sortedFacingDistanceLabels()).toEqual(["149", "210", "35", "70"]);
});

test("別の artboard の上へまとめて運んで離すと、全員の行き先がその artboard になる", () => {
  const onRepositionNodes = vi.fn();
  renderCanvas({ selection: setupSelection(["a", "b"]), onRepositionNodes });
  drawnSiblings();

  dragNodeOnto("a", drawn("settings"), { x: 30, y: 30 });

  expect(
    onRepositionNodes.mock.lastCall?.[0].map(
      (edit: { edit: RepositionEdit }) => edit.edit.to.parentName,
    ),
  ).toEqual(["settings", "settings"]);
});

test("90 度回った Box の中の兄弟を回っていない artboard へまとめて運ぶと、一員ごとに中心を保つ座標と 90 度が書かれる", () => {
  /*
   * `frame` の座標の原点は `home` の座標で (250, 0)。運んだ量 (-20, 0) は親の座標で (0, 20)。
   * `chip`（10, 30 へ）は中心 (20, 36) を回して原点を足し、(204, 14)。`peg`（150, 80 へ）は
   * 中心 (160, 86) から同じく (154, 154)
   */
  const onRepositionNodes = vi.fn();
  renderCanvas({
    selection: DocumentSelection.fromNames(turnedFrameDocument(90), [
      "chip",
      "peg",
    ]),
    onRepositionNodes,
  });
  drawnTurnedFrame();

  dragNodeOnto("chip", drawn("home"), { x: -20, y: 0 });

  expect(onRepositionNodes).toHaveBeenCalledWith([
    {
      name: "chip",
      edit: RepositionEdit.rotatedTo(
        { parentName: "home", placement: { mode: "absolute", x: 204, y: 14 } },
        90,
      ),
    },
    {
      name: "peg",
      edit: RepositionEdit.rotatedTo(
        {
          parentName: "home",
          placement: { mode: "absolute", x: 154, y: 154 },
        },
        90,
      ),
    },
  ]);
});

test("⌘ を押しながらまとめて運ぶと、囲む矩形が親の辺に近くても寄らない", () => {
  const onRepositionNodes = vi.fn();
  renderCanvas({ selection: setupSelection(["a", "b"]), onRepositionNodes });
  drawnSiblings();

  dragNode("a", { x: -43, y: 11 }, "meta");

  expect(onRepositionNodes).toHaveBeenCalledWith([
    inHome("a", 57, 35),
    inHome("b", -3, 71),
  ]);
});

test("フローのノードが混ざった複数選択で一員を運ぶと、押した一員だけの置き直しが届く", () => {
  const onRepositionNodes = vi.fn();
  renderCanvas({
    selection: setupSelection(["a", "flowing"]),
    onRepositionNodes,
  });
  drawnSiblings();

  dragNode("a", { x: 30, y: 11 });

  expect(onRepositionNodes).toHaveBeenCalledWith([inHome("a", 130, 35)]);
});

test("選択をツリーと逆の順に組んでいても、届く置き直しはツリー順に並ぶ", () => {
  const onRepositionNodes = vi.fn();
  renderCanvas({ selection: setupSelection(["b", "a"]), onRepositionNodes });
  drawnSiblings();

  dragNode("a", { x: 30, y: 11 });

  expect(onRepositionNodes).toHaveBeenCalledWith([
    inHome("a", 130, 35),
    inHome("b", 70, 71),
  ]);
});
