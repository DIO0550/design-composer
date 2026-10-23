import { expect, test } from "vitest";
import {
  artboardHandle,
  canvasContent,
} from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { renderCanvas, snapGapLabels, snapGuides } from "./setup";
import { drawnFollowingFrames, setupSelection } from "./snap-artboards";

/*
 * artboard の移動で揃ったときのガイド線と、揃え先との隙間（docs/06-ui.md「artboard の移動」の辺のスナップ）。
 * 運んでいる最中にしか出ないので、離す前に見る。
 *
 * `second`（左 232）を左へ 29 運ぶと左辺は 203 まで来て、`first` の右辺 200 へ吸い付く。
 */

test("他の artboard の辺に吸い付いている間は、その辺の位置に線が 1 本出る", () => {
  renderCanvas({ selection: setupSelection() });
  drawnFollowingFrames();

  pressPointer(artboardHandle("second"), { x: 0, y: 0 });
  movePointer(canvasContent(), { x: -29, y: 30 });

  // `first` の右辺に中心を合わせ、`first` の上辺 0 から `second` の下辺 170 までをまたぐ
  expect(snapGuides()).toHaveLength(1);
  expect(snapGuides()[0].getAttribute("style")).toContain(
    "left: 199px; top: 0px; width: 2px; height: 170px",
  );
});

test("他の artboard の辺に吸い付いていて、揃え先から離れている間は、揃え先との隙間がドキュメント上の px で出る", () => {
  renderCanvas({ selection: setupSelection() });
  drawnFollowingFrames();

  // `first` の下辺 140 と `second` の上辺 200 の間は 60 空いている
  pressPointer(artboardHandle("second"), { x: 0, y: 0 });
  movePointer(canvasContent(), { x: -29, y: 200 });

  expect(snapGuides()).toHaveLength(1);
  expect(snapGapLabels()).toEqual(["60"]);
});

test("吸い付いたあとにどの線からも遠い位置へ動かし直すと、線が消える", () => {
  renderCanvas({ selection: setupSelection() });
  drawnFollowingFrames();

  // 2 回目は左辺 292・右辺 492・上辺 40 で、どの artboard の辺と中心線からも閾値の外
  pressPointer(artboardHandle("second"), { x: 0, y: 0 });
  movePointer(canvasContent(), { x: -29, y: 30 });
  movePointer(canvasContent(), { x: 60, y: 40 });

  expect(snapGuides()).toHaveLength(0);
});

test("離すと線は消える", () => {
  renderCanvas({ selection: setupSelection() });
  drawnFollowingFrames();

  pressPointer(artboardHandle("second"), { x: 0, y: 0 });
  movePointer(canvasContent(), { x: -29, y: 30 });
  expect(snapGuides()).toHaveLength(1);
  releasePointer(canvasContent(), { x: -29, y: 30 });

  expect(snapGuides()).toHaveLength(0);
});
