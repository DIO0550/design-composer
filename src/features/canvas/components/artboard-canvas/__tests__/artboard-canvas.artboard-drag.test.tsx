import { fireEvent, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import {
  artboardFrameContainer,
  artboardHandle,
  canvasContent,
} from "@/features/canvas/__tests__/canvas-elements";
import {
  drag,
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/canvas/__tests__/canvas-gesture";
import { drawn, renderCanvas, selectionFromArtboards } from "./setup";

/**
 * 幅 200 の artboard を 3 枚並べた、未選択の対。
 *
 * 3 枚並べるのは、掴む相手を**先頭以外**にできるようにするため。先頭は既定の位置が
 * 原点なので、掴んだ時点の位置を無視する実装でも同じ答えになる。
 *
 * @returns 3 枚の artboard を持つドキュメントと、未選択の対
 */
function setupSelection() {
  return selectionFromArtboards([
    { name: "first", width: 200, height: 140, children: [] },
    { name: "second", width: 200, height: 140, children: [] },
    { name: "third", width: 200, height: 140, children: [] },
  ]);
}

/**
 * `second` が Text の `title` を 1 つ持つ、未選択の対。
 *
 * 中身を掴む経路を見るのに使う。`setupSelection` は子を持たないので、そちらでは
 * 「背景ではないところ」を押せない。
 *
 * @returns 子を 1 つ持つ artboard を含むドキュメントと、未選択の対
 */
function setupSelectionWithChild() {
  return selectionFromArtboards([
    { name: "first", width: 200, height: 140, children: [] },
    {
      name: "second",
      width: 200,
      height: 140,
      children: [{ name: "title", type: "Text", props: { content: "設定" } }],
    },
    { name: "third", width: 200, height: 140, children: [] },
  ]);
}

test("見出しを掴んで動かすと、離した位置の座標で置き直しが届く", () => {
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });

  // 2 枚目の既定の位置は x=232（200 + 32）。そこから動かす
  drag(artboardHandle("second"), {
    from: { x: 0, y: 0 },
    to: { x: 60, y: 40 },
  });

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 292,
    y: 40,
  });
});

test("何度動かしても、置き直しが届くのは離したときの 1 回だけ", () => {
  /*
   * 運ぶたびに送ると、1 回のドラッグで undo 履歴がポインタの移動回数だけ積まれる
   * （`useArtboardDrag` の doc）。**途中で 2 回以上動かす**ことで、運搬中に送る実装を
   * 落とせる（1 回しか動かさないと、閾値を越える前の 1 回目では送れないので通ってしまう）。
   */
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });

  pressPointer(artboardHandle("second"), { x: 0, y: 0 });
  movePointer(canvasContent(), { x: 30, y: 20 });
  movePointer(canvasContent(), { x: 60, y: 40 });
  releasePointer(canvasContent(), { x: 60, y: 40 });

  expect(onRepositionArtboard).toHaveBeenCalledTimes(1);
});

test("先頭以外を掴んでも原点へ飛ばない", () => {
  /*
   * 掴んだ時点の位置を無視して原点から測る実装だと `{x:60,y:40}` になる。
   * 既定の位置が原点でない 2 枚目で見ることで、その壊し方を落とせる。
   */
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });

  drag(artboardHandle("second"), {
    from: { x: 0, y: 0 },
    to: { x: 60, y: 40 },
  });

  expect(onRepositionArtboard).not.toHaveBeenCalledWith("second", {
    x: 60,
    y: 40,
  });
});

test("閾値までの動きでは置き直しが届かない", () => {
  // 3px は閾値（4px）未満なので、押して離しただけのクリックとして扱う
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });

  drag(artboardHandle("second"), { from: { x: 0, y: 0 }, to: { x: 3, y: 0 } });

  expect(onRepositionArtboard).not.toHaveBeenCalled();
});

test("artboard の背景を掴んで動かすと、離した位置の座標で置き直しが届く", () => {
  /*
   * 押すのは枠の `role="button"` ではなく**描かれた artboard そのもの**
   * （`drawn`）。実ブラウザで背景を押したときの `event.target` はこちらで、
   * 枠を押すと「名前を 1 つも辿らない」別の道を通ってしまう。
   */
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });

  drag(drawn("second"), { from: { x: 0, y: 0 }, to: { x: 60, y: 40 } });

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 292,
    y: 40,
  });
});

test("artboard の中身を掴んでも artboard の置き直しは届かない", () => {
  /*
   * 中身のドラッグはツリー内の移動 / 座標移動で、artboard は動かない。
   * 押すだけでなく**閾値を越えて動かして離す**まで撃つ（置き直しが届くのは離した
   * ときだけなので、押しただけでは掴み分けをどう壊しても呼ばれない）。
   */
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelectionWithChild(), onRepositionArtboard });

  drag(drawn("title"), { from: { x: 0, y: 0 }, to: { x: 60, y: 40 } });

  expect(onRepositionArtboard).not.toHaveBeenCalled();
});

test("artboard の中身を掴んだときは、ノードの移動として届く", () => {
  // 掴み分けが artboard 優先に入れ替わると、ノード側へ何も届かなくなる
  const onMoveNode = vi.fn();
  const onRepositionNode = vi.fn();
  renderCanvas({
    selection: setupSelectionWithChild(),
    onMoveNode,
    onRepositionNode,
  });

  drag(drawn("title"), { from: { x: 0, y: 0 }, to: { x: 60, y: 40 } });

  const movedSomehow =
    onMoveNode.mock.calls.length + onRepositionNode.mock.calls.length;
  expect(movedSomehow).toBeGreaterThan(0);
});

test("背景を掴んで運んだ直後でも、次のクリックで選べる", () => {
  /*
   * 見出し経路と**対**にして置く。次に「離した直後の click を飲み込む」状態を足す人が、
   * どちらの掴み口でも次のクリックを食べることに気づけるようにするため
   * （飲み込む相手が居ない理由は掴み口ごとに違う / `ArtboardDrag` の doc）。
   */
  const onSelect = vi.fn();
  renderCanvas({ selection: setupSelection(), onSelect });

  drag(drawn("second"), { from: { x: 0, y: 0 }, to: { x: 60, y: 40 } });
  fireEvent.click(drawn("third"));

  expect(onSelect).toHaveBeenCalledWith(["third"]);
});

test("運んでいる間は、離す前から運び先に描かれる", () => {
  /*
   * ドキュメントを書き換えるのは離したときだけなので、確定前の位置を描かないと
   * 離すまで画面で何も動かない（`useArtboardDrag` の doc）。
   */
  renderCanvas({ selection: setupSelection() });

  pressPointer(artboardHandle("second"), { x: 0, y: 0 });
  movePointer(canvasContent(), { x: 60, y: 40 });

  const { style } = artboardFrameContainer(canvasContent(), "second");
  // 既定の位置 x=232（200 + 32）から 60 / 40 動いた先
  expect([style.left, style.top]).toEqual(["292px", "40px"]);
});

test("見出しを掴んでもキャンバスは動かない", () => {
  /*
   * 掴み口の上で始めたドラッグがパンにもなると、artboard と背景が同時に動いて
   * 何を掴んだのか読めなくなる。
   */
  renderCanvas({ selection: setupSelection() });
  const before = canvasContent().style.transform;

  drag(artboardHandle("second"), {
    from: { x: 0, y: 0 },
    to: { x: 60, y: 40 },
  });

  expect(canvasContent().style.transform).toBe(before);
});

test("見出しを掴んで運んだ直後でも、次のクリックで選べる", () => {
  /*
   * ノードのドラッグ / リサイズは「離した直後の click を飲み込む」状態を持つが、
   * artboard の掴み口は枠の**兄弟**なのでドラッグ由来の click は枠まで上がってこない。
   * 同じ形を写すと、飲み込む相手が居ないまま**次のクリックを食べる**（`ArtboardDrag` の doc）。
   */
  const onSelect = vi.fn();
  renderCanvas({ selection: setupSelection(), onSelect });

  drag(artboardHandle("second"), {
    from: { x: 0, y: 0 },
    to: { x: 60, y: 40 },
  });
  screen.getByRole("button", { name: "third" }).click();

  expect(onSelect).toHaveBeenCalledWith(["third"]);
});
