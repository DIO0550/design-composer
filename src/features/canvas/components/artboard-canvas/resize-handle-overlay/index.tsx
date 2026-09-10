import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { AxisLength } from "@/domains/dcmp/axis-length";
import type { CanvasBounds } from "@/features/canvas/domains/canvas-bounds";
import {
  NodeResize,
  type ResizeGrip,
  type ResizeHandleAnchor,
} from "@/features/canvas/domains/node-resize";
import { Option } from "@/utils/Option";
import { SelectionColor } from "../artboard-frame-list";

/** 枠を含めたハンドル 1 個の一辺（UI 案 docs/Design Composer.html の 7px + 枠 1.5px ×2）。 */
const HandleSizePx = 10;

/** ハンドルの枠の太さ（UI 案の `border:1.5px solid`）。 */
const HandleBorderPx = 1.5;

/**
 * 掴めるものに出すカーソル。
 *
 * export しているのは、掴んでいる間のカーソルを器（`ArtboardCanvas`）が出すため（ハンド
 * ルはそのあいだポインタを通すので自分では出せず、別々に綴ると押す前と押している間で変
 * わる）。
 *
 * 掴んだ箇所で斜めの向きを出し分けていないのは、2 軸を掴めるのが右下の角だけで
 * `nwse-resize` に決まり、**どの入力でも同じ枝しか通らない**ため。右上・左下を掴めるよ
 * うにする回に持ち込む。
 *
 * @param grip 掴めるもの
 * @returns その掴み方で出すカーソル
 */
export function resizeCursor(grip: ResizeGrip): CSSProperties["cursor"] {
  switch (grip.kind) {
    case "width":
      return "ew-resize";
    case "height":
      return "ns-resize";
    case "both":
      return "nwse-resize";
  }
}

/**
 * ハンドル 1 個の見た目と位置。
 *
 * 中心を辺の上に置く（`- HandleSizePx / 2`）ので、選択の枠がハンドルの真ん中を通る。
 * artboard は `overflow:hidden` を持つが、このオーバーレイは artboard の外にあるので
 * はみ出した半分が切られない。
 *
 * @param anchor 出す箇所
 * @param bounds 選択中のものが描かれている矩形（器からの相対）
 * @param grab その箇所で今つかめるもの。掴めないなら `none`
 * @returns その箇所へ置くためのスタイル
 */
function handleStyle(
  anchor: ResizeHandleAnchor,
  bounds: CanvasBounds,
  grab: Option<ResizeGrip>,
): CSSProperties {
  return {
    position: "absolute",
    left: `${bounds.left + bounds.width * anchor.x - HandleSizePx / 2}px`,
    top: `${bounds.top + bounds.height * anchor.y - HandleSizePx / 2}px`,
    width: `${HandleSizePx}px`,
    height: `${HandleSizePx}px`,
    boxSizing: "border-box",
    background: "#fff",
    border: `${HandleBorderPx}px solid ${SelectionColor}`,
    borderRadius: "1px",
    cursor: grab.some ? resizeCursor(grab.value) : undefined,
    // 掴めない位置は透明にして、下にあるノードをクリックで選べるままにする
    pointerEvents: grab.some ? "auto" : "none",
  };
}

/**
 * 選択中の要素に重ねるリサイズハンドル（docs/06-ui.md「リサイズハンドル」）。
 *
 * `<style>` の差し込みではなく実要素で描くのは、**掴める位置にだけカーソルを出す**ため
 * （`cursor` は箱ごとにしか効かない）。掴んでいる間は**全部をポインタに対して透明にする
 * ** — 移動と解放を受けるのは器（`canvas-content`）で、不透明だと追いかけてきたハンドル
 * に乗った瞬間に器から離脱したことになる。
 *
 * 座標は器からの相対（`CanvasBounds.relativeTo`）。`fixed` を使う `DropMarker` と違うの
 * は、ハンドルが**選択している間ずっと出る**ため（`fixed` は器の `overflow` を抜けるの
 * で、パンして対象を画面外へ出すとペインの上に残る）。
 */
export function ResizeHandleOverlay({
  bounds,
  handles,
  isGrabbing,
  onGrab,
}: Readonly<{
  bounds: CanvasBounds;
  handles: readonly AxisLength[];
  isGrabbing: boolean;
  onGrab: (grip: ResizeGrip, event: ReactPointerEvent<HTMLElement>) => void;
}>) {
  return (
    /*
     * `pointer-events-none` は器そのものに要る。落とすと `inset-0` の透明な層が
     * キャンバス全面を覆い、ノードの選択もパンもできなくなる。
     * **`z-10` を落としてもテストは 1 件も落ちない**（happy-dom は重なりを持たない）。
     * 気づく手段は絵を見ることだけ。
     */
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {NodeResize.HandleAnchors.map((anchor) => {
        /*
         * 掴んでいる間は掴める箇所も `none` 扱いにする。カーソルと当たり判定が
         * 1 つの値から決まるので、片方だけ残ることがない。
         */
        const grab = isGrabbing
          ? Option.none
          : NodeResize.gripFor(handles, anchor);
        return (
          <div
            key={`${anchor.x},${anchor.y}`}
            data-testid="resize-handle"
            style={handleStyle(anchor, bounds, grab)}
            onPointerDown={
              grab.some ? (event) => onGrab(grab.value, event) : undefined
            }
          />
        );
      })}
    </div>
  );
}
