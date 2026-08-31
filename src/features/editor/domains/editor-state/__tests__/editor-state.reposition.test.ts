import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/** 絶対配置の `badge` を 1 つ持つ状態。座標は既定と違う値から始める。 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            {
              name: "badge",
              type: "Text",
              props: { placement: "absolute", x: 40, y: 24 },
            },
          ],
        },
      ],
    }),
  );
}

/** その状態での `badge` の props。 */
function badgeProps(state: EditorState): Readonly<Record<string, unknown>> {
  const node = Option.unwrap(
    DesignDocument.findNode(EditorState.document(state), "badge"),
  );
  return Node.isPrimitive(node) ? (node.props ?? {}) : {};
}

test("座標を置き直すと縦横とも新しい値になる", () => {
  const repositioned = EditorState.reposition(setupState(), "badge", {
    mode: "absolute",
    x: 70,
    y: 12,
  });

  expect(badgeProps(Option.unwrap(repositioned))).toMatchObject({
    x: 70,
    y: 12,
  });
});

test("選んでいないノードでも座標を置き直せる（キャンバスのドラッグは選択を変えない）", () => {
  const state = setupState();

  // 選択が無い（= プロパティパネル経由の編集は成立しない）ことを前提に置く
  expect(EditorState.singleName(state)).toEqual(Option.none);
  expect(
    EditorState.reposition(state, "badge", { mode: "absolute", x: 70, y: 12 })
      .some,
  ).toBe(true);
});

test("置き直したあと 1 回戻すと縦横とも元の座標に戻る", () => {
  const repositioned = Option.unwrap(
    EditorState.reposition(setupState(), "badge", {
      mode: "absolute",
      x: 70,
      y: 12,
    }),
  );

  const undone = Option.unwrap(EditorState.undo(repositioned));

  expect(badgeProps(undone)).toMatchObject({ x: 40, y: 24 });
});

test("artboard の名前を指すと置き直しは存在しない（履歴も dirty も動かない）", () => {
  // artboard は親 Box を持たないので、親からの座標を持たない
  // （キャンバス上の位置は artboard 自身の `canvasPosition`）
  expect(
    EditorState.reposition(setupState(), "home", {
      mode: "absolute",
      x: 70,
      y: 12,
    }),
  ).toEqual(Option.none);
});

test("ドキュメントに無い名前を指すと置き直しは存在しない", () => {
  expect(
    EditorState.reposition(setupState(), "居ない", {
      mode: "absolute",
      x: 70,
      y: 12,
    }),
  ).toEqual(Option.none);
});
