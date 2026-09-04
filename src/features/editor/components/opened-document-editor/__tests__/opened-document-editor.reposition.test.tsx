import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import {
  drag,
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/canvas/__tests__";
import { Option } from "@/utils/Option";
import { drawn, renderOpenedDocument, tree } from "./setup";

/*
 * キャンバスで運んだ結果がドキュメントへ届き、描き直されるまでを編集画面の配線ごと
 * 確かめる（#381）。
 *
 * ここでしか通らないのは、`onReposition` → `reposition_node` → 再コンパイルまでを
 * 通して CSS の `left` / `top` が動くところを見るため。キャンバス単体
 * （`artboard-canvas.drag-placement.test.tsx`）は落とし方の値までは固定するが、
 * それがドキュメントへ届いて描き直されるところは見ない。
 */

/**
 * `home` に絶対配置の `home-badge`・フローの `home-title` / `home-panel` が
 * この順で並び、隣に `settings` があるドキュメント。
 *
 * `home-badge` を**先頭**に置くのは、末尾だと「並びが変わらない」を確かめられないため。
 * 末尾のノードを末尾へ移す木の移動は元と同じ並びになるので、座標の置き直しを丸ごと
 * 壊してもテストが通ってしまう。
 *
 * `settings` は親の付け替え先（#388）。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      Artboard.create({
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "home-badge",
            type: "Box",
            props: {
              placement: "absolute",
              x: 296,
              y: 16,
              widthMode: "fixed",
              width: 44,
              heightMode: "fixed",
              height: 24,
            },
            children: [],
          },
          { name: "home-title", type: "Text", props: { content: "ホーム" } },
          { name: "home-panel", type: "Box", props: {}, children: [] },
        ],
      }),
      Artboard.create({
        name: "settings",
        width: 360,
        height: 240,
        children: [],
      }),
    ],
  });
}

/** 描かれた `home-badge` を包んでいる要素の名前。 */
function badgeParentName(): string {
  return Option.unwrap(
    Option.fromNullable(drawn("home-badge").parentElement?.dataset.name),
  );
}

/**
 * `home-badge` を掴んで運び、離すまで。
 *
 * **離す位置は原点より奥（正の座標）に取る。** happy-dom は矩形を返さないので
 * `DropZone.targetAt` は「原点よりポインタが奥にある子の数」を挿入位置にする。
 * 負の座標で離すと挿入位置が 0（＝今と同じ位置）になり、木の移動へフォールバック
 * した実装でも並びが変わらなくなる（`asset-drag` が同じ性質を使っている）。
 */
function dragBadge(): void {
  drag(drawn("home-badge"), {
    from: { x: 100, y: 100 },
    to: { x: 70, y: 112 },
  });
}

test("絶対配置のノードをキャンバスで運ぶと、描かれる位置が縦横ともその分だけ動く", async () => {
  await renderOpenedDocument(setupDocument());

  // 動いた先が既定値（0）と一致しない量を選ぶ。一致させると「座標を書かない実装」でも通る
  dragBadge();

  const moved = drawn("home-badge");
  expect([moved.style.left, moved.style.top]).toEqual(["266px", "28px"]);
});

test("絶対配置のノードを運んでもツリーの並びは変わらない", async () => {
  await renderOpenedDocument(setupDocument());

  dragBadge();

  expect(rowNames(tree())).toEqual(["home-badge", "home-title", "home-panel"]);
});

test("フローのノードをキャンバスで運ぶとツリーの並びが変わる", async () => {
  await renderOpenedDocument(setupDocument());

  drag(drawn("home-title"), {
    from: { x: 100, y: 100 },
    to: { x: 70, y: 112 },
  });

  expect(rowNames(tree())).toEqual(["home-badge", "home-panel", "home-title"]);
});

test("絶対配置のノードを別の artboard の上へ運ぶと、その artboard の子になる", async () => {
  await renderOpenedDocument(setupDocument());

  // 離すのを運んだ先へ撃つのは、運んでいるノードが当たり判定から外れるため
  pressPointer(drawn("home-badge"), { x: 100, y: 100 });
  movePointer(drawn("settings"), { x: 70, y: 112 });
  releasePointer(drawn("settings"), { x: 70, y: 112 });

  expect(badgeParentName()).toBe("settings");
});

test("同じ親の中で運んだときは、包んでいる artboard が変わらない", async () => {
  // 対照。付け替えを常に起こす実装にすると、こちらが落ちる
  await renderOpenedDocument(setupDocument());

  dragBadge();

  expect(badgeParentName()).toBe("home");
});
