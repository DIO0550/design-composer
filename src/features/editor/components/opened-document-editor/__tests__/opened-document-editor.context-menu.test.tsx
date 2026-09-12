import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import { artboardHandle } from "@/features/canvas/__tests__";
import { rightPaneHeading } from "@/features/editor/__tests__/right-pane-heading";
import { SampleDocumentWithDeepBranch } from "@/features/editor/__tests__/sample-document";
import {
  breakFileExternally,
  drawn,
  renderOpenedDocument,
  selectArtboard,
  selectInTree,
  tree,
} from "./setup";

/*
 * 右クリックからメニューを開いて操作するところまでを、編集画面の配線ごと確かめる
 * （docs/06-ui.md「コンテキストメニュー」）。
 *
 * 並ぶものと押せるかどうかは `EditMenu` のテストが固定するので、ここで見るのは
 * 「押された場所に応じたメニューが出るか」と「行を押すと実際にドキュメントが変わるか」。
 *
 * ↑↓ がページ全体の割り当てへ漏れないことは器の層（`context-menu.keyboard`）が実物の
 * `useKeyShortcut` で見る。ここで同じことを見るには絶対配置のノードのフィクスチャが要り、
 * `opened-document-editor.reposition` と同じものを 2 つ持つことになる。
 */

/** 開いているメニュー。出ていなければテストを落とす。 */
function contextMenu(): HTMLElement {
  return screen.getByRole("menu", { name: "コンテキストメニュー" });
}

/**
 * メニューの行。
 *
 * @param label 行の綴り。読み上げ名は綴りのうしろに割り当てが並ぶので前方一致で引く
 * @returns その行のボタン
 */
function menuRow(label: string): HTMLElement {
  return within(contextMenu()).getByRole("menuitem", {
    name: new RegExp(`^${label}`),
  });
}

/**
 * キャンバスに描かれたものを右クリックする。
 *
 * @param target 押す要素
 * @param at 押した窓の座標。省くと折り返しの起きない位置
 */
function rightClick(
  target: Element,
  at: Readonly<{ x: number; y: number }> = { x: 120, y: 80 },
): void {
  fireEvent.contextMenu(target, { clientX: at.x, clientY: at.y });
}

test("キャンバスのノードを右クリックするとメニューが出る", async () => {
  await renderOpenedDocument();

  rightClick(drawn("home-title"));

  expect(contextMenu()).toBeDefined();
});

test("キャンバスのノードを右クリックすると、押した枝の入口が選ばれる", async () => {
  await renderOpenedDocument();

  rightClick(drawn("home-title"));

  expect(rightPaneHeading().textContent).toContain("home-title");
});

test("何も選んでいないときに深いノードを右クリックすると、選ばれるのは枝の入口までになる", async () => {
  await renderOpenedDocument(SampleDocumentWithDeepBranch);

  // いちばん内側まで掘る指定だと `deep-title` が選ばれる（左クリックと同じ規則に従う）
  rightClick(drawn("deep-title"));

  expect(rightPaneHeading().textContent).toContain("outer-panel");
});

test("メニューの Delete を押すと、ツリーからそのノードが消える", async () => {
  await renderOpenedDocument();

  rightClick(drawn("home-title"));
  await userEvent.click(menuRow("Delete"));

  expect(rowNames(tree())).toEqual(["home-login"]);
});

test("ノードのメニューの Copy のあと空き領域のメニューの Paste を押すと、ツリーに 1 つ増える", async () => {
  await renderOpenedDocument();

  rightClick(drawn("home-title"));
  await userEvent.click(menuRow("Copy"));
  /*
   * 貼り先は選択から決まる（docs/06-ui.md）。Text は子を持てないので、貼る前に
   * 子を持てるもの（ここでは artboard）へ選択を移す。空き領域のメニューは選択に
   * 手を付けないので、そのままの選択へ貼れる。
   */
  await selectArtboard("home");
  rightClick(screen.getByTestId("canvas-surface"));
  await userEvent.click(menuRow("Paste"));

  expect(rowNames(tree())).toEqual([
    "home-title",
    "home-login",
    "home-title-2",
  ]);
});

test("メニューの Bring forward を押すと、ツリーの並びが入れ替わる", async () => {
  await renderOpenedDocument();

  rightClick(drawn("home-title"));
  await userEvent.click(menuRow("Bring forward"));

  expect(rowNames(tree())).toEqual(["home-login", "home-title"]);
});

test("行を押すとメニューが閉じる", async () => {
  await renderOpenedDocument();

  rightClick(drawn("home-title"));
  await userEvent.click(menuRow("Copy"));

  expect(
    screen.queryByRole("menu", { name: "コンテキストメニュー" }),
  ).toBeNull();
});

test("artboard の枠を右クリックすると、並ぶのは名前を変更と削除になる", async () => {
  await renderOpenedDocument();

  rightClick(drawn("home"));

  expect(within(contextMenu()).getAllByRole("menuitem")).toHaveLength(2);
  expect(menuRow("Rename")).toBeDefined();
  expect(menuRow("Delete")).toBeDefined();
});

test("artboard の見出しを右クリックしても artboard のメニューが出る", async () => {
  await renderOpenedDocument();

  rightClick(artboardHandle("home"));

  expect(within(contextMenu()).getAllByRole("menuitem")).toHaveLength(2);
});

test("空き領域を右クリックすると取り消す・やり直すが並ぶ", async () => {
  await renderOpenedDocument();

  rightClick(screen.getByTestId("canvas-surface"));

  expect(menuRow("Undo")).toBeDefined();
  expect(menuRow("Redo")).toBeDefined();
});

test("空き領域のメニューの Undo を押すと、直前の編集が戻る", async () => {
  await renderOpenedDocument();
  await selectInTree("home-title");
  await userEvent.keyboard("{Delete}");

  rightClick(screen.getByTestId("canvas-surface"));
  await userEvent.click(menuRow("Undo"));

  expect(rowNames(tree())).toEqual(["home-title", "home-login"]);
});

test("掘って選んでいるノードの上で右クリックしても、選択は外側へ戻らない", async () => {
  await renderOpenedDocument(SampleDocumentWithDeepBranch);
  // ツリーからなら階層を問わず直に選べる（キャンバスのクリックは 1 階層ずつ掘る）
  await selectInTree("deep-title");

  rightClick(drawn("deep-title"));

  expect(rightPaneHeading().textContent).toContain("deep-title");
});

test("メニューが開いている間の Esc は、選択を外さずメニューだけを閉じる", async () => {
  await renderOpenedDocument();

  rightClick(drawn("home-title"));
  await userEvent.keyboard("{Escape}");

  expect(
    screen.queryByRole("menu", { name: "コンテキストメニュー" }),
  ).toBeNull();
  expect(rightPaneHeading().textContent).toContain("home-title");
});

test("ファイルが不正な間は右クリックでメニューが出ない", async () => {
  const ipc = await renderOpenedDocument();
  await breakFileExternally(ipc);

  rightClick(drawn("home-title"));

  expect(
    screen.queryByRole("menu", { name: "コンテキストメニュー" }),
  ).toBeNull();
});

test("貼るものが無いときは、空き領域のメニューの Paste が押せない", async () => {
  await renderOpenedDocument();

  rightClick(screen.getByTestId("canvas-surface"));

  expect(menuRow("Paste").hasAttribute("disabled")).toBe(true);
});

test("コピー済みで貼り先があるときは、空き領域のメニューの Paste が押せる", async () => {
  await renderOpenedDocument();
  rightClick(drawn("home-title"));
  await userEvent.click(menuRow("Copy"));
  await selectArtboard("home");

  // 上のテストの対照。これが無いと、どの行も押せないメニューでも通ってしまう
  rightClick(screen.getByTestId("canvas-surface"));

  expect(menuRow("Paste").hasAttribute("disabled")).toBe(false);
});

test("行にはキーボードの割り当てが併記される", async () => {
  await renderOpenedDocument();

  rightClick(drawn("home-title"));

  expect(menuRow("Copy").textContent).toContain("⌘C");
});

test("別の場所を右クリックすると、メニューがそこへ開き直す", async () => {
  await renderOpenedDocument();
  rightClick(drawn("home-title"));

  rightClick(screen.getByTestId("canvas-surface"));

  // artboard でもノードでもない空き領域のメニューに入れ替わる
  expect(menuRow("Undo")).toBeDefined();
});

/*
 * 器は高さを children に並ぶ組と行の数から出す（実測は happy-dom が 0 を返す）。器の層の
 * テストは手で組んだ children で見ているので、**呼び出し側が `map` で組んだ並びでも同じ
 * ように数えられること**はここで見る。数え損なうと行は正しく出たまま位置だけが狂うので、
 * 器の層では気づけない。
 */
test("下端の近くでノードを右クリックすると、並ぶ行のぶんだけメニューが上へ折り返す", async () => {
  await renderOpenedDocument();

  // 窓の高さは happy-dom の既定（768）
  rightClick(drawn("home-title"), { x: 120, y: 760 });

  // ノードのメニューは 5 組 7 行 = 6 + 26 × 7 + 9 × 4 + 6 = 230px
  expect(contextMenu().style.top).toBe("530px");
});
