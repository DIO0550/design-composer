import { expect, test } from "vitest";
import { ChildPlacement } from "@/domains/dcmp/child-placement";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node, type Props } from "@/domains/dcmp/node";
import { RepositionEdit } from "@/domains/dcmp/reposition-edit";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { frozen } from "./frozen-state";
import { nodeNamed } from "./setup";

/**
 * 絶対配置の `badge` と `chip`、付け替え先の `panel` を持つ状態。
 * 座標は既定と違う値から始める。
 *
 * @param badgeProps `badge` に足して書く props（向きを書いて始めるときに使う）
 */
function setupState(badgeProps: Props = {}): EditorState {
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
              props: { placement: "absolute", x: 40, y: 24, ...badgeProps },
            },
            {
              name: "chip",
              type: "Text",
              props: { placement: "absolute", x: 100, y: 60 },
            },
            { name: "panel", type: "Box", props: {}, children: [] },
          ],
        },
      ],
    }),
  );
}

/**
 * ノード 1 つだけを置き直した状態。
 *
 * @param state 置き直す前の状態
 * @param name 置き直すノードの名前
 * @param edit 置き直したあとの親と座標（向きを書き換えるならその向き）
 * @returns 置き直したあとの状態。置き直せないなら `none`
 */
function repositionOne(
  state: EditorState,
  name: string,
  edit: RepositionEdit,
): Option<EditorState> {
  return EditorState.repositionAll(state, [{ name, edit }]);
}

/** `home` の中の座標を指した、向きを書かない置き直し。 */
function toHome(x: number, y: number): RepositionEdit {
  return RepositionEdit.create(
    ChildPlacement.create("home", { mode: "absolute", x, y }),
  );
}

/** その状態での、名前で指したノードの props。 */
function propsOf(
  state: EditorState,
  name: string,
): Readonly<Record<string, unknown>> {
  return Node.writtenPropsOf(nodeNamed(state, name));
}

/** その状態で、名前で指したノードがいる親の名前。 */
function parentNameOf(state: EditorState, name: string): string {
  return Option.unwrap(
    DesignDocument.findChildPosition(EditorState.document(state), name),
  ).parentName;
}

test("座標を置き直すと縦横とも新しい値になる", () => {
  const repositioned = repositionOne(setupState(), "badge", toHome(70, 12));

  expect(propsOf(Option.unwrap(repositioned), "badge")).toMatchObject({
    x: 70,
    y: 12,
  });
});

test("選んでいないノードでも座標を置き直せる（置き直しは選択に依らない）", () => {
  const state = setupState();

  // 選択が無い（= プロパティパネル経由の編集は成立しない）ことを前提に置く
  expect(EditorState.singleName(state)).toEqual(Option.none);
  expect(Option.isSome(repositionOne(state, "badge", toHome(70, 12)))).toBe(
    true,
  );
});

test("置き直したあと 1 回戻すと縦横とも元の座標に戻る", () => {
  const repositioned = Option.unwrap(
    repositionOne(setupState(), "badge", toHome(70, 12)),
  );

  const undone = Option.unwrap(EditorState.undo(repositioned));

  expect(propsOf(undone, "badge")).toMatchObject({ x: 40, y: 24 });
});

test("別の親を指して置き直すと、その親の子になる", () => {
  const repositioned = Option.unwrap(
    repositionOne(
      setupState(),
      "badge",
      RepositionEdit.create(
        ChildPlacement.create("panel", { mode: "absolute", x: 8, y: 6 }),
      ),
    ),
  );

  expect(parentNameOf(repositioned, "badge")).toBe("panel");
});

test("親をまたいで置き直しても、1 回戻すだけで元の親へ戻る", () => {
  // 木の移動と座標の書き込みが別々に積まれると、戻すのに 2 回要る
  const repositioned = Option.unwrap(
    repositionOne(
      setupState(),
      "badge",
      RepositionEdit.create(
        ChildPlacement.create("panel", { mode: "absolute", x: 8, y: 6 }),
      ),
    ),
  );

  const undone = Option.unwrap(EditorState.undo(repositioned));

  expect([parentNameOf(undone, "badge"), propsOf(undone, "badge").x]).toEqual([
    "home",
    40,
  ]);
});

test("子を受け入れられない親を指すと置き直しは存在しない（履歴も dirty も動かない）", () => {
  expect(
    repositionOne(
      setupState(),
      "badge",
      RepositionEdit.create(
        ChildPlacement.create("居ない親", { mode: "absolute", x: 70, y: 12 }),
      ),
    ),
  ).toEqual(Option.none);
});

test("artboard の名前を指すと置き直しは存在しない（履歴も dirty も動かない）", () => {
  // artboard は親 Box を持たないので、親からの座標を持たない
  // （キャンバス上の位置は artboard 自身の `canvasPosition`）
  expect(repositionOne(setupState(), "home", toHome(70, 12))).toEqual(
    Option.none,
  );
});

test("ドキュメントに無い名前を指すと置き直しは存在しない", () => {
  expect(repositionOne(setupState(), "居ない", toHome(70, 12))).toEqual(
    Option.none,
  );
});

test("向きも書き換えて親をまたいだ置き直しは、1 回戻すと親・座標・向きが全部戻る", () => {
  const repositioned = Option.unwrap(
    repositionOne(
      setupState({ rotation: 30 }),
      "badge",
      RepositionEdit.rotatedTo(
        ChildPlacement.create("panel", { mode: "absolute", x: 8, y: 6 }),
        120,
      ),
    ),
  );

  const undone = Option.unwrap(EditorState.undo(repositioned));

  expect([
    parentNameOf(undone, "badge"),
    propsOf(undone, "badge").x,
    propsOf(undone, "badge").rotation,
  ]).toEqual(["home", 40, 30]);
});

test("2 つをまとめて置き直したあと 1 回戻すと、2 つとも元の座標に戻る", () => {
  const repositioned = Option.unwrap(
    EditorState.repositionAll(setupState(), [
      { name: "badge", edit: toHome(70, 12) },
      { name: "chip", edit: toHome(130, 48) },
    ]),
  );

  const undone = Option.unwrap(EditorState.undo(repositioned));

  expect([propsOf(undone, "badge"), propsOf(undone, "chip")]).toEqual([
    expect.objectContaining({ x: 40, y: 24 }),
    expect.objectContaining({ x: 100, y: 60 }),
  ]);
});

test("まとめて置き直しても、選択は変わらない", () => {
  const selected = EditorState.selectNodes(setupState(), ["badge", "chip"]);

  const repositioned = Option.unwrap(
    EditorState.repositionAll(selected, [
      { name: "badge", edit: toHome(70, 12) },
      { name: "chip", edit: toHome(130, 48) },
    ]),
  );

  expect(
    DocumentSelection.names(EditorState.documentSelection(repositioned)),
  ).toEqual(["badge", "chip"]);
});

test("まとめた置き直しに受け入れられない指定が 1 件でも混ざると、置き直しは存在しない", () => {
  // 1 件目だけ通る指定にして、通った分だけ書かれる実装を落とす
  expect(
    EditorState.repositionAll(setupState(), [
      { name: "badge", edit: toHome(70, 12) },
      {
        name: "chip",
        edit: RepositionEdit.create(
          ChildPlacement.create("居ない親", { mode: "absolute", x: 0, y: 0 }),
        ),
      },
    ]),
  ).toEqual(Option.none);
});

test("ファイルが不正な間は、まとめて置き直せない", () => {
  // 凍結しなければ通る指定にして、凍結のガードを消した実装を落とす
  expect(
    EditorState.repositionAll(frozen(setupState()), [
      { name: "badge", edit: toHome(70, 12) },
      { name: "chip", edit: toHome(130, 48) },
    ]),
  ).toEqual(Option.none);
});
