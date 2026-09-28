import { expect, test, vi } from "vitest";
import type { Offset } from "@/domains/unit/offset";
import {
  artboardFrameContainer,
  artboardHandle,
  canvasContent,
} from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  drag,
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { drawn, drawnAt, renderCanvas, selectionFromArtboards } from "./setup";

/**
 * 200 × 140 の artboard を 3 枚、既定の位置（x = 0 / 232 / 464、y = 0）に並べた未選択の対。
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
 * artboard の実測を、その枠（`li`）が今置かれている位置に追従させる。
 *
 * 固定の矩形を返す差し替えだと、運んで描き直したあとも掴んだ時点の位置を返し続ける。
 * 実ブラウザの実測には前回までの運搬ぶんが乗るので、それを写す（等倍・原点で見ている
 * ので、画面上の位置がキャンバス上の座標と一致する）。
 *
 * @param name 追従させる artboard の名前
 */
function drawnFollowingFrame(name: string): void {
  drawn(name).getBoundingClientRect = () => {
    const { style } = artboardFrameContainer(canvasContent(), name);
    return new DOMRect(
      Number.parseFloat(style.left),
      Number.parseFloat(style.top),
      200,
      140,
    );
  };
}

/**
 * 3 枚すべての実測を、それぞれの枠が今置かれている位置に追従させる。
 */
function drawnFollowingFrames(): void {
  for (const name of ["first", "second", "third"]) {
    drawnFollowingFrame(name);
  }
}

/**
 * `second` の見出しを掴み、押した位置からその量だけ動かして離す。
 *
 * @param by 押した位置から動かす量（画面上の px）
 */
function dragSecond(by: Offset): void {
  drag(artboardHandle("second"), { from: { x: 0, y: 0 }, to: by });
}

test("他の artboard の辺の近くまで運んで離すと、その辺が揃う座標が書かれる", () => {
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });
  drawnFollowingFrames();

  // 左辺が `first` の右辺（200）の 3px 先まで来る量。寄せが無ければ x は 203 になる
  dragSecond({ x: -29, y: 30 });

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 200,
    y: 30,
  });
});

test("運んでいる artboard 自身は揃え先にならない", () => {
  /*
   * 自分を外し忘れると、自分の辺との距離（＝運んだ量そのもの）が閾値の内側にある間は
   * どこへ運んでも寄せ量が打ち消し、掴んだ時点の x = 232 のまま動かなくなる。
   */
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });
  drawnFollowingFrames();

  dragSecond({ x: 3, y: 20 });

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 235,
    y: 20,
  });
});

test("運んでいる間の見た目も、吸い付いた位置に描かれる", () => {
  // 寄せを畳まずに渡すと、見た目だけが運んだ量そのまま（203）になって離した位置とずれる
  renderCanvas({ selection: setupSelection() });
  drawnFollowingFrames();

  pressPointer(artboardHandle("second"), { x: 0, y: 0 });
  movePointer(canvasContent(), { x: -29, y: 30 });

  const { style } = artboardFrameContainer(canvasContent(), "second");
  expect([style.left, style.top]).toEqual(["200px", "30px"]);
});

test("どの辺からも遠ければ、運んだ量そのままの座標が書かれる", () => {
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });
  drawnFollowingFrames();

  dragSecond({ x: 60, y: 40 });

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 292,
    y: 40,
  });
});

test("描かれていない（大きさの無い）artboard には吸い付かない", () => {
  /*
   * 差し替えていない `third` の実測は原点の 0×0 で返る。揃え先に入れると、左辺が 3 に
   * 来た `second` がその左辺（0）へ吸い付く。`first` はどこにも届かない遠くへ置く。
   */
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });
  drawnAt("first", { left: 1000, top: 1000, width: 200, height: 140 });
  drawnFollowingFrame("second");

  dragSecond({ x: -229, y: 60 });

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 3,
    y: 60,
  });
});

test("同じ距離に 2 枚あれば、並びが先の artboard へ寄る", () => {
  /*
   * 左辺が 203 に来ると、`first` の右辺（200）と `third` の左辺（206）がどちらも 3px。
   * 並びが先の `first` へ寄る（docs/06-ui.md「artboard の移動」）。並びを取り違えると 206。
   */
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });
  drawnAt("first", { left: 0, top: 0, width: 200, height: 140 });
  drawnFollowingFrame("second");
  drawnAt("third", { left: 206, top: 600, width: 200, height: 140 });

  dragSecond({ x: -29, y: 300 });

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 200,
    y: 300,
  });
});

test("途中で吸い付いたあとに離れても、離した位置での寄せだけが効く", () => {
  /*
   * 1 回目は左辺 205 で `first` の右辺（200）へ 5px 寄り、200 に描かれる。2 回目は
   * 掴んでから -22 の位置で、行き先の左辺は 210（どこにも届かない）。
   * 実測に乗っている前回の寄せ量（-5）を差し引かないと、行き先を 205 と見て 200 へ
   * 吸い付いたままになる。
   */
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionArtboard });
  drawnFollowingFrames();

  pressPointer(artboardHandle("second"), { x: 0, y: 0 });
  movePointer(canvasContent(), { x: -27, y: 30 });
  movePointer(canvasContent(), { x: -22, y: 30 });
  releasePointer(canvasContent(), { x: -22, y: 30 });

  expect(onRepositionArtboard).toHaveBeenCalledWith("second", {
    x: 210,
    y: 30,
  });
});
