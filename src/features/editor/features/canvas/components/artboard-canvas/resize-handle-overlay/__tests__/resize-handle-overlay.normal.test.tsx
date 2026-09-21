import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import type { ResizableSelection } from "@/features/editor/features/canvas/domains/node-resize";
import { Option } from "@/utils/Option";
import { ResizeHandleOverlay } from "../index";

/*
 * リサイズハンドルの描き方（docs/06-ui.md「リサイズハンドル」）。
 * どこに・どんなカーソルで出すかはここが決める。
 *
 * 矩形は props で受けるので、happy-dom がレイアウトを行わないことに影響されない。
 * 実際に枠線をまたいで見えることは Storybook のスクリーンショットで確かめる。
 */

/** 画面の (100, 50) に 200x100 で描かれている、という前提。右辺 x=300 / 下辺 y=150。 */
const PanelBounds: CanvasBounds = {
  left: 100,
  top: 50,
  width: 200,
  height: 100,
};

const WidthHandle = AxisLength.create("width", 200);
const HeightHandle = AxisLength.create("height", 100);

/** ドキュメントへ位置を書ける対象（artboard / 絶対配置のノード）。 */
function placed(lengths: readonly AxisLength[]): ResizableSelection {
  return { lengths, origin: Option.some({ x: 30, y: 70 }) };
}

/** 位置を書けない対象（フロー配置のノード）。 */
function unplaced(lengths: readonly AxisLength[]): ResizableSelection {
  return { lengths, origin: Option.none };
}

/** 出ているハンドルから、見たいスタイルだけを左上から時計回りの並びで取り出す。 */
function handleStyles(
  read: (style: CSSStyleDeclaration) => string,
): readonly string[] {
  return screen
    .getAllByTestId("resize-handle")
    .map((handle) => read(handle.style));
}

test("ハンドルは四隅と各辺の中間の 8 箇所に、辺をまたぐ位置で置かれる", () => {
  /*
   * 中心が辺に乗るので、左上は矩形の角から半分ぶん外へ出る（100 - 5 = 95）。
   * 位置を 1 箇所だけ見ると x と y の取り違えが残るので、8 箇所を並びごと比べる。
   */
  render(
    <ResizeHandleOverlay
      bounds={PanelBounds}
      resizable={placed([WidthHandle, HeightHandle])}
      isGrabbing={false}
      onGrab={() => {}}
    />,
  );

  expect(
    screen
      .getAllByTestId("resize-handle")
      .map((handle) => `${handle.style.left},${handle.style.top}`),
  ).toEqual([
    "95px,45px",
    "195px,45px",
    "295px,45px",
    "295px,95px",
    "295px,145px",
    "195px,145px",
    "95px,145px",
    "95px,95px",
  ]);
});

test("位置を持つ要素では、掴める箇所ごとの向きのカーソルが出る", () => {
  /*
   * 左上・右下は左上 - 右下の斜め、右上・左下は右上 - 左下の斜め。辺の中央はその軸。
   * 8 箇所を並びごと比べるのは、斜め 2 種類を取り違えた実装が 1 箇所だけでは残るため。
   */
  render(
    <ResizeHandleOverlay
      bounds={PanelBounds}
      resizable={placed([WidthHandle, HeightHandle])}
      isGrabbing={false}
      onGrab={() => {}}
    />,
  );

  expect(handleStyles((style) => style.cursor)).toEqual([
    "nwse-resize",
    "ns-resize",
    "nesw-resize",
    "ew-resize",
    "nwse-resize",
    "ns-resize",
    "nesw-resize",
    "ew-resize",
  ]);
});

test("位置を持たない要素では、始点側を含む箇所にカーソルが出ない", () => {
  /*
   * 反対の辺を留める位置を書けないので、左辺・上辺・左上は掴めない。右辺・下辺・
   * 右下が対照で、8 箇所すべてを殺した実装では落ちる。右上・左下は掴める軸だけが残る。
   */
  render(
    <ResizeHandleOverlay
      bounds={PanelBounds}
      resizable={unplaced([WidthHandle, HeightHandle])}
      isGrabbing={false}
      onGrab={() => {}}
    />,
  );

  expect(handleStyles((style) => style.cursor)).toEqual([
    "",
    "",
    "ew-resize",
    "ew-resize",
    "nwse-resize",
    "ns-resize",
    "ns-resize",
    "",
  ]);
});

test("右下の角では、掴める軸の数に応じてカーソルが変わる", () => {
  /*
   * 幅だけが固定なら角も 1 軸しか変えられないので、斜めではなく左右のカーソルを出す。
   * 2 軸のときだけ斜めになることは「位置を持つ要素では…」が見る。
   */
  render(
    <ResizeHandleOverlay
      bounds={PanelBounds}
      resizable={placed([WidthHandle])}
      isGrabbing={false}
      onGrab={() => {}}
    />,
  );

  expect(handleStyles((style) => style.cursor)[4]).toBe("ew-resize");
});

test("高さだけが固定なら、右下の角には上下のカーソルが出る", () => {
  // 幅側だけを見ていると、高さ側の枝を消しても気づけない（対で見る）
  render(
    <ResizeHandleOverlay
      bounds={PanelBounds}
      resizable={placed([HeightHandle])}
      isGrabbing={false}
      onGrab={() => {}}
    />,
  );

  expect(handleStyles((style) => style.cursor)[4]).toBe("ns-resize");
});

test("掴めない軸のハンドルにはカーソルが出ない", () => {
  /*
   * 幅だけが固定なら、下辺中央は掴めないのでカーソルも出ない。
   * 右辺中央が対照で、両方とも空になる実装では落ちる。
   */
  render(
    <ResizeHandleOverlay
      bounds={PanelBounds}
      resizable={placed([WidthHandle])}
      isGrabbing={false}
      onGrab={() => {}}
    />,
  );

  const cursors = handleStyles((style) => style.cursor);
  expect([cursors[3], cursors[5]]).toEqual(["ew-resize", ""]);
});

test("掴めないハンドルだけがポインタを受け取らない", () => {
  /*
   * 8 個すべてを透明にすると、下にあるノードは選べるがハンドルも掴めなくなる。
   * 掴める側が `auto` であることまで見ないと、その実装で通ってしまう。
   */
  render(
    <ResizeHandleOverlay
      bounds={PanelBounds}
      resizable={unplaced([WidthHandle, HeightHandle])}
      isGrabbing={false}
      onGrab={() => {}}
    />,
  );

  expect(handleStyles((style) => style.pointerEvents)).toEqual([
    "none",
    "none",
    "auto",
    "auto",
    "auto",
    "auto",
    "auto",
    "none",
  ]);
});

test("掴んでいる間はハンドルがポインタを受け取らない", () => {
  /*
   * 掴んだあとの移動と解放を受けるのはキャンバスの器なので、ハンドルが不透明のままだと
   * 追いかけてきたハンドルにポインタが乗った瞬間に器から離脱して取り消しになる。
   */
  render(
    <ResizeHandleOverlay
      bounds={PanelBounds}
      resizable={placed([WidthHandle, HeightHandle])}
      isGrabbing={true}
      onGrab={() => {}}
    />,
  );

  expect(handleStyles((style) => style.pointerEvents)).toEqual(
    Array(8).fill("none"),
  );
});
