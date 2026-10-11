import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { TokenSet } from "@/domains/dcmp/token";
import {
  EditContinuities,
  type EditContinuity,
} from "@/domains/session/edit-continuity";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/** `primary` が `#000000` の色を選んだ状態。ピッカーはこの色から動かし始める。 */
function setupSelected(): EditorState {
  return EditorState.selectToken(
    EditorState.create(
      DesignDocument.create({
        tokens: { ...TokenSet.empty(), colors: { primary: "#000000" } },
      }),
    ),
    { kind: "colors", name: "primary" },
  );
}

/**
 * 色を続けて送ったぶんの反映。
 *
 * @param state 値を差し替えるエディタの状態
 * @param edits 届く色と、それぞれの直前の編集との続き方
 * @returns すべて反映したあとのエディタの状態
 */
function sendColors(
  state: EditorState,
  edits: readonly Readonly<{ color: string; continuity: EditContinuity }>[],
): EditorState {
  return edits.reduce(
    (current, edit) =>
      Option.unwrap(
        EditorState.setTokenValue(
          current,
          { kind: "colors", value: edit.color },
          edit.continuity,
        ),
      ),
    state,
  );
}

function primaryOf(state: EditorState): Option<string> {
  return Option.map(EditorState.selectedToken(state), (token) =>
    String(token.value),
  );
}

test("続きとして送った値は 1 回の Undo で最初の値まで戻る", () => {
  const edited = sendColors(setupSelected(), [
    { color: "#ff0000", continuity: EditContinuities.Separate },
    { color: "#00ff00", continuity: EditContinuities.Continued },
  ]);

  const undone = Option.unwrap(EditorState.undo(edited));

  expect(primaryOf(undone)).toEqual(Option.some("#000000"));
});

test("別のまとまりとして送った値は 1 回の Undo で直前の値までしか戻らない", () => {
  const edited = sendColors(setupSelected(), [
    { color: "#ff0000", continuity: EditContinuities.Separate },
    { color: "#00ff00", continuity: EditContinuities.Separate },
  ]);

  const undone = Option.unwrap(EditorState.undo(edited));

  expect(primaryOf(undone)).toEqual(Option.some("#ff0000"));
});
