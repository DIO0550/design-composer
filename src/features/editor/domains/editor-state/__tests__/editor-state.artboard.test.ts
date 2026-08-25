import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { stateWithTwoArtboards } from "./setup";

function artboardNames(state: EditorState): readonly string[] {
  return EditorState.document(state).artboards.map((artboard) => artboard.name);
}

/**
 * 今ツリーが映している 1 枚の名前。並べ替え・削除がここへどう出るかを見る。
 *
 * @param state 読み出し元のエディタの状態
 * @returns 映している artboard の名前。1 枚も無ければ `none`
 */
function currentArtboardName(state: EditorState): Option<string> {
  return Option.map(
    DocumentSelection.currentArtboard(EditorState.documentSelection(state)),
    (artboard) => artboard.name,
  );
}

test("artboard を追加すると並びの末尾に1枚増える", () => {
  const added = Option.unwrap(EditorState.addArtboard(stateWithTwoArtboards()));

  expect(artboardNames(added)).toEqual(["home", "settings", "artboard"]);
});

test("追加した artboard が選択になる", () => {
  const state = EditorState.select(stateWithTwoArtboards(), "home");

  const added = Option.unwrap(EditorState.addArtboard(state));

  expect(EditorState.singleName(added)).toEqual(Option.some("artboard"));
});

test("追加した artboard をツリーが映す", () => {
  const state = EditorState.select(stateWithTwoArtboards(), "home");

  const added = Option.unwrap(EditorState.addArtboard(state));

  expect(currentArtboardName(added)).toEqual(Option.some("artboard"));
});

test("追加を繰り返しても名前は重ならない", () => {
  const once = Option.unwrap(EditorState.addArtboard(stateWithTwoArtboards()));

  const twice = Option.unwrap(EditorState.addArtboard(once));

  expect(artboardNames(twice)).toEqual([
    "home",
    "settings",
    "artboard",
    "artboard-2",
  ]);
});

test("追加は取り消せる", () => {
  const added = Option.unwrap(EditorState.addArtboard(stateWithTwoArtboards()));

  const undone = Option.unwrap(EditorState.undo(added));

  expect(artboardNames(undone)).toEqual(["home", "settings"]);
});

test("選択中の artboard を削除するとその1枚が並びから消える", () => {
  const state = EditorState.select(stateWithTwoArtboards(), "home");

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect(artboardNames(removed)).toEqual(["settings"]);
});

test("artboard を削除すると配下のノードも消える", () => {
  const state = EditorState.select(stateWithTwoArtboards(), "home");

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect(
    DesignDocument.usedNames(EditorState.document(removed)).has("home-title"),
  ).toBe(false);
});

test("artboard を削除すると選択が外れる", () => {
  const state = EditorState.select(stateWithTwoArtboards(), "home");

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect(EditorState.singleName(removed)).toEqual(Option.none);
});

test("artboard を1つ後ろへ動かすと並び順が入れ替わる", () => {
  const moved = Option.unwrap(
    EditorState.reorderArtboard(stateWithTwoArtboards(), {
      fromIndex: 0,
      toIndex: 1,
    }),
  );

  expect(artboardNames(moved)).toEqual(["settings", "home"]);
});

test("並べ替えても選んでいる artboard は選ばれたまま", () => {
  const state = EditorState.select(stateWithTwoArtboards(), "home");

  const moved = Option.unwrap(
    EditorState.reorderArtboard(state, { fromIndex: 0, toIndex: 1 }),
  );

  expect(EditorState.singleName(moved)).toEqual(Option.some("home"));
});

/*
 * 何も選んでいないときツリーが映すのは並びの先頭（`DocumentSelection.currentArtboard`）
 * なので、先頭を入れ替えると映る 1 枚も入れ替わる。並びを変えた結果として意図している。
 */
test("何も選んでいないときに並べ替えるとツリーが映す1枚も入れ替わる", () => {
  const moved = Option.unwrap(
    EditorState.reorderArtboard(stateWithTwoArtboards(), {
      fromIndex: 0,
      toIndex: 1,
    }),
  );

  expect(currentArtboardName(moved)).toEqual(Option.some("settings"));
});

test("並びの外を指す移動は起きない", () => {
  expect(
    EditorState.reorderArtboard(stateWithTwoArtboards(), {
      fromIndex: 0,
      toIndex: 2,
    }),
  ).toEqual(Option.none);
});
