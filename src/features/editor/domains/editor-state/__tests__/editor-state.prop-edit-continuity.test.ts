import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node, PropEdit, type PropValue } from "@/domains/dcmp/node";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/*
 * `editor-state.resize-continuity.test.ts` と主張は同じに見えるが、そちらが固定するのは
 * `resize` が受けた続き方を履歴へ渡すことで、`applyPropEdit` を `Separate` 固定に壊しても
 * 落ちない。
 */

/** 幅 200 の `panel` を選んだ状態。打ち込みはこの幅から始まる。 */
function setupSelected(): EditorState {
  return EditorState.select(
    EditorState.create(
      DesignDocument.create({
        artboards: [
          {
            name: "home",
            width: 360,
            height: 240,
            children: [
              {
                name: "panel",
                type: "Box",
                props: { widthMode: "fixed", width: 200 },
              },
            ],
          },
        ],
      }),
    ),
    "panel",
  );
}

/**
 * 1 つの欄へ続けて打ったぶんの反映。1 打鍵目は別のまとまり、2 打鍵目以降は続きとして送る。
 *
 * @param state prop を書き換えるエディタの状態
 * @param widths 打鍵のたびに届く幅
 * @returns すべて反映したあとのエディタの状態
 */
function typeWidths(
  state: EditorState,
  widths: readonly number[],
): EditorState {
  return widths.reduce(
    (current, width, index) =>
      Option.unwrap(
        EditorState.applyPropEdit(
          current,
          PropEdit.set(["width"], width),
          index === 0 ? EditContinuities.Separate : EditContinuities.Continued,
        ),
      ),
    state,
  );
}

/**
 * その状態の `panel` の幅。
 *
 * @param state 幅を読むエディタの状態
 * @returns `panel` に設定されている `width`
 */
function panelWidth(state: EditorState): PropValue {
  const panel = Option.unwrap(
    DesignDocument.findNode(EditorState.document(state), "panel"),
  );
  return Option.unwrap(
    Node.isPrimitive(panel)
      ? Option.fromNullable(panel.props?.width)
      : Option.none,
  );
}

test("1 つの欄へ何度打ち込んでも、1 回戻せば打ち始める前の値に戻る", () => {
  const typed = typeWidths(setupSelected(), [1, 12, 120]);

  const undone = Option.unwrap(EditorState.undo(typed));

  // 打ち始める前の 200。途中の 12 に戻るなら、打鍵ごとに履歴が積まれている
  expect([panelWidth(typed), panelWidth(undone)]).toEqual([120, 200]);
});

/*
 * 1 件目とは別の仕様（打ち込みを続けても、まとまりをまたいでは畳まれない）を固定する。
 * 1 件目は続き方を無視する壊し方のどちらでも落ちるが、まとまりが 2 つに分かれることまでは
 * 見ていない。
 */
test("続けて 2 回打ち込んだら、1 回戻るのは直前の打ち込みの前まで", () => {
  const first = typeWidths(setupSelected(), [1, 12]);
  const second = typeWidths(first, [3, 34]);

  const undone = Option.unwrap(EditorState.undo(second));

  // 2 回の打ち込みが 1 件に畳まれるなら 200 まで戻ってしまう
  expect([panelWidth(second), panelWidth(undone)]).toEqual([34, 12]);
});
