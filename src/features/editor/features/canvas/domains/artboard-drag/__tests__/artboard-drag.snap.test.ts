import { expect, test } from "vitest";
import { Offset } from "@/domains/unit/offset";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { Option } from "@/utils/Option";
import { ArtboardDrag } from "../index";
import {
  HomeDrawn,
  heldDrag,
  moveSnapped,
  pointerInputBy,
  StationaryDrawn,
  UnlaidOutDrawn,
} from "./held-drag";

test("揃え先の辺の近くまで運ぶと、運び先がその辺に揃う位置へ寄る", () => {
  // 右辺が 403 まで来る量。揃え先の左辺（400）へ 3px 寄らなければ x は 203 になる
  const dragging = moveSnapped(heldDrag(), pointerInputBy({ x: 103, y: 0 }), {
    carried: HomeDrawn,
    others: [StationaryDrawn],
  });

  expect(ArtboardDrag.preview(dragging, CanvasView.create())).toEqual(
    Option.some({ name: "home", canvasPosition: { x: 200, y: 40 } }),
  );
});

test("縦と横で別々の揃え先へ寄る", () => {
  /*
   * 右辺が 403（左の揃え先の左辺 400 の 3px 先）、上辺が 148（右の揃え先の上辺 150 の
   * 2px 手前）まで来る量。縦横で寄る向きも量も変えて、軸の取り違えを落とす。
   */
  const snapped = ArtboardDrag.snappedAt(
    heldDrag(),
    pointerInputBy({ x: 103, y: 108 }),
    {
      carried: HomeDrawn,
      others: [
        { left: 400, top: 500, width: 150, height: 80 },
        { left: 1000, top: 150, width: 150, height: 80 },
      ],
    },
  );

  expect(snapped.offset).toEqual({ x: -3, y: 2 });
});

test("中心線どうしが近ければ、中心線に揃う位置へ寄る", () => {
  // 左右の中心が 648 まで来る量。揃え先の中心（650）までは 2px で、辺どうしはどれも閾値の外
  const snapped = ArtboardDrag.snappedAt(
    heldDrag(),
    pointerInputBy({ x: 448, y: 0 }),
    {
      carried: HomeDrawn,
      others: [{ left: 600, top: 400, width: 100, height: 100 }],
    },
  );

  expect(snapped.offset).toEqual({ x: 2, y: 0 });
});

test("どの辺からも遠ければ、運び先は運んだ量そのまま", () => {
  const dragging = moveSnapped(heldDrag(), pointerInputBy({ x: 50, y: 30 }), {
    carried: HomeDrawn,
    others: [StationaryDrawn],
  });

  expect(ArtboardDrag.preview(dragging, CanvasView.create())).toEqual(
    Option.some({ name: "home", canvasPosition: { x: 150, y: 70 } }),
  );
});

test("倍率を上げていると、寄せたあとの運び先はドキュメント上の px へ割り戻される", () => {
  // 寄せたあとの画面上の量 100 は、倍率で割り戻してから掴んだ時点の座標へ足す
  const zoomed = CanvasView.zoomIn(CanvasView.zoomIn(CanvasView.create()));
  const dragging = moveSnapped(heldDrag(), pointerInputBy({ x: 103, y: 0 }), {
    carried: HomeDrawn,
    others: [StationaryDrawn],
  });

  const moved = Option.unwrap(ArtboardDrag.preview(dragging, zoomed));

  expect(moved.canvasPosition.x - 100).toBeCloseTo(100 / zoomed.scale);
});

test("掴んだだけのときは、描かれている矩形をポインタの移動量だけずらして判定する", () => {
  /*
   * 掴んだだけならまだずらして描いていないので、実測がそのまま起点になる。
   * 右辺が 405 まで来る量で、揃え先の左辺（400）へ 5px 寄る。
   */
  const snapped = ArtboardDrag.snappedAt(
    heldDrag(),
    pointerInputBy({ x: 105, y: 0 }),
    {
      carried: HomeDrawn,
      others: [StationaryDrawn],
    },
  );

  expect(snapped.offset).toEqual({ x: -5, y: 0 });
});

test("既に寄せて描かれている途中で動かしても、前回の寄せ量を二重に数えない", () => {
  /*
   * 1 回目で 103 運んで 3px 寄せたので、`home` は 100 ずれた 200 に描かれている。
   * 2 回目は掴んでから 105 の位置で、行き先の右辺は 405 → 5px 寄る。
   * 実測に乗っている前回の運搬ぶん（100）を差し引かないと、行き先が 305 から始まって
   * どこにも届かず寄らない。
   */
  const others = [StationaryDrawn];
  const dragging = moveSnapped(heldDrag(), pointerInputBy({ x: 103, y: 0 }), {
    carried: HomeDrawn,
    others,
  });

  const snapped = ArtboardDrag.snappedAt(
    dragging,
    pointerInputBy({ x: 105, y: 0 }),
    {
      carried: { ...HomeDrawn, left: 200 },
      others,
    },
  );

  expect(snapped.offset).toEqual({ x: -5, y: 0 });
});

test("閾値の内側に揃え先があっても、掴んでいないときは寄せ量が 0", () => {
  // 同じ実測とポインタで、掴んでいれば 3px 寄る（最初のテストの入力）
  const snapped = ArtboardDrag.snappedAt(
    ArtboardDrag.create(),
    pointerInputBy({ x: 103, y: 0 }),
    {
      carried: HomeDrawn,
      others: [StationaryDrawn],
    },
  );

  expect(snapped.offset).toEqual(Offset.Origin);
});

test("運んでいる artboard に大きさが無ければ寄せない", () => {
  /*
   * まだレイアウトされていない要素の実測は原点の 0×0 で返る。そこから行き先を作ると、
   * 左辺が 5 に来て揃え先の左辺（0）へ吸い付いてしまう。
   */
  const snapped = ArtboardDrag.snappedAt(
    heldDrag(),
    pointerInputBy({ x: 5, y: 0 }),
    UnlaidOutDrawn,
  );

  expect(snapped.offset).toEqual(Offset.Origin);
});
