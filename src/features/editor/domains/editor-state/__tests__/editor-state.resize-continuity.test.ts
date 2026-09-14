import { expect, test } from "vitest";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { artboardWidth } from "@/features/editor/__tests__/artboard-fixtures";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/** 幅 360 の `home` を選んだ状態。ドラッグはこの幅から始まる。 */
function setupSelected(): EditorState {
  return EditorState.select(
    EditorState.create(
      DesignDocument.create({
        artboards: [{ name: "home", width: 360, height: 240, children: [] }],
      }),
    ),
    "home",
  );
}

/**
 * 1 回のドラッグぶんの反映。1 件目は別のまとまり、2 件目以降は続きとして送る。
 *
 * @param state 大きさを変えるエディタの状態
 * @param widths ポインタが動くたびに届く幅
 * @returns すべて反映したあとのエディタの状態
 */
function dragWidths(
  state: EditorState,
  widths: readonly number[],
): EditorState {
  return widths.reduce(
    (current, width, index) =>
      Option.unwrap(
        EditorState.resize(
          current,
          [AxisLength.create("width", width)],
          index === 0 ? EditContinuities.Separate : EditContinuities.Continued,
        ),
      ),
    state,
  );
}

test("1 回のドラッグの間に何度大きさを変えても、1 回戻せば掴む前の大きさに戻る", () => {
  const dragged = dragWidths(setupSelected(), [400, 450, 500]);

  const undone = Option.unwrap(EditorState.undo(dragged));

  // 掴む前の 360。途中の 450 に戻るなら、刻みごとに履歴が積まれている
  expect([
    artboardWidth(dragged, "home"),
    artboardWidth(undone, "home"),
  ]).toEqual([500, 360]);
});

test("続けて 2 回ドラッグしたら、1 回戻るのは直前のドラッグの前まで", () => {
  const first = dragWidths(setupSelected(), [400, 450]);
  const second = dragWidths(first, [600, 700]);

  const undone = Option.unwrap(EditorState.undo(second));

  // 2 回のドラッグが 1 件に畳まれるなら 360 まで戻ってしまう
  expect([
    artboardWidth(second, "home"),
    artboardWidth(undone, "home"),
  ]).toEqual([700, 450]);
});
