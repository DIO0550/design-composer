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
import { drawn, renderCanvas, selectionFromArtboards } from "./setup";

/**
 * `home` に絶対配置の `badge` と、フローの `title` が並ぶ、未選択の対。
 *
 * 2 つ並べるのは、同じドラッグが配置によって別の意味になることを
 * 対照付きで確かめるため（片方だけだと、出し分けを丸ごと壊しても通る）。
 */
function setupSelection(): DocumentSelection {
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
            props: { content: "3", placement: "absolute", x: 40, y: 24 },
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
