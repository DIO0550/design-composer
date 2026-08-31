import { fireEvent, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
  releasePointer,
  wheel,
} from "@/features/canvas/__tests__/canvas-gesture";
import { Option } from "@/utils/Option";
import { repositionPreviewDeclarations } from "../reposition-preview-style";
import {
  drawn,
  drawnSized,
  injectedStyles,
  renderCanvas,
  selectionFromArtboards,
} from "./setup";

/**
 * `home` に絶対配置の `badge` と、フローの `title` が並ぶ、未選択の対。
 *
 * 2 つ並べるのは、同じドラッグが配置によって別の意味になることを
 * 対照付きで確かめるため（片方だけだと、出し分けを丸ごと壊しても通る）。
 *
 * @param badgeAt `badge` を置く座標。省略すると `home` の内側
 * @returns その座標に `badge` を置いたドキュメントと、未選択の対
 */
function setupSelection(
  badgeAt: Readonly<{ x: number; y: number }> = { x: 40, y: 24 },
): DocumentSelection {
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "badge",
            type: "Text",
            props: {
              content: "3",
              placement: "absolute",
              x: badgeAt.x,
              y: badgeAt.y,
            },
          },
          { name: "title", type: "Text", props: { content: "ホーム" } },
        ],
      },
    ],
    [],
  );
}

/** ノードを掴んで運び、離すまで。移動量は縦横で違う値にする（取り違えを落とすため）。 */
function dragNode(from: Element, by: Readonly<{ x: number; y: number }>): void {
  pressPointer(from, { x: 100, y: 100 });
  movePointer(from, { x: 100 + by.x, y: 100 + by.y });
  releasePointer(from, { x: 100 + by.x, y: 100 + by.y });
}

test("絶対配置のノードを運んで離すと、掴んだ時点の座標から動いた分だけずれる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });

  dragNode(drawn("badge"), { x: 30, y: -12 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    mode: "absolute",
    x: 70,
    y: 12,
  });
});

test("何度も動かしても、ずれるのは掴んだ時点からの合計になる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });

  // 途中のポインタ位置を基準にし直すと、最後の 1 区間分（8, -4）しか動かない
  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(drawn("badge"), { x: 115, y: 95 });
  movePointer(drawn("badge"), { x: 122, y: 92 });
  movePointer(drawn("badge"), { x: 130, y: 88 });
  releasePointer(drawn("badge"), { x: 130, y: 88 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    mode: "absolute",
    x: 70,
    y: 12,
  });
});

test("絶対配置のノードを運んでもツリーの並びは変わらない", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode });

  dragNode(drawn("badge"), { x: 30, y: -12 });

  expect(onMoveNode).not.toHaveBeenCalled();
});

test("フローのノードを運ぶと今までどおりツリー内の移動になる", () => {
  const onMoveNode = vi.fn();
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode, onRepositionNode });

  dragNode(drawn("title"), { x: 30, y: -12 });

  expect([
    onMoveNode.mock.calls.length,
    onRepositionNode.mock.calls.length,
  ]).toEqual([1, 0]);
});

test("押しただけで運んでいなければ座標は動かない", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });

  pressPointer(drawn("badge"), { x: 100, y: 100 });
  releasePointer(drawn("badge"), { x: 100, y: 100 });

  expect(onRepositionNode).not.toHaveBeenCalled();
});

test("運んでいる途中でキャンバスの外へ出ると座標は動かない", () => {
  const onRepositionNode = vi.fn();
  const { container } = renderCanvas({
    selection: setupSelection(),
    onRepositionNode,
  });

  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(drawn("badge"), { x: 130, y: 88 });
  // 掴んだあとのポインタを受けているのは 3 ペインの器（`dragHandlers` の付け先）
  fireEvent.pointerLeave(
    Option.unwrap(Option.fromNullable(container.firstElementChild)),
  );
  releasePointer(drawn("badge"), { x: 130, y: 88 });

  expect(onRepositionNode).not.toHaveBeenCalled();
});

test("倍率を上げても、動く量は画面上ではなくドキュメント上の px になる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });
  wheel(screen.getByTestId("canvas-surface"), { x: 0, y: -100 }, "ctrl");

  /*
   * 1.2 倍で見ているとき、画面上の (34, -13) はドキュメント上の
   * (28.33…, -10.83…) にあたる。割り切れない量を選ぶのは、割り切れる量だと
   * 丸めの有無で答えが変わらず「丸めている」ことを確かめられないため。
   */
  dragNode(drawn("badge"), { x: 34, y: -13 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    mode: "absolute",
    x: 68,
    y: 13,
  });
});

/**
 * `badge` を掴んだまま、まだ離していない状態にする。
 * 離す前の見た目を見るので `releasePointer` は撃たない。
 */
function carryBadge(by: Readonly<{ x: number; y: number }>): void {
  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(drawn("badge"), { x: 100 + by.x, y: 100 + by.y });
}

test("運んでいる間、掴んだノードは離す位置まで見た目だけ先に動く", () => {
  renderCanvas({ selection: setupSelection() });

  carryBadge({ x: 30, y: -12 });

  expect(injectedStyles()).toContain(
    repositionPreviewDeclarations({ x: 30, y: -12 }),
  );
});

test("倍率を上げても、見た目の移動量は画面上ではなくドキュメント上の px になる", () => {
  renderCanvas({ selection: setupSelection() });
  wheel(screen.getByTestId("canvas-surface"), { x: 0, y: -100 }, "ctrl");

  // 1.2 倍で見ているとき、画面上の (34, -13) はドキュメント上の (28.33…, -10.83…)。
  // 丸めた行き先から逆算するので、見た目のずれも確定後と同じ (28, -11) になる
  carryBadge({ x: 34, y: -13 });

  expect(injectedStyles()).toContain(
    repositionPreviewDeclarations({ x: 28, y: -11 }),
  );
});

test("フローのノードを運んでいる間は、絶対配置のノードを動かさない", () => {
  renderCanvas({ selection: setupSelection() });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(drawn("title"), { x: 130, y: 88 });

  // `badge` が動いていないことを見る（規則が 1 本も無いことではなく、
  // 動かす側を壊しても動かしすぎる側を壊しても落ちる形にする）
  expect(injectedStyles()).not.toContain("transform:translate(");
});

test("運んでいる途中でキャンバスの外へ出ると見た目も戻る", () => {
  const { container } = renderCanvas({ selection: setupSelection() });
  carryBadge({ x: 30, y: -12 });

  fireEvent.pointerLeave(
    Option.unwrap(Option.fromNullable(container.firstElementChild)),
  );

  expect(injectedStyles()).not.toContain("transform:translate(");
});

test("離すと見た目のずれは消える（座標そのものが動くため）", () => {
  renderCanvas({ selection: setupSelection() });
  carryBadge({ x: 30, y: -12 });

  releasePointer(drawn("badge"), { x: 130, y: 88 });

  expect(injectedStyles()).not.toContain("transform:translate(");
});

/**
 * `home` とその中の `badge` に、描かれた大きさを与える。
 * happy-dom はレイアウトを行わないので、これを通さないとクランプが効かない
 * （`canvas-measure` の doc）。上限は `360 - 44 = 316` / `240 - 24 = 216` になる。
 */
function drawnHomeWithBadge(): void {
  drawnSized("home", { width: 360, height: 240 });
  drawnSized("badge", { width: 44, height: 24 });
}

test("親の外へ運んで離すと、届く座標は親の内側で止まる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });
  drawnHomeWithBadge();

  dragNode(drawn("badge"), { x: 400, y: 300 });

  // 収めないと (440, 324) になり、artboard に切り取られて見えなくなる
  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    mode: "absolute",
    x: 316,
    y: 216,
  });
});

test("運んでいる最中の見た目も、親の内側で止まる", () => {
  renderCanvas({ selection: setupSelection() });
  drawnHomeWithBadge();

  carryBadge({ x: 400, y: 300 });

  // 収めた行き先 (316, 216) を掴んだ時点 (40, 24) から見たずれ。
  // 確定側だけで収めると、ここは (400, 300) のまま＝運んでいる間だけ消える
  expect(injectedStyles()).toContain(
    repositionPreviewDeclarations({ x: 276, y: 192 }),
  );
});

test("もともと親の外にあるノードは、動かした時点で親の内側へ戻る", () => {
  const onRepositionNode = vi.fn();
  // 左へ出た x と下へ出た y にして、軸ごとに違う側で止まることまで見る
  // （両軸とも 0 に揃えると、スキーマの既定値へ戻すだけの実装でも通る）
  renderCanvas({
    selection: setupSelection({ x: -104, y: 300 }),
    onRepositionNode,
  });
  drawnHomeWithBadge();

  dragNode(drawn("badge"), { x: 8, y: 6 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    mode: "absolute",
    x: 0,
    y: 216,
  });
});
