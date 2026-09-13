import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { childNames, stateWithDeepBranch } from "./setup";

/*
 * 選択を Box で包む / 包んでいた Box を外す（docs/06-ui.md「編集操作の一覧」のグループ化・
 * グループ解除）。木の付け替えそのものは `design-document.group.test.ts` が持つ。ここで見る
 * のは、対象が選択からどう決まり、履歴と選択がどうなるか。
 */

test("ノードを選んでグループ化すると、そのノードが新しい Box の子になる", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "sibling-panel");

  const grouped = Option.unwrap(EditorState.groupSelected(selected));

  expect(childNames(grouped, "box")).toEqual(["sibling-panel"]);
});

test("グループ化すると、選択が新しい Box へ移る", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "sibling-panel");

  const grouped = Option.unwrap(EditorState.groupSelected(selected));

  expect(EditorState.singleName(grouped)).toEqual(Option.some("box"));
});

test("box が既に使われているとき、グループ化で作られる Box は別の名前になる", () => {
  const state = EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "box", type: "Box", children: [] },
            { name: "title", type: "Text" },
          ],
        },
      ],
    }),
  );

  const grouped = Option.unwrap(
    EditorState.groupSelected(EditorState.select(state, "title")),
  );

  expect(EditorState.singleName(grouped)).toEqual(Option.some("box-2"));
});

test("グループ化を取り消すと元の並びに戻る", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "sibling-panel");
  const grouped = Option.unwrap(EditorState.groupSelected(selected));

  const undone = Option.unwrap(EditorState.undo(grouped));

  expect(childNames(undone, "home")).toEqual([
    "outer-panel",
    "sibling-panel",
    "home-login",
  ]);
});

test("Box を選んで解除すると、その子が親へ戻る", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "inner-panel");

  const ungrouped = Option.unwrap(EditorState.ungroupSelected(selected));

  expect(childNames(ungrouped, "outer-panel")).toEqual(["deep-title"]);
});

test("解除すると、親へ戻った子が選択される", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "inner-panel");

  const ungrouped = Option.unwrap(EditorState.ungroupSelected(selected));

  expect(EditorState.singleName(ungrouped)).toEqual(Option.some("deep-title"));
});

test("子が 2 つ以上ある Box を解除すると、戻った子がまとめて選択される", () => {
  const state = EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            {
              name: "box",
              type: "Box",
              children: [
                { name: "first", type: "Text" },
                { name: "second", type: "Text" },
              ],
            },
          ],
        },
      ],
    }),
  );

  const ungrouped = Option.unwrap(
    EditorState.ungroupSelected(EditorState.select(state, "box")),
  );

  expect(
    DocumentSelection.names(EditorState.documentSelection(ungrouped)),
  ).toEqual(["first", "second"]);
});

test("グループ化した直後に解除すると、並びが元へ戻る", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "sibling-panel");
  const grouped = Option.unwrap(EditorState.groupSelected(selected));

  const ungrouped = Option.unwrap(EditorState.ungroupSelected(grouped));

  expect(childNames(ungrouped, "home")).toEqual([
    "outer-panel",
    "sibling-panel",
    "home-login",
  ]);
});

test("グループ化した直後に解除すると、元と同じものが選ばれた状態へ戻る", () => {
  const selected = EditorState.select(stateWithDeepBranch(), "sibling-panel");
  const grouped = Option.unwrap(EditorState.groupSelected(selected));

  const ungrouped = Option.unwrap(EditorState.ungroupSelected(grouped));

  expect(EditorState.singleName(ungrouped)).toEqual(
    Option.some("sibling-panel"),
  );
});

/**
 * 子を並べない Box（`layout: free`）の中に、`widthMode: fill` の子を抱えた Box が居る状態。
 *
 * @returns その並びを持つエディタの状態
 */
function stateWithFillInsideFreeParent(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            {
              name: "free-panel",
              type: "Box",
              props: { layout: "free" },
              children: [
                {
                  name: "box",
                  type: "Box",
                  children: [
                    {
                      name: "filled",
                      type: "Box",
                      props: { widthMode: "fill" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  );
}

test("子を並べない Box の中でも解除できる", () => {
  const selected = EditorState.select(stateWithFillInsideFreeParent(), "box");

  const ungrouped = Option.unwrap(EditorState.ungroupSelected(selected));

  expect(childNames(ungrouped, "free-panel")).toEqual(["filled"]);
});

test("子を並べない Box の直下へ fill の子が出た解除は、ドキュメントの不正として現れる", () => {
  const selected = EditorState.select(stateWithFillInsideFreeParent(), "box");

  const ungrouped = Option.unwrap(EditorState.ungroupSelected(selected));

  expect(
    EditorState.documentErrors(ungrouped).map((error) => error.kind),
  ).toEqual(["fill-in-free-parent"]);
});
