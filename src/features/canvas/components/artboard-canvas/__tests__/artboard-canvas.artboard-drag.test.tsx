import { screen } from "@testing-library/react";
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
import { renderCanvas, selectionFromArtboards } from "./setup";

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

test("artboard の中身を掴んでも artboard の置き直しは届かない", () => {
  // 中身のドラッグはツリー内の移動 / 座標移動で、artboard は動かない
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });

  const frame = screen.getByRole("button", { name: "second" });
  pressPointer(frame, { x: 0, y: 0 });

  expect(onRepositionArtboard).not.toHaveBeenCalled();
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
