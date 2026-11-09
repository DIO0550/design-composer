import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";
import { parentNameOf, propsOf, stateWithAbsoluteSiblings } from "./setup";

/*
 * 選択から移動量だけで動かす経路（行き先で受ける経路は `editor-state.reposition-all.test.ts`）。
 * 行き先ではなく差分で受けるので、**今の座標に足されている**ことを見る（既定の 0 から始める
 * と、足す先を取り違えた実装でも同じ答えになる）。
 */
test("選んでいる絶対配置のノードを横へ動かすと、横の座標だけが動く", () => {
  const selected = EditorState.select(stateWithAbsoluteSiblings(), "badge");

  const moved = EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 });

  expect(propsOf(Option.unwrap(moved), "badge")).toMatchObject({
    x: 41,
    y: 24,
  });
});

test("選んでいる絶対配置のノードを縦へ動かすと、縦の座標だけが動く", () => {
  const selected = EditorState.select(stateWithAbsoluteSiblings(), "badge");

  const moved = EditorState.repositionSelectedNodeBy(selected, {
    x: 0,
    y: -10,
  });

  expect(propsOf(Option.unwrap(moved), "badge")).toMatchObject({
    x: 40,
    y: 14,
  });
});

test("動かしても親は変わらない", () => {
  // 座標だけで動かす経路には落とし先の親が届かないので、重なった先へ吸われない
  const selected = EditorState.select(stateWithAbsoluteSiblings(), "badge");

  const moved = Option.unwrap(
    EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 }),
  );

  expect(parentNameOf(moved, "badge")).toBe("home");
});

test("フロー配置のノードを選んでいるときは動かない", () => {
  const selected = EditorState.select(stateWithAbsoluteSiblings(), "panel");

  expect(
    EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 }),
  ).toEqual(Option.none);
});

test("何も選んでいなければ動かない", () => {
  expect(
    EditorState.repositionSelectedNodeBy(stateWithAbsoluteSiblings(), {
      x: 1,
      y: 0,
    }),
  ).toEqual(Option.none);
});

test("artboard を選んでいるときは動かない", () => {
  // artboard の位置は別の座標系（`canvasPosition`）が持つ
  const selected = EditorState.select(stateWithAbsoluteSiblings(), "home");

  expect(
    EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 }),
  ).toEqual(Option.none);
});

test("向きを書いたノードを動かしても、向きは元のまま", () => {
  const selected = EditorState.select(
    stateWithAbsoluteSiblings({ rotation: 30 }),
    "badge",
  );

  const moved = EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 });

  expect(propsOf(Option.unwrap(moved), "badge").rotation).toBe(30);
});

test("数値でない向きを書いたノードを動かしても、その綴りが残る", () => {
  // 読み直して書くと、数値でない綴りは回っていない向き（0）として読まれて消える
  const selected = EditorState.select(
    stateWithAbsoluteSiblings({ rotation: "abc" }),
    "badge",
  );

  const moved = EditorState.repositionSelectedNodeBy(selected, { x: 1, y: 0 });

  expect(propsOf(Option.unwrap(moved), "badge").rotation).toBe("abc");
});
