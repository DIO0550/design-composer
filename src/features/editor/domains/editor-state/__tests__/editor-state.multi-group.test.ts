import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { childNames } from "./setup";

/*
 * 複数選んでいるノードをまとめて Box で包む（docs/06-ui.md「複数選択」のグループ化）。
 * 木の付け替えそのものは `design-document.group-siblings.test.ts` が持つ。ここで見るのは、
 * 対象が選択からどう決まり、履歴と選択がどうなるか。成立しない選択はどれも、1 つだけ
 * 選んだときに `some` になることを対照に置く。
 */

/**
 * home の下に a, b, badge（絶対配置）, group（左が背面）。group の子は inner。
 *
 * @returns そのドキュメントを開いた状態
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "a", type: "Text" },
            { name: "b", type: "Text" },
            {
              name: "badge",
              type: "Text",
              props: { placement: "absolute", x: 8, y: 8 },
            },
            {
              name: "group",
              type: "Box",
              children: [{ name: "inner", type: "Text" }],
            },
          ],
        },
      ],
    }),
  );
}

/**
 * 名前で指したものを選んでグループ化する。
 *
 * @param names 選ぶものの名前
 * @returns グループ化したあとの状態。グループ化できなければ `none`
 */
function groupSelecting(names: readonly string[]): Option<EditorState> {
  return EditorState.groupSelected(
    EditorState.selectNodes(setupState(), names),
  );
}

test("同じ親の兄弟を複数選んでグループ化すると、選んだものが新しい Box の子になる", () => {
  const grouped = Option.unwrap(groupSelecting(["b", "a"]));

  expect(childNames(grouped, "box")).toEqual(["a", "b"]);
});

test("まとめてグループ化すると、選択が新しい Box 1 つへ移る", () => {
  const grouped = Option.unwrap(groupSelecting(["a", "b"]));

  expect(
    DocumentSelection.names(EditorState.documentSelection(grouped)),
  ).toEqual(["box"]);
});

test("親が違うノードを選んでいるとグループ化できない", () => {
  expect([
    Option.isSome(groupSelecting(["a"])),
    Option.isSome(groupSelecting(["inner"])),
    Option.isSome(groupSelecting(["a", "inner"])),
  ]).toEqual([true, true, false]);
});

test("絶対配置とフローのノードが混ざっているとグループ化できない", () => {
  expect([
    Option.isSome(groupSelecting(["badge"])),
    Option.isSome(groupSelecting(["a", "badge"])),
  ]).toEqual([true, false]);
});

test("まとめてグループ化したあと、1 回の取り消しで元の並びに戻る", () => {
  const grouped = Option.unwrap(groupSelecting(["a", "b"]));

  const undone = Option.unwrap(EditorState.undo(grouped));

  expect(childNames(undone, "home")).toEqual(["a", "b", "badge", "group"]);
});

test("まとめてグループ化した直後に解除すると、包んだものがまとめて選ばれる", () => {
  const grouped = Option.unwrap(groupSelecting(["b", "a"]));

  const ungrouped = Option.unwrap(EditorState.ungroupSelected(grouped));

  expect(
    DocumentSelection.names(EditorState.documentSelection(ungrouped)),
  ).toEqual(["a", "b"]);
});
