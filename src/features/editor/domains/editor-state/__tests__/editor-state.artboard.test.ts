import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import {
  artboardNames,
  stateWithThreeArtboards,
} from "@/features/editor/__tests__/artboard-fixtures";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

function namesOf(state: EditorState): readonly string[] {
  return artboardNames(EditorState.document(state));
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
  const added = Option.unwrap(
    EditorState.addArtboard(stateWithThreeArtboards()),
  );

  expect(namesOf(added)).toEqual(["home", "settings", "about", "artboard"]);
});

test("追加した artboard が選択になる", () => {
  const state = EditorState.select(stateWithThreeArtboards(), "home");

  const added = Option.unwrap(EditorState.addArtboard(state));

  expect(EditorState.singleName(added)).toEqual(Option.some("artboard"));
});

test("追加した artboard をツリーが映す", () => {
  const state = EditorState.select(stateWithThreeArtboards(), "home");

  const added = Option.unwrap(EditorState.addArtboard(state));

  expect(currentArtboardName(added)).toEqual(Option.some("artboard"));
});

test("追加した artboard は子を持たない", () => {
  const added = Option.unwrap(
    EditorState.addArtboard(stateWithThreeArtboards()),
  );

  expect(
    Option.unwrap(
      DesignDocument.findArtboard(EditorState.document(added), "artboard"),
    ).children,
  ).toEqual([]);
});

test("追加を繰り返しても名前は重ならない", () => {
  const once = Option.unwrap(
    EditorState.addArtboard(stateWithThreeArtboards()),
  );

  const twice = Option.unwrap(EditorState.addArtboard(once));

  expect(namesOf(twice)).toEqual([
    "home",
    "settings",
    "about",
    "artboard",
    "artboard-2",
  ]);
});

test("追加は取り消せる", () => {
  const added = Option.unwrap(
    EditorState.addArtboard(stateWithThreeArtboards()),
  );

  const undone = Option.unwrap(EditorState.undo(added));

  expect(namesOf(undone)).toEqual(["home", "settings", "about"]);
});

test("選択中の artboard を削除するとその1枚が並びから消える", () => {
  const state = EditorState.select(stateWithThreeArtboards(), "home");

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect(namesOf(removed)).toEqual(["settings", "about"]);
});

test("artboard を削除すると配下のノードも消える", () => {
  const state = EditorState.select(stateWithThreeArtboards(), "home");

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect(
    DesignDocument.usedNames(EditorState.document(removed)).has("home-title"),
  ).toBe(false);
});

test("artboard を削除すると選択が外れる", () => {
  const state = EditorState.select(stateWithThreeArtboards(), "home");

  const removed = Option.unwrap(EditorState.removeSelected(state));

  expect(EditorState.singleName(removed)).toEqual(Option.none);
});

test("artboard を1つ後ろへ動かすと隣と入れ替わる", () => {
  const moved = Option.unwrap(
    EditorState.reorderArtboard(stateWithThreeArtboards(), {
      fromIndex: 0,
      toIndex: 1,
    }),
  );

  expect(namesOf(moved)).toEqual(["settings", "home", "about"]);
});

/*
 * 隣り合わない移動を見るのは、隣接移動だと移動元と移動先を取り違えても同じ並びに
 * なるため（`{0,1}` と `{1,0}` はどちらも先頭 2 枚が入れ替わった並びを作る）。
 */
test("先頭の artboard を末尾へ動かすと間の2枚が前へ詰まる", () => {
  const moved = Option.unwrap(
    EditorState.reorderArtboard(stateWithThreeArtboards(), {
      fromIndex: 0,
      toIndex: 2,
    }),
  );

  expect(namesOf(moved)).toEqual(["settings", "about", "home"]);
});

test("並べ替えても選んでいる artboard は選ばれたまま", () => {
  const state = EditorState.select(stateWithThreeArtboards(), "home");

  const moved = Option.unwrap(
    EditorState.reorderArtboard(state, { fromIndex: 0, toIndex: 2 }),
  );

  expect(EditorState.singleName(moved)).toEqual(Option.some("home"));
});

/*
 * 何も選んでいないときツリーが映すのは並びの先頭（`DocumentSelection.currentArtboard`）
 * なので、先頭を入れ替えると映る 1 枚も入れ替わる。並びを変えた結果として意図している。
 */
test("何も選んでいないときに並べ替えるとツリーが映す1枚も入れ替わる", () => {
  const moved = Option.unwrap(
    EditorState.reorderArtboard(stateWithThreeArtboards(), {
      fromIndex: 0,
      toIndex: 2,
    }),
  );

  expect(currentArtboardName(moved)).toEqual(Option.some("settings"));
});

test("並びの外を指す移動は起きない", () => {
  expect(
    EditorState.reorderArtboard(stateWithThreeArtboards(), {
      fromIndex: 0,
      toIndex: 3,
    }),
  ).toEqual(Option.none);
});
