import { fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { DocumentSelection } from "@/domains/session/document-selection";
import { canvasContent } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  pressPointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { stubLayoutSize } from "@/features/editor/features/canvas/__tests__/canvas-measure";
import { Option } from "@/utils/Option";
import { drawnAt, renderCanvas, resizeHandleAt } from "./setup";

/*
 * 回って描かれているノードのリサイズを、ハンドルを押すところから通す
 * （docs/06-ui.md「リサイズハンドル」）。伸びる向き・置き直しの値そのものは
 * `node-resize.rotation` が持ち、ここは向きがドキュメントからハンドルまで届くことを見る。
 */

/** 200x100 の、(x, 10) に置かれた絶対配置の Box の props。 */
function placedBoxProps(x: number, rotation: number) {
  return {
    widthMode: "fixed",
    width: 200,
    heightMode: "fixed",
    height: 100,
    placement: "absolute",
    x,
    y: 10,
    rotation,
  };
}

/**
 * `home` に、90 度回した 200x100 の絶対配置のノード `turned` が (25, 10) に置かれ、
 * 90 度回した Box `tilted-frame` の中に回していない `inner` がいる状態。
 *
 * @param selectedName 選ぶものの名前
 * @returns ドキュメントと選択の対
 */
function setupSelection(selectedName = "turned"): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            {
              name: "turned",
              type: "Box",
              props: placedBoxProps(25, 90),
              children: [],
            },
            {
              name: "tilted-frame",
              type: "Box",
              props: { ...placedBoxProps(0, 90), width: 300, height: 200 },
              children: [
                {
                  name: "inner",
                  type: "Box",
                  props: placedBoxProps(0, 0),
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    }),
    [selectedName],
  );
}

/**
 * 90 度回った 200x100 のものとして描く。外接矩形は (100, 0) から 100x200 で、中心は
 * (150, 100)。回る前の大きさも差し替えるので、回った矩形の右辺の中点は (150, 200) に来る。
 *
 * @param name 描くものの名前
 * @returns 測定を差し替えたあとの要素
 */
function drawnTurned(name: string): HTMLElement {
  const element = drawnAt(name, { left: 100, top: 0, width: 100, height: 200 });
  stubLayoutSize(element, { width: 200, height: 100 });
  return element;
}

/**
 * 最後に通知された編集。
 *
 * @param onResize 通知を受けたモック
 * @returns 最後の通知の編集。通知が無ければテストを落とす
 */
function lastEdit(onResize: ReturnType<typeof vi.fn>): ResizeEdit {
  return Option.unwrap(Option.fromNullable(onResize.mock.lastCall?.[0]));
}

test("90 度回したノードの右辺のハンドルを画面の下へ引くと、幅が伸びる", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(), onResize });
  const turned = drawnTurned("turned");

  pressPointer(resizeHandleAt({ x: 1, y: 0.5 }), { x: 150, y: 200 });
  movePointer(turned, { x: 150, y: 230 });

  expect(lastEdit(onResize).lengths).toEqual([AxisLength.create("width", 230)]);
});

test("90 度回した絶対配置のノードは右辺を引いても、左辺が動かないよう位置も通知される", () => {
  /*
   * 中心まわりに回るので、幅が 30 伸びると中心は回る前の右へ 15、画面では下へ 15 動く。
   * 左上はそこから伸びた半分だけ戻るので (25 - 15, 10 + 15)。
   */
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(), onResize });
  const turned = drawnTurned("turned");

  pressPointer(resizeHandleAt({ x: 1, y: 0.5 }), { x: 150, y: 200 });
  movePointer(turned, { x: 150, y: 230 });

  const position = Option.unwrap(lastEdit(onResize).position);
  expect(position.x).toBeCloseTo(10);
  expect(position.y).toBeCloseTo(25);
});

test("90 度回したノードの回った右辺の帯を押して画面の下へ引くと、幅が伸びる", () => {
  // 外接矩形の右辺（x=200）ではなく、回った右辺（y=200）の少し内側を押す
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(), onResize });
  const turned = drawnTurned("turned");

  pressPointer(turned, { x: 150, y: 195 });
  movePointer(turned, { x: 150, y: 225 });

  expect(lastEdit(onResize).lengths).toEqual([AxisLength.create("width", 230)]);
});

test("測り直すと、90 度回したノードの右辺のハンドルは回った右辺の中点（画面の下）へ置かれる", () => {
  // 外接矩形の右辺の中点なら (200, 100)。器の矩形は happy-dom では 0
  renderCanvas({ selection: setupSelection() });
  drawnTurned("turned");

  fireEvent(globalThis.window, new Event("resize"));

  const rightEdge = resizeHandleAt({ x: 1, y: 0.5 });
  expect(Number.parseFloat(rightEdge.style.left)).toBeCloseTo(145);
  expect(Number.parseFloat(rightEdge.style.top)).toBeCloseTo(195);
});

test("回った Box の中の回していないノードも、ハンドルは画面上で回った右辺の中点へ置かれる", () => {
  // 自分の rotation は 0 なので、自分の向きで測ると外接矩形の右辺の中点 (200, 100) に出る
  renderCanvas({ selection: setupSelection("inner") });
  drawnTurned("inner");

  fireEvent(globalThis.window, new Event("resize"));

  const rightEdge = resizeHandleAt({ x: 1, y: 0.5 });
  expect(Number.parseFloat(rightEdge.style.left)).toBeCloseTo(145);
  expect(Number.parseFloat(rightEdge.style.top)).toBeCloseTo(195);
});

test("90 度回したノードの右辺のハンドルを掴んでいる間は、縦の矢印のカーソルが出る", () => {
  renderCanvas({ selection: setupSelection() });
  drawnTurned("turned");

  pressPointer(resizeHandleAt({ x: 1, y: 0.5 }), { x: 150, y: 200 });

  expect(canvasContent().style.cursor).toBe("ns-resize");
});
