import { expect, test } from "vitest";
import { ChildPlacement } from "@/domains/dcmp/child-placement";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/**
 * 絶対配置の `badge` と、付け替え先の `panel` を持つ状態。
 * 座標は既定と違う値から始める。
 */
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
            { name: "panel", type: "Box", props: {}, children: [] },
          ],
        },
      ],
    }),
  );
}

/** `home` の中の座標を指した置き直し。 */
function toHome(x: number, y: number): ChildPlacement {
  return ChildPlacement.create("home", { mode: "absolute", x, y });
}

/** その状態での `badge` の props。 */
function badgeProps(state: EditorState): Readonly<Record<string, unknown>> {
  const node = Option.unwrap(
    DesignDocument.findNode(EditorState.document(state), "badge"),
  );
  return Node.isPrimitive(node) ? (node.props ?? {}) : {};
}

/** その状態で `badge` がいる親の名前。 */
function badgeParentName(state: EditorState): string {
  return Option.unwrap(
    DesignDocument.findChildPosition(EditorState.document(state), "badge"),
  ).parentName;
}

test("座標を置き直すと縦横とも新しい値になる", () => {
  const repositioned = EditorState.reposition(
    setupState(),
    "badge",
    toHome(70, 12),
  );

  expect(badgeProps(Option.unwrap(repositioned))).toMatchObject({
    x: 70,
    y: 12,
  });
});

test("選んでいないノードでも座標を置き直せる（キャンバスのドラッグは選択を変えない）", () => {
  const state = setupState();

  // 選択が無い（= プロパティパネル経由の編集は成立しない）ことを前提に置く
  expect(EditorState.singleName(state)).toEqual(Option.none);
  expect(EditorState.reposition(state, "badge", toHome(70, 12)).some).toBe(
    true,
  );
});

test("置き直したあと 1 回戻すと縦横とも元の座標に戻る", () => {
  const repositioned = Option.unwrap(
    EditorState.reposition(setupState(), "badge", toHome(70, 12)),
  );

  const undone = Option.unwrap(EditorState.undo(repositioned));

  expect(badgeProps(undone)).toMatchObject({ x: 40, y: 24 });
});

test("別の親を指して置き直すと、その親の子になる", () => {
  const repositioned = Option.unwrap(
    EditorState.reposition(
      setupState(),
      "badge",
      ChildPlacement.create("panel", { mode: "absolute", x: 8, y: 6 }),
    ),
  );

  expect(badgeParentName(repositioned)).toBe("panel");
});

test("親をまたいで置き直しても、1 回戻すだけで元の親へ戻る", () => {
  // 木の移動と座標の書き込みが別々に積まれると、戻すのに 2 回要る
  const repositioned = Option.unwrap(
    EditorState.reposition(
      setupState(),
      "badge",
      ChildPlacement.create("panel", { mode: "absolute", x: 8, y: 6 }),
    ),
  );

  const undone = Option.unwrap(EditorState.undo(repositioned));

  expect([badgeParentName(undone), badgeProps(undone).x]).toEqual(["home", 40]);
});

test("子を受け入れられない親を指すと置き直しは存在しない（履歴も dirty も動かない）", () => {
  expect(
    EditorState.reposition(
      setupState(),
      "badge",
      ChildPlacement.create("居ない親", { mode: "absolute", x: 70, y: 12 }),
    ),
  ).toEqual(Option.none);
});

test("artboard の名前を指すと置き直しは存在しない（履歴も dirty も動かない）", () => {
  // artboard は親 Box を持たないので、親からの座標を持たない
  // （キャンバス上の位置は artboard 自身の `canvasPosition`）
  expect(EditorState.reposition(setupState(), "home", toHome(70, 12))).toEqual(
    Option.none,
  );
});

test("ドキュメントに無い名前を指すと置き直しは存在しない", () => {
  expect(
    EditorState.reposition(setupState(), "居ない", toHome(70, 12)),
  ).toEqual(Option.none);
});
