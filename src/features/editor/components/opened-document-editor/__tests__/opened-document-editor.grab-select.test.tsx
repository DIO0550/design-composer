import { fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  leavePointer,
  pressPointerHolding,
} from "@/components/__tests__/pointer-gesture";
import { currentRowNames } from "@/components/__tests__/row-names";
import { Artboard } from "@/domains/dcmp/artboard";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { rightPaneHeading } from "@/features/editor/__tests__/right-pane-heading";
import {
  artboardHandle,
  drag,
  movePointer,
  pressPointer,
  releasePointer,
  textInlineEditorField,
} from "@/features/editor/features/canvas/__tests__";
import { nameField } from "@/features/editor/features/sidebar/__tests__";
import { PointerButtons } from "@/libs/dom-event";
import {
  dragRangeAround,
  drawn,
  renderOpenedDocument,
  selectInTree,
  tree,
} from "./setup";

/*
 * キャンバスでノードを押した時点で、掴んだノードが選ばれるところを編集画面の配線ごと
 * 確かめる（docs/06-ui.md「キャンバス直接操作」の移動）。掴んだものが選択へ届くのは編集画面が
 * `useNodeDrag` へ渡す受け口を通してだけで、名前の変更の入力欄も左ペインにあるので、
 * キャンバス単体では見られない。
 */

/**
 * `home` に Box の `card`（中に Text の `label`）・Text の `title` / `caption`・空の Box
 * `panel`・ロックした Text の `memo` が並ぶ。どれも `flow` なので、運んで `panel` の上で
 * 離すとツリー内の移動になる。
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
            name: "card",
            type: "Box",
            props: {},
            children: [
              { name: "label", type: "Text", props: { content: "札" } },
            ],
          },
          { name: "title", type: "Text", props: { content: "見出し" } },
          { name: "caption", type: "Text", props: { content: "注記" } },
          { name: "panel", type: "Box", props: {}, children: [] },
          {
            name: "memo",
            type: "Text",
            props: { content: "メモ", locking: "locked" },
          },
        ],
      }),
    ],
  });
}

/**
 * 主ボタンを押したまま止める。`pointerdown` に続く `mousedown` でブラウザと同じくフォーカスが
 * 動く（`pressPointer` の `fireEvent` は happy-dom でフォーカスを動かさない）。
 *
 * @param target 押す要素
 */
async function pressMovingFocus(target: Element): Promise<void> {
  await userEvent.pointer({ keys: "[MouseLeft>]", target });
}

/** `title` の文言をその場で打ち替えている途中（確定していない）にする。 */
async function typeTitleInline(content: string): Promise<void> {
  await userEvent.dblClick(drawn("title"));
  await userEvent.clear(textInlineEditorField());
  await userEvent.type(textInlineEditorField(), content);
}

/** ツリーで `title` の名前を打ち替えている途中（確定していない）にする。 */
async function typeTitleName(name: string): Promise<void> {
  await userEvent.dblClick(
    within(tree()).getByRole("button", { name: "title" }),
  );
  await userEvent.clear(nameField());
  await userEvent.type(nameField(), name);
}

test("選んでいないノードを押した時点で、離す前からツリーでそのノードが選択状態になる", async () => {
  await renderOpenedDocument(setupDocument());

  pressPointer(drawn("title"), { x: 100, y: 100 });

  expect(currentRowNames(tree())).toEqual(["title"]);
});

test("運んで離すと、離した直後の click が飲み込まれても運んだノードが選ばれたまま", async () => {
  await renderOpenedDocument(setupDocument());

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(drawn("panel"), { x: 100, y: 150 });
  releasePointer(drawn("panel"), { x: 100, y: 150 });
  // `userEvent.click` は自前の `pointerdown` で掴み直すので、`click` だけを撃つ
  fireEvent.click(drawn("panel"));

  expect(currentRowNames(tree())).toEqual(["title"]);
});

test("運んでいる途中で編集画面の外へ出て取り消しても、押した時点で選んだノードが選ばれたまま", async () => {
  await renderOpenedDocument(setupDocument());

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(drawn("panel"), { x: 100, y: 150 });
  leavePointer(drawn("panel"));

  expect(currentRowNames(tree())).toEqual(["title"]);
});

test("入れ子の中身を押して動かさずに離すと、続く click でも押した時点と同じ artboard 直下の子が選ばれる", async () => {
  await renderOpenedDocument(setupDocument());

  pressPointer(drawn("label"), { x: 100, y: 100 });
  releasePointer(drawn("label"), { x: 100, y: 100 });
  // `userEvent.click` は自前の `pointerdown` で掴み直すので、`click` だけを撃つ
  fireEvent.click(drawn("label"));

  expect(currentRowNames(tree())).toEqual(["card"]);
});

test("⌘ を押しながら押すと、押した位置のいちばん内側が選ばれる", async () => {
  await renderOpenedDocument(setupDocument());

  pressPointerHolding(drawn("label"), { x: 100, y: 100 }, "meta");

  expect(currentRowNames(tree())).toEqual(["label"]);
});

test("右ボタンで押しても、押した時点では選択は変わらない", async () => {
  await renderOpenedDocument(setupDocument());

  pressPointer(drawn("title"), { x: 100, y: 100 }, PointerButtons.Secondary);

  expect(rightPaneHeading().textContent).toBe("");
});

test("ロック中のノードだけが乗っているところを押しても、押した時点では何も選ばれない", async () => {
  await renderOpenedDocument(setupDocument());

  pressPointer(drawn("memo"), { x: 100, y: 100 });

  expect(rightPaneHeading().textContent).toBe("");
});

test("artboard の見出しを掴んで運んでも、選んでいたノードが選ばれたまま", async () => {
  await renderOpenedDocument(setupDocument());
  await selectInTree("title");

  drag(artboardHandle("home"), {
    from: { x: 100, y: 100 },
    to: { x: 140, y: 120 },
  });

  expect(currentRowNames(tree())).toEqual(["title"]);
});

test("複数選択中に一員を押すと、押した位置でクリックが選ぶもの 1 つの選択になる", async () => {
  await renderOpenedDocument(setupDocument());
  dragRangeAround({ upper: "title", lower: "caption" });

  pressPointer(drawn("title"), { x: 100, y: 100 });

  expect(currentRowNames(tree())).toEqual(["title"]);
});

test("Text のインライン編集中に別のノードを押すと、書いていた文言は編集していた Text に入る", async () => {
  await renderOpenedDocument(setupDocument());
  await typeTitleInline("書き換え");

  await pressMovingFocus(drawn("caption"));

  expect(drawn("title").textContent).toBe("書き換え");
});

test("Text のインライン編集中に別のノードを押しても、押したノードの文言は変わらない", async () => {
  await renderOpenedDocument(setupDocument());
  await typeTitleInline("書き換え");

  await pressMovingFocus(drawn("caption"));

  expect(drawn("caption").textContent).toBe("注記");
});

test("名前の変更中にキャンバスで別のノードを押すと、改名されるのは名前を打っていたノード", async () => {
  await renderOpenedDocument(setupDocument());
  await typeTitleName("heading");

  await pressMovingFocus(drawn("caption"));

  // 押したノードへ改名が漏れると、`heading` の文言は `caption` の「注記」になる
  expect(drawn("heading").textContent).toBe("見出し");
});

test("名前の変更中にキャンバスで別のノードを押しても、押したノードの名前は変わらない", async () => {
  await renderOpenedDocument(setupDocument());
  await typeTitleName("heading");

  await pressMovingFocus(drawn("caption"));

  expect(drawn("caption").textContent).toBe("注記");
});

test("名前の変更中にキャンバスで別のノードを押すと、押したノードが選ばれる", async () => {
  await renderOpenedDocument(setupDocument());
  await typeTitleName("heading");

  await pressMovingFocus(drawn("caption"));

  expect(currentRowNames(tree())).toEqual(["caption"]);
});
