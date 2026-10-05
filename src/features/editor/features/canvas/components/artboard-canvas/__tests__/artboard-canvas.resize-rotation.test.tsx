import { expect, test, vi } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { Option } from "@/utils/Option";
import { drawnAt, renderCanvas, resizeHandleAt } from "./setup";

/*
 * 回って描かれているノードのリサイズを、ハンドルを押すところから通す
 * （docs/06-ui.md「リサイズハンドル」）。伸びる向き・置き直しの値そのものは
 * `node-resize.rotation` が持ち、ここは向きがドキュメントからハンドルまで届くことを見る。
 */

/** `home` に、90 度回した 200x100 の絶対配置のノード `turned` が (25, 10) に置かれた状態。 */
function setupSelection(): DocumentSelection {
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
              props: {
                widthMode: "fixed",
                width: 200,
                heightMode: "fixed",
                height: 100,
                placement: "absolute",
                x: 25,
                y: 10,
                rotation: 90,
              },
              children: [],
            },
          ],
        },
      ],
    }),
    ["turned"],
  );
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
  const turned = drawnAt("turned", {
    left: 100,
    top: 0,
    width: 100,
    height: 200,
  });

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
  const turned = drawnAt("turned", {
    left: 100,
    top: 0,
    width: 100,
    height: 200,
  });

  pressPointer(resizeHandleAt({ x: 1, y: 0.5 }), { x: 150, y: 200 });
  movePointer(turned, { x: 150, y: 230 });

  const position = Option.unwrap(lastEdit(onResize).position);
  expect(position.x).toBeCloseTo(10);
  expect(position.y).toBeCloseTo(25);
});
