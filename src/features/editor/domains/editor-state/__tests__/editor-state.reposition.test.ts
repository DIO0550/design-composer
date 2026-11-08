import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node, type Props } from "@/domains/dcmp/node";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/**
 * 絶対配置の `badge` と、付け替え先の `panel` を持つ状態。
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
            { name: "panel", type: "Box", props: {}, children: [] },
          ],
        },
      ],
    }),
  );
}

/** その状態での `badge` の props。 */
function badgeProps(state: EditorState): Readonly<Record<string, unknown>> {
  return Node.writtenPropsOf(
    Option.unwrap(
      DesignDocument.findNode(EditorState.document(state), "badge"),
    ),
  );
}

/** その状態で `badge` がいる親の名前。 */
function badgeParentName(state: EditorState): string {
  return Option.unwrap(
    DesignDocument.findChildPosition(EditorState.document(state), "badge"),
  ).parentName;
}

/*
 * 選択から移動量だけで動かす経路（行き先で受ける経路は `editor-state.reposition-all.test.ts`）。
 * 行き先ではなく差分で受けるので、
 * **今の座標に足されている**ことを見る（既定の 0 から始めると、足す先を取り違えた
 * 実装でも同じ答えになる）。
 */
test("選んでいる絶対配置のノードを横へ動かすと、横の座標だけが動く", () => {
  const selected = EditorState.select(setupState(), "badge");

  const moved = EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 });

  expect(badgeProps(Option.unwrap(moved))).toMatchObject({ x: 41, y: 24 });
});

test("選んでいる絶対配置のノードを縦へ動かすと、縦の座標だけが動く", () => {
  const selected = EditorState.select(setupState(), "badge");

  const moved = EditorState.repositionSelectedNodeBy(selected, {
    x: 0,
    y: -10,
  });

  expect(badgeProps(Option.unwrap(moved))).toMatchObject({ x: 40, y: 14 });
});

test("動かしても親は変わらない", () => {
  // 座標だけで動かす経路には落とし先の親が届かないので、重なった先へ吸われない
  const selected = EditorState.select(setupState(), "badge");

  const moved = Option.unwrap(
    EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 }),
  );

  expect(badgeParentName(moved)).toBe("home");
});

test("フロー配置のノードを選んでいるときは動かない", () => {
  const selected = EditorState.select(setupState(), "panel");

  expect(
    EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 }),
  ).toEqual(Option.none);
});

test("何も選んでいなければ動かない", () => {
  expect(
    EditorState.repositionSelectedNodeBy(setupState(), { x: 1, y: 0 }),
  ).toEqual(Option.none);
});

test("artboard を選んでいるときは動かない", () => {
  // artboard の位置は別の座標系（`canvasPosition`）が持つ
  const selected = EditorState.select(setupState(), "home");

  expect(
    EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 }),
  ).toEqual(Option.none);
});

test("向きを書いたノードを動かしても、向きは元のまま", () => {
  const selected = EditorState.select(setupState({ rotation: 30 }), "badge");

  const moved = EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 });

  expect(badgeProps(Option.unwrap(moved)).rotation).toBe(30);
});

test("数値でない向きを書いたノードを動かしても、その綴りが残る", () => {
  // 読み直して書くと、数値でない綴りは回っていない向き（0）として読まれて消える
  const selected = EditorState.select(setupState({ rotation: "abc" }), "badge");

  const moved = EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 });

  expect(badgeProps(Option.unwrap(moved)).rotation).toBe("abc");
});
