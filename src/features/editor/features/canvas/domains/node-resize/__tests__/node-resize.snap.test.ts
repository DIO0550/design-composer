import { expect, test } from "vitest";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import type { Offset } from "@/domains/unit/offset";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { SideSnap } from "@/features/editor/features/canvas/domains/side-snap";
import { Option } from "@/utils/Option";
import { NodeResize, type ResizeHandleAnchor } from "../index";
import {
  grabbedAt,
  heldAt,
  setupBounds,
  setupResizable,
  setupView,
} from "./setup";

/*
 * 掴む要素は `setupBounds` の矩形（左 100 / 右 300 / 上 50 / 下 150）に描かれている。
 * 揃え先は、見ている辺以外がどの辺からも遠い位置に置く。
 */

/** 右辺が 340 にある、幅 300 の揃え先（上下の辺は 400 / 420 で遠い）。 */
const RightAt340: CanvasBounds = { left: 40, top: 400, width: 300, height: 20 };

/**
 * その箇所を押して掴み、掴んだ時点の矩形とその揃え先で辺のスナップの組を載せた状態。
 *
 * @param anchor 押した箇所
 * @param pointerOrigin 押した位置
 * @param stationary 揃え先の矩形の並び
 * @returns 掴んだ状態
 */
function grabbedWithSnap(
  anchor: ResizeHandleAnchor,
  pointerOrigin: Offset,
  stationary: readonly CanvasBounds[],
): NodeResize {
  return NodeResize.grab(
    NodeResize.withSideSnap(
      heldAt(setupResizable(), anchor, pointerOrigin),
      SideSnap.create(setupBounds(), stationary),
    ),
  );
}

test("右辺を掴んで揃え先の右辺の近くまで運ぶと、右辺が揃う幅の編集になる", () => {
  const resize = grabbedWithSnap({ x: 1, y: 0.5 }, { x: 300, y: 100 }, [
    RightAt340,
  ]);

  // 寄せが無ければ右辺は 337 で幅 237
  expect(NodeResize.editAt(resize, { x: 337, y: 100 }, setupView())).toEqual(
    Option.some(ResizeEdit.create([{ axis: "width", length: 240 }])),
  );
});

test("辺のスナップの組を載せていない掴みでは、揃え先の近くでも寄せない", () => {
  // 上と同じ動かし方。載せていれば 240 になる
  const resize = grabbedAt(
    setupResizable(),
    { x: 1, y: 0.5 },
    { x: 300, y: 100 },
  );

  expect(NodeResize.editAt(resize, { x: 337, y: 100 }, setupView())).toEqual(
    Option.some(ResizeEdit.create([{ axis: "width", length: 237 }])),
  );
});

test("掴んだ時点で揃え先の辺の 4px 手前にあると、1px 動かしただけで揃う幅まで伸びる", () => {
  const rightAt304: CanvasBounds = {
    left: 4,
    top: 400,
    width: 300,
    height: 20,
  };
  const resize = grabbedWithSnap({ x: 1, y: 0.5 }, { x: 300, y: 100 }, [
    rightAt304,
  ]);

  expect(NodeResize.editAt(resize, { x: 301, y: 100 }, setupView())).toEqual(
    Option.some(ResizeEdit.create([{ axis: "width", length: 204 }])),
  );
});

test("右下の角を掴むと、幅と高さがそれぞれ掴んだ辺で揃う位置まで寄る", () => {
  // 下辺が 180 にある揃え先（左右の辺は 600 / 640 で遠い）
  const bottomAt180: CanvasBounds = {
    left: 600,
    top: 80,
    width: 40,
    height: 100,
  };
  const resize = grabbedWithSnap({ x: 1, y: 1 }, { x: 300, y: 150 }, [
    RightAt340,
    bottomAt180,
  ]);

  // 寄せが無ければ幅 237・高さ 126
  expect(NodeResize.editAt(resize, { x: 337, y: 176 }, setupView())).toEqual(
    Option.some(
      ResizeEdit.create([
        { axis: "width", length: 240 },
        { axis: "height", length: 130 },
      ]),
    ),
  );
});

test("左辺を掴んで揃え先の左辺の近くまで運ぶと、揃う位置と幅の両方が書かれる", () => {
  // 左辺が 130 にある揃え先（右辺は 630 で遠い）
  const leftAt130: CanvasBounds = {
    left: 130,
    top: 400,
    width: 500,
    height: 20,
  };
  const resize = grabbedWithSnap({ x: 0, y: 0.5 }, { x: 100, y: 100 }, [
    leftAt130,
  ]);

  // 寄せが無ければ幅 167・位置 x 63。右辺（300）はそのまま留まる
  expect(NodeResize.editAt(resize, { x: 133, y: 100 }, setupView())).toEqual(
    Option.some(
      ResizeEdit.placedAt([{ axis: "width", length: 170 }], { x: 60, y: 70 }),
    ),
  );
});

test("拡大して見ているときは、画面上で揃う長さをドキュメント上の長さへ直し、整数へ丸める", () => {
  // 右辺が 341 にある揃え先
  const rightAt341: CanvasBounds = {
    left: 41,
    top: 400,
    width: 300,
    height: 20,
  };
  const resize = grabbedWithSnap({ x: 1, y: 0.5 }, { x: 300, y: 100 }, [
    rightAt341,
  ]);
  // 1 段階だけ拡大して見ている状態（倍率 1.2）
  const zoomedIn = CanvasView.zoomIn(CanvasView.create());

  // 画面上で 41 伸びる = ドキュメント上で 34.17。寄せが無ければ 38 / 1.2 = 31.67 で 232
  expect(NodeResize.editAt(resize, { x: 338, y: 100 }, zoomedIn)).toEqual(
    Option.some(ResizeEdit.create([{ axis: "width", length: 234 }])),
  );
});
