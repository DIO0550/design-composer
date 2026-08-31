import { expect, test } from "vitest";
import {
  artboardFrameContainer,
  canvasContent,
} from "@/features/canvas/__tests__/canvas-elements";
import { renderCanvas, selectionFromArtboards } from "./setup";

/**
 * artboard 1 枚ぶんの器。
 *
 * @param name 引く artboard の名前
 * @returns その artboard の器
 */
function frameContainerOf(name: string): HTMLElement {
  return artboardFrameContainer(canvasContent(), name);
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
