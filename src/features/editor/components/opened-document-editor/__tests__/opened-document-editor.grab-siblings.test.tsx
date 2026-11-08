import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { leavePointer } from "@/components/__tests__/pointer-gesture";
import { currentRowNames } from "@/components/__tests__/row-names";
import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { Node } from "@/domains/dcmp/node";
import {
  drag,
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__";
import { drawn, renderOpenedDocument, selectInTree, tree } from "./setup";

/*
 * 選んでいる絶対配置の兄弟を、キャンバスで一員を押してまとめて運ぶところを、編集画面の配線
 * ごと確かめる（docs/06-ui.md「キャンバス直接操作」の移動）。押した時点で選択を変えないこと・
 * 離したときの編集が全員ぶん 1 回で届くこと・取り消しが 1 回で済むことは、選択と履歴を持つ
 * 編集画面でしか見られない。
 */

/** 絶対配置の Box。 */
function absoluteBox(
  name: string,
  at: Readonly<{ x: number; y: number }>,
  children: readonly Node[] = [],
): Node {
  return {
    name,
    type: "Box",
    props: { placement: "absolute", ...at },
    children,
  };
}

/**
 * `home` の直下に Box の `outer`、その中に Box の `group`。`group` の中に絶対配置の `a`（中に
 * Text の `a-label`）と `b`、`withFlow` なら続けてフローの Box の `c`。隣に空の artboard
 * `settings`。
 */
function setupDocument(withFlow = false): DesignDocument {
  const flowChild: readonly Node[] = withFlow
    ? [{ name: "c", type: "Box", props: {}, children: [] }]
    : [];
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
            name: "outer",
            type: "Box",
            props: {},
            children: [
              {
                name: "group",
                type: "Box",
                props: {},
                children: [
                  absoluteBox("a", { x: 40, y: 24 }, [
                    { name: "a-label", type: "Text", props: { content: "札" } },
                  ]),
                  absoluteBox("b", { x: 100, y: 60 }),
                  ...flowChild,
                ],
              },
            ],
          },
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

/**
 * `group` をグループ解除して、`outer` の直下へ戻った子をすべて選んだ状態で描く。
 *
 * @param withFlow フローの `c` も混ぜるか
 */
async function renderUngrouped(withFlow = false): Promise<void> {
  await renderOpenedDocument(setupDocument(withFlow));
  await selectInTree("group");
  await userEvent.keyboard("{Meta>}{Shift>}g{/Shift}{/Meta}");
}

/** 描かれている `left` / `top`。 */
function drawnPosition(name: string): readonly string[] {
  const element = drawn(name);
  return [element.style.left, element.style.top];
}

/** 描かれた要素の直下にある、名前を持つ要素の名前（描かれた順）。 */
function drawnChildNames(name: string): readonly string[] {
  return Array.from(drawn(name).children).flatMap((child) =>
    child instanceof HTMLElement && child.dataset.name !== undefined
      ? [child.dataset.name]
      : [],
  );
}

test("絶対配置の兄弟を選んだまま一員を押すと、押した時点では 2 つとも選ばれたまま", async () => {
  await renderUngrouped();

  pressPointer(drawn("a"), { x: 100, y: 100 });

  expect(currentRowNames(tree())).toEqual(["a", "b"]);
});

test("一員を運んで離すと、2 つとも同じ量だけ動いて描かれる", async () => {
  await renderUngrouped();

  drag(drawn("a"), { from: { x: 100, y: 100 }, to: { x: 70, y: 112 } });

  expect([drawnPosition("a"), drawnPosition("b")]).toEqual([
    ["10px", "36px"],
    ["70px", "72px"],
  ]);
});

test("一員を運んで離しても、2 つとも選ばれたまま", async () => {
  await renderUngrouped();

  drag(drawn("a"), { from: { x: 100, y: 100 }, to: { x: 70, y: 112 } });
  // 離した直後の click は飲み込まれる。漏れれば `a` 1 つの選択になる
  fireEvent.click(drawn("a"));

  expect(currentRowNames(tree())).toEqual(["a", "b"]);
});

test("まとめて運んだあと ⌘Z を 1 回押すと、2 つとも元の位置に戻る", async () => {
  await renderUngrouped();
  drag(drawn("a"), { from: { x: 100, y: 100 }, to: { x: 70, y: 112 } });

  await userEvent.keyboard("{Meta>}z{/Meta}");

  expect([drawnPosition("a"), drawnPosition("b")]).toEqual([
    ["40px", "24px"],
    ["100px", "60px"],
  ]);
});

test("一員の中の Text を押して運ばずに離すと、続く click でその一員 1 つが選ばれる", async () => {
  await renderUngrouped();

  pressPointer(drawn("a-label"), { x: 100, y: 100 });
  releasePointer(drawn("a-label"), { x: 100, y: 100 });
  // `userEvent.click` は自前の `pointerdown` で掴み直すので、`click` だけを撃つ
  fireEvent.click(drawn("a-label"));

  expect(currentRowNames(tree())).toEqual(["a"]);
});

test("別の artboard の上へまとめて運ぶと、2 つとも元の並び順のままその artboard の子になる", async () => {
  await renderUngrouped();

  // 離すのを運んだ先へ撃つのは、運んでいるノードが当たり判定から外れるため
  pressPointer(drawn("a"), { x: 100, y: 100 });
  movePointer(drawn("settings"), { x: 70, y: 112 });
  releasePointer(drawn("settings"), { x: 70, y: 112 });

  expect(drawnChildNames("settings")).toEqual(["a", "b"]);
});

test("まとめて運んでいる途中で編集画面の外へ出て取り消すと、どちらも動かず 2 つとも選ばれたまま", async () => {
  await renderUngrouped();

  pressPointer(drawn("a"), { x: 100, y: 100 });
  movePointer(drawn("settings"), { x: 70, y: 112 });
  leavePointer(drawn("settings"));

  expect([
    drawnPosition("a"),
    drawnPosition("b"),
    currentRowNames(tree()),
  ]).toEqual([
    ["40px", "24px"],
    ["100px", "60px"],
    ["a", "b"],
  ]);
});

test("フローの子が混ざった複数選択では、一員を押した時点でその一員 1 つが選ばれる", async () => {
  await renderUngrouped(true);

  pressPointer(drawn("a"), { x: 100, y: 100 });

  expect(currentRowNames(tree())).toEqual(["a"]);
});

test("フローの子が混ざった複数選択で一員を運ぶと、その一員だけが動く", async () => {
  await renderUngrouped(true);

  drag(drawn("a"), { from: { x: 100, y: 100 }, to: { x: 70, y: 112 } });

  expect([drawnPosition("a"), drawnPosition("b")]).toEqual([
    ["10px", "36px"],
    ["100px", "60px"],
  ]);
});
