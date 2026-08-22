import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import { Artboard } from "@/domains/artboard";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/canvas/__tests__/canvas-gesture";
import {
  type LeftPaneView,
  LeftPaneViewLabels,
  LeftPaneViews,
} from "@/features/sidebar";
import { Option } from "@/utils/Option";
import {
  leftPane,
  propertyPane,
  renderOpenedDocument,
  selectInTree,
  tree,
} from "./setup";

/*
 * パレット（`Assets`）からキャンバスへ運んで挿す経路を、編集画面の配線ごと確かめる
 * （UI 案 docs/Design Composer.html「Assets is browse-only … Insertion is drag-only and
 * the drop reads as a tree position」/ #203）。
 *
 * ここでしか通らないのは、掴む場所（左ペイン）と落とす場所（キャンバス）が別のペインに
 * あり、運んでいる間のポインタを 3 ペインの器が受けるため。キャンバス単体・パレット単体の
 * テストはどちらか片側しか持たない。
 */

/**
 * `home` に Text・空の Box・Text がこの順で並ぶドキュメント。
 *
 * `home-panel` を真ん中に置くのは、落とし先が `home-panel` なのか `home`（末尾へ追加）
 * なのかを行の並びで見分けられるようにするため。末尾に置くとどちらでも同じ並びになる。
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
          { name: "home-title", type: "Text", props: { content: "ホーム" } },
          { name: "home-panel", type: "Box", children: [] },
          { name: "home-note", type: "Text", props: { content: "メモ" } },
        ],
      }),
    ],
  });
}

/** キャンバスに描かれている、名前で指した要素。 */
function drawn(name: string): Element {
  return Option.unwrap(
    Option.fromNullable(document.querySelector(`[data-name="${name}"]`)),
  );
}

/** レールで行き先を選ぶ。 */
async function goTo(view: LeftPaneView): Promise<void> {
  await userEvent.click(
    within(
      screen.getByRole("navigation", { name: "左ペインの表示" }),
    ).getByRole("button", { name: LeftPaneViewLabels[view] }),
  );
}

/** パレットを開く。掴む起点はここにしか無い。 */
async function goToAssets(): Promise<void> {
  await goTo(LeftPaneViews.Assets);
}

/** ツリーへ戻る。挿さった結果を読めるのは Layers のときだけ。 */
async function goToLayers(): Promise<void> {
  await goTo(LeftPaneViews.Layers);
}

/** パレットの行。押して掴む起点になる。 */
function paletteRow(name: string): Element {
  return Option.unwrap(
    Option.fromNullable(within(leftPane()).getByText(name).closest("li")),
  );
}

/** パレットの行を掴み、キャンバスの要素の上まで運ぶ（まだ離さない）。 */
function carryTo(rowName: string, target: Element): void {
  pressPointer(paletteRow(rowName), { x: 100, y: 100 });
  movePointer(target, { x: 300, y: 150 });
}

test("部品の行からキャンバスの Box へ運んで離すと、その Box の子にインスタンスが増える", async () => {
  await renderOpenedDocument(setupDocument());
  await goToAssets();

  carryTo("card", drawn("home-panel"));
  releasePointer(drawn("home-panel"), { x: 300, y: 150 });

  await goToLayers();
  expect(rowNames(tree())).toEqual([
    "home-title",
    "home-panel",
    "card-2",
    "home-note",
  ]);
});

test("プリミティブの行から artboard へ運んで離すと、その artboard の子に増える", async () => {
  await renderOpenedDocument(setupDocument());
  await goToAssets();

  carryTo("Box", drawn("home"));
  releasePointer(drawn("home"), { x: 300, y: 150 });

  await goToLayers();
  // 落とし先は artboard なので、`home-panel` の中ではなく `home` の並びへ入る
  expect(rowNames(tree())).toEqual([
    "home-title",
    "home-panel",
    "home-note",
    "box",
  ]);
});

test("受け入れ先が無い場所で離しても木は変わらない", async () => {
  await renderOpenedDocument(setupDocument());
  // ツリーは Layers のときしか出ないので、比べる元をここで読む
  const before = rowNames(tree());
  await goToAssets();

  // artboard の外（キャンバスの余白）には受け入れられる親が無い
  const surface = screen.getByTestId("canvas-surface");
  pressPointer(paletteRow("card"), { x: 100, y: 100 });
  movePointer(surface, { x: 300, y: 150 });
  releasePointer(surface, { x: 300, y: 150 });

  await goToLayers();
  expect(rowNames(tree())).toEqual(before);
});

test("左ペインの上で離しても掴んだままにならない", async () => {
  await renderOpenedDocument(setupDocument());
  await goToAssets();

  // 掴んだまま戻らないと、次に運ぼうとしたときに前のものが付いてくる
  carryTo("card", drawn("home-panel"));
  // 先に運べていることを確かめる。運びが始まらない実装でも「掴んでいない」は通るため
  expect(screen.getByText(/^into /)).toBeDefined();

  releasePointer(paletteRow("card"), { x: 100, y: 100 });

  expect(screen.queryByText(/^into /)).toBeNull();
});

test("運んでいる間は落ちる先がどの親のどこかとして示される", async () => {
  await renderOpenedDocument(setupDocument());
  await goToAssets();

  carryTo("card", drawn("home-panel"));

  /*
   * 綴り全体で比べるのは、どちらの数をどの語に入れるかがここにしか無いため
   * （`domains/node-drop` が固定するのは `index` と `childCount` の値まで）。
   * `home-panel` は空の Box なので、矩形を返さない happy-dom でも数が決まる。
   */
  expect(screen.getByText("into home-panel · child 0 of 0")).toBeDefined();
});

test("落ちる先の何番目かと子の数は、入れ替わらずにこの順で出る", async () => {
  await renderOpenedDocument(setupDocument());
  await goToAssets();

  /*
   * 子を 3 つ持つ `home` の**先頭**へ落ちる位置で見る。happy-dom は矩形を返さず
   * すべての子が原点に居ることになるので、ポインタがそこより手前にある場合だけ
   * 先頭（0 番目）になり、子の数（3）と違う数になる。両方が同じ数になる入力では、
   * 2 つの数を入れ替えても綴りが変わらない。
   */
  pressPointer(paletteRow("card"), { x: 100, y: 100 });
  movePointer(drawn("home"), { x: 300, y: -1 });

  expect(screen.getByText("into home · child 0 of 3")).toBeDefined();
});

test("パレットから落とした直後にキャンバスのノードを押すとそのノードが選択できる", async () => {
  await renderOpenedDocument(setupDocument());
  await goToAssets();

  carryTo("card", drawn("home-panel"));
  releasePointer(drawn("home-panel"), { x: 300, y: 150 });
  /*
   * 落とした直後の `click` はキャンバスの枠まで上がってこない（押した場所が左ペイン）。
   * ここで飲み込む状態に入っていると、この 1 回の選択が黙って消える。
   *
   * `userEvent.click` を使わないのは、あれが自前の `pointerup` を伴い、それが器の
   * `release` を通って飲み込む状態を先に消してしまうため。ブラウザが drop の直後に
   * 投げるのは素の `click` 1 つだけなので、それだけを起こす。
   */
  fireEvent.click(drawn("home-title"));

  expect(within(propertyPane()).getByText("home-title")).toBeDefined();
});

test("パレットの行を掴んでも選択は変わらない", async () => {
  await renderOpenedDocument(setupDocument());
  await selectInTree("home-title");
  await goToAssets();

  carryTo("card", drawn("home-panel"));

  // UI 案「Assets is browse-only — the inspector keeps the previous selection」
  expect(within(propertyPane()).getByText("home-title")).toBeDefined();
});

test("落としても選択は動かない", async () => {
  await renderOpenedDocument(setupDocument());
  await selectInTree("home-title");
  await goToAssets();

  carryTo("card", drawn("home-panel"));
  releasePointer(drawn("home-panel"), { x: 300, y: 150 });

  // 挿入は続けて挿せるのが素直な繰り返し（`EditorState.insertNode` と同じ）
  expect(within(propertyPane()).getByText("home-title")).toBeDefined();
});
