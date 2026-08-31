import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { renderCanvas, selectionFromArtboards } from "./setup";

/**
 * artboard の枠を載せている要素。枠そのものは `role="button"` で、
 * 座標を持つのはそれを包む `li`（見出しと枠をまとめた 1 枚ぶん）。
 *
 * @param name 引く artboard の名前
 * @returns その artboard の 1 枚ぶんを包む要素
 */
function frameContainerOf(name: string): HTMLElement {
  const frame = screen.getByRole("button", { name });
  const container = frame.closest("li");
  if (container === null) {
    // 枠は必ず 1 枚ぶんの器の中にある（来たら描画の組み立てが壊れている）
    throw new Error(`${name} の器が見つからない`);
  }
  return container;
}

test("ファイルに書かれた座標を持つ artboard は、その座標に描かれる", () => {
  /*
   * 自動配置では絶対に来ない座標にする。原点や「2 枚目の自動配置の位置」を選ぶと、
   * 座標を読まない実装でも同じ答えになる。
   */
  const selection = selectionFromArtboards([
    { name: "home", width: 360, height: 240, children: [] },
    {
      name: "placed",
      width: 360,
      height: 240,
      canvasPosition: { x: 900, y: 300 },
      children: [],
    },
  ]);

  renderCanvas({ selection });

  expect(frameContainerOf("placed").style.left).toBe("900px");
  expect(frameContainerOf("placed").style.top).toBe("300px");
});

test("座標を持たない artboard は、直前までの自動配置の右隣に描かれる", () => {
  const selection = selectionFromArtboards([
    { name: "home", width: 360, height: 240, children: [] },
    { name: "empty", width: 360, height: 240, children: [] },
  ]);

  renderCanvas({ selection });

  // 360（1 枚目の幅）+ 32（間隔）
  expect(frameContainerOf("empty").style.left).toBe("392px");
});

test("座標平面には、並び全体の大きさが与えられる", () => {
  /*
   * 大きさはリサイズ中のポインタを受ける範囲を決めるので、`ul` へ届いていないと
   * 辺を外へ引いたときに追従が切れる。ドメイン側の計算とは別に、配線を見る。
   */
  const selection = selectionFromArtboards([
    { name: "home", width: 360, height: 240, children: [] },
    {
      name: "placed",
      width: 360,
      height: 240,
      canvasPosition: { x: 900, y: 300 },
      children: [],
    },
  ]);

  renderCanvas({ selection });

  const plane = frameContainerOf("home").parentElement;
  // 900 + 360 / 300 + 240（いちばん右下に届くのは座標を持つ 1 枚）
  expect(plane?.style.width).toBe("1260px");
  expect(plane?.style.height).toBe("540px");
});
