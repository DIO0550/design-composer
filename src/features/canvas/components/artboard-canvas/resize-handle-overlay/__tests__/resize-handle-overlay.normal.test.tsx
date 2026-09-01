import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
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
      handles={[WidthHandle, HeightHandle]}
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

test("掴める軸のハンドルにはその軸のカーソルが出る", () => {
  // 2 軸とも掴めるとき、右辺中央が左右・下辺中央が上下。ほかは何も出さない
  render(
    <ResizeHandleOverlay
      bounds={PanelBounds}
      handles={[WidthHandle, HeightHandle]}
      isGrabbing={false}
      onGrab={() => {}}
    />,
  );

  expect(handleStyles((style) => style.cursor)).toEqual([
    "",
    "",
    "",
    "ew-resize",
    "",
    "ns-resize",
    "",
    "",
  ]);
});

test("掴めない軸のハンドルにはカーソルが出ない", () => {
  /*
   * 幅だけが固定なら、下辺中央は掴めないのでカーソルも出ない。
   * 右辺中央が対照で、両方とも空になる実装では落ちる。
   */
  render(
    <ResizeHandleOverlay
      bounds={PanelBounds}
      handles={[WidthHandle]}
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
   * 掴める 2 個が `auto` であることまで見ないと、その実装で通ってしまう。
   */
  render(
    <ResizeHandleOverlay
      bounds={PanelBounds}
      handles={[WidthHandle, HeightHandle]}
      isGrabbing={false}
      onGrab={() => {}}
    />,
  );

  expect(handleStyles((style) => style.pointerEvents)).toEqual([
    "none",
    "none",
    "none",
    "auto",
    "none",
    "auto",
    "none",
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
      handles={[WidthHandle, HeightHandle]}
      isGrabbing={true}
      onGrab={() => {}}
    />,
  );

  expect(handleStyles((style) => style.pointerEvents)).toEqual(
    Array(8).fill("none"),
  );
});
