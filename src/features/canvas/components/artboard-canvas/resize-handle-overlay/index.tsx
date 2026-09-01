import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import type { AxisLength } from "@/domains/dcmp/axis-length";
import { Axes, type Axis } from "@/domains/unit/axis";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import {
  NodeResize,
  type ResizeHandlePlacement,
} from "@/features/canvas/domains/node-resize";
import { Option } from "@/utils/Option";
import { SelectionColor } from "../artboard-frame-list";

/** 枠を含めたハンドル 1 個の一辺（UI 案 docs/Design Composer.html の 7px + 枠 1.5px ×2）。 */
const HandleSizePx = 10;

/** ハンドルの枠の太さ（UI 案の `border:1.5px solid`）。 */
const HandleBorderPx = 1.5;

/**
 * 掴める軸ごとのカーソル。どちらの向きへ動かせるかを指す綴りで、軸から一意に
 * 決まるので位置ごとには持たない。
 */
const AxisCursors = {
  [Axes.Width]: "ew-resize",
  [Axes.Height]: "ns-resize",
} as const satisfies Record<Axis, CSSProperties["cursor"]>;

/**
 * ハンドル 1 個の見た目と位置。
 *
 * 中心を辺の上に置く（`- HandleSizePx / 2`）ので、選択の枠がハンドルの真ん中を通る。
 * artboard は `overflow:hidden` を持つが、このオーバーレイは artboard の外にあるので
 * はみ出した半分が切られない。
 *
 * @param placement 出す位置
 * @param bounds 選択中のものが描かれている矩形（器からの相対）
 * @param grab その位置で今つかめるハンドル。掴めないなら `none`
 * @returns その位置へ置くためのスタイル
 */
function handleStyle(
  placement: ResizeHandlePlacement,
  bounds: CanvasBounds,
  grab: Option<AxisLength>,
): CSSProperties {
  return {
    position: "absolute",
    left: `${bounds.left + bounds.width * placement.x - HandleSizePx / 2}px`,
    top: `${bounds.top + bounds.height * placement.y - HandleSizePx / 2}px`,
    width: `${HandleSizePx}px`,
    height: `${HandleSizePx}px`,
    boxSizing: "border-box",
    background: "#fff",
    border: `${HandleBorderPx}px solid ${SelectionColor}`,
    borderRadius: "1px",
    cursor: grab.some ? AxisCursors[grab.value.axis] : undefined,
    // 掴めない位置は透明にして、下にあるノードをクリックで選べるままにする
    pointerEvents: grab.some ? "auto" : "none",
  };
}

/**
 * 選択中の要素に重ねるリサイズハンドル（docs/06-ui.md「リサイズハンドル」）。
 *
 * `<style>` の差し込みではなく実要素で描くのは、**掴める位置にだけカーソルを出す**ため。
 * CSS の `cursor` は箱ごとにしか効かないので、擬似要素 1 つに背景で 8 個描く形では
 * 要素全体が同じカーソルになってしまう。実要素にしたことで、辺をまたぐ配置と
 * UI 案の角丸（`border-radius:1px`）も同時に戻せている。
 *
 * 掴んでいる間は**全部をポインタに対して透明にする**。掴んだあとの移動と解放を
 * 受けるのはキャンバスの器（`canvas-content`）で、ハンドルが不透明のままだと
 * 追いかけてきたハンドルにポインタが乗った瞬間に器から離脱したことになり、
 * 取り消し（`onPointerLeave`）が飛ぶ。
 *
 * 座標は器からの相対（`CanvasBounds.relativeTo`）。`position:fixed` で client 座標を
 * そのまま使う `DropMarker` と違うのは、ハンドルが**選択している間ずっと出る**ため。
 * `fixed` は器の `overflow` を抜けるので、選択したままパンして対象を画面外へ出すと
 * 左右のペインの上にハンドルが残ってしまう。
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
  onGrab: (handle: AxisLength, event: ReactPointerEvent<HTMLElement>) => void;
}>) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {NodeResize.Placements.map((placement) => {
        /*
         * 掴んでいる間は掴める位置も `none` 扱いにする。カーソルと当たり判定が
         * 1 つの値から決まるので、片方だけ残ることがない。
         */
        const grab = isGrabbing
          ? Option.none
          : NodeResize.handleFor(handles, placement);
        return (
          <div
            key={`${placement.x},${placement.y}`}
            data-testid="resize-handle"
            style={handleStyle(placement, bounds, grab)}
            onPointerDown={
              grab.some ? (event) => onGrab(grab.value, event) : undefined
            }
          />
        );
      })}
    </div>
  );
}
