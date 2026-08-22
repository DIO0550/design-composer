import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { rowNames } from "@/components/__tests__/row-names";
import {
  breakFileExternally,
  canvasPane,
  fixFileExternally,
  leftPane,
  propertyPane,
  renderOpenedDocument,
  selectArtboard,
  selectInTree,
  tree,
  zoomToolbar,
} from "./setup";

/*
 * 外部編集でファイルが壊れたときに、表示がファイルと食い違っていることが画面へ出るか
 * （#135）。凍結は上部バー・左ペイン・キャンバス・右ペインへ同時に効くので、
 * 配線ごと確かめられるのはここだけ（部品単体のストーリーには相手のペインが居ない）。
 *
 * 「操作を受け付けない」は `inert` で作っているが、**happy-dom が強制するのは
 * フォーカスまでで click は届く**。押せないこと自体はブラウザでしか確かめられないので、
 * ここでは属性が付くところまでを見る（キーボードからの活性化が止まることは
 * `artboard-canvas.frozen.test.tsx` が確かめている）。
 */

test("外部変更でファイルが壊れると、映っているのが最後に正常だった表示だとキャンバスに出る", async () => {
  const fake = await renderOpenedDocument();

  await breakFileExternally(fake);

  expect(within(canvasPane()).getByText("最後に正常だった表示")).toBeDefined();
});

test("ファイルが壊れていなければ、最後に正常だった表示とは名乗らない", async () => {
  await renderOpenedDocument();

  expect(screen.queryByText("最後に正常だった表示")).toBeNull();
});

test("ファイルが壊れると、左ペインが操作を受け付けなくなる", async () => {
  const fake = await renderOpenedDocument();

  await breakFileExternally(fake);

  expect(leftPane().hasAttribute("inert")).toBe(true);
});

test("ファイルが壊れると、左ペインの見出しが凍結中を名乗る", async () => {
  const fake = await renderOpenedDocument();

  await breakFileExternally(fake);

  expect(within(leftPane()).getByText("凍結中")).toBeDefined();
});

test("ファイルが壊れていなければ、左ペインの見出しは凍結中を名乗らない", async () => {
  await renderOpenedDocument();

  expect(within(leftPane()).queryByText("凍結中")).toBeNull();
});

test("ファイルが壊れると、キャンバスの中身が操作を受け付けなくなる", async () => {
  const fake = await renderOpenedDocument();

  await breakFileExternally(fake);

  expect(screen.getByTestId("canvas-content").hasAttribute("inert")).toBe(true);
});

/*
 * `Create component` フッターの `disabled` は `CreateComponent` の props `isFrozen` に
 * 直接繋がっている。`left-pane` の側で `EditorState.isFileInvalid(state)` を渡す
 * 配線を通しで固定するため、Assets を開いてから凍結する順で見る。押せることを対照に
 * 置かないと、フッターが最初から無い実装でも通ってしまう（rules/testing.md
 * 「その assert は落ちうるか」）。
 */
/*
 * `Create component` フッターの押せる/押せないは、下書きを打ってはじめて `isFrozen` に
 * 効く（打つ前は押しても入力欄を開くだけなので凍結の可否とは別）。下書きを打ってから
 * 壊す並びで見ることで、`left-pane` が `isFrozen={EditorState.isFileInvalid(state)}` を
 * 渡す配線を、フッターの `disabled` 属性で通しに固定できる。押せる状態を対照に置かないと、
 * フッターが最初から disabled な実装でも通る（rules/testing.md「その assert は落ちうるか」）。
 */
test("Assets を開いて下書きを入れているとき、ファイルが壊れると Create component が押せなくなる", async () => {
  const fake = await renderOpenedDocument();
  // 部品にできるノードを Layers 側で選んでから Assets に切り替える（ツリーは Layers 側にしか出ない）
  await selectInTree("home-title");
  await userEvent.click(
    within(leftPane()).getByRole("button", { name: "Assets" }),
  );
  // 下書きを開いて使える名前を打つ。ここまでで押せる状態
  await userEvent.click(
    within(leftPane()).getByRole("button", { name: /Create component/ }),
  );
  await userEvent.type(
    within(leftPane()).getByRole("textbox", { name: "部品名" }),
    "info-panel",
  );
  expect(
    within(leftPane())
      .getByRole("button", { name: /Create component/ })
      .hasAttribute("disabled"),
  ).toBe(false);

  await breakFileExternally(fake);

  expect(
    within(leftPane())
      .getByRole("button", { name: /Create component/ })
      .hasAttribute("disabled"),
  ).toBe(true);
});

test("ファイルが壊れると、選んでいたノードのプロパティを編集できなくなる", async () => {
  const fake = await renderOpenedDocument();
  await selectInTree("home-title");
  // 壊す前は編集できることを対照に置く（欄が最初から無い実装でも通ってしまうため）
  expect(
    within(propertyPane()).getByRole("button", { name: "選択を解除" }),
  ).toBeDefined();

  await breakFileExternally(fake);

  expect(
    within(propertyPane()).queryByRole("button", { name: "選択を解除" }),
  ).toBeNull();
  expect(within(propertyPane()).getByText("選択は凍結中")).toBeDefined();
});

test("ファイルが壊れても、右ペインの見出しは選んでいたものを保つ", async () => {
  const fake = await renderOpenedDocument();
  await selectInTree("home-title");

  await breakFileExternally(fake);

  expect(
    within(screen.getByTestId("right-pane-heading")).getByText("home-title"),
  ).toBeDefined();
});

test("ファイルが壊れると、上部バーが保存状態ではなくエラーの件数を出す", async () => {
  const fake = await renderOpenedDocument();

  await breakFileExternally(fake);

  expect(screen.getByText(/件のエラー · ファイルが不正/)).toBeDefined();
  // 出た側だけを見ると、保存状態を残したまま足した実装でも通ってしまう
  expect(screen.queryByText("保存済み")).toBeNull();
});

test("凍結中も倍率は操作できる", async () => {
  const fake = await renderOpenedDocument();
  await breakFileExternally(fake);

  await userEvent.click(
    within(zoomToolbar()).getByRole("button", { name: "拡大" }),
  );

  expect(
    screen.getByTestId("canvas-content").getAttribute("style") ?? "",
  ).toContain("scale(1.2)");
});

test("ファイルが直ると凍結が解けて通常表示に戻る", async () => {
  const fake = await renderOpenedDocument();
  await breakFileExternally(fake);

  await fixFileExternally(fake);

  expect(screen.queryByText("最後に正常だった表示")).toBeNull();
  expect(leftPane().hasAttribute("inert")).toBe(false);
});

test("Tokens を開いたままファイルが壊れると、トークンの編集欄が残らない", async () => {
  const fake = await renderOpenedDocument();
  await userEvent.click(
    within(leftPane()).getByRole("button", { name: "Tokens" }),
  );
  await userEvent.click(
    // `primary-dark` に巻き込まれないよう、値まで含めて 1 つに絞る
    within(leftPane()).getByRole("button", { name: "primary #3b82f6" }),
  );
  // 壊す前は編集できることを対照に置く。行き先を見ない実装でも通ってしまうため
  expect(
    within(propertyPane()).getByRole("region", { name: "トークン編集" }),
  ).toBeDefined();

  await breakFileExternally(fake);

  expect(
    within(propertyPane()).queryByRole("region", { name: "トークン編集" }),
  ).toBeNull();
  expect(within(propertyPane()).getByText("選択は凍結中")).toBeDefined();
});

/*
 * 凍結が**ショートカット経由の編集にも効く**こと（#155）。`inert` は `document` に
 * 張ったキーハンドラを止めないので、ここが切れると凍結中の画面から編集が通る。
 *
 * ファイルが書き換わらないことはここでは見ない。自動保存は 500ms のデバウンスで、
 * このファイルはフェイクタイマーを使っていないため、タイマーを進めない限り実装が
 * 何をしてもファイルは変わらず assert が落ちない。書き込みの抑止は
 * `document-sync` の `use-auto-save.file-invalid.test.tsx` が持つ。
 */

test("ファイルが壊れると、Delete を押してもツリーからノードが消えない", async () => {
  const fake = await renderOpenedDocument();
  await selectInTree("home-title");
  // 壊す前は消せることを対照に置く（Delete が元から効かない実装でも通ってしまうため）
  await userEvent.keyboard("{Delete}");
  expect(rowNames(tree())).toEqual(["home-login"]);
  await fixFileExternally(fake);
  await selectInTree("home-title");

  await breakFileExternally(fake);
  await userEvent.keyboard("{Delete}");

  expect(rowNames(tree())).toEqual(["home-title", "home-login"]);
});

test("ファイルが壊れると、Ctrl+V を押してもツリーにノードが増えない", async () => {
  const fake = await renderOpenedDocument();
  await selectInTree("home-title");
  await userEvent.keyboard("{Control>}c{/Control}");
  // 挿せる先へ選択を移す。Text を選んだままだと凍結と関係なく貼れず、
  // 凍結を外しても増えないので何も守らないテストになる
  await selectArtboard("home");

  await breakFileExternally(fake);
  await userEvent.keyboard("{Control>}v{/Control}");

  expect(rowNames(tree())).toEqual(["home-title", "home-login"]);
});

test("ファイルが壊れると、Ctrl+Z を押しても直前の編集が戻らない", async () => {
  const fake = await renderOpenedDocument();
  await selectInTree("home-title");
  await userEvent.keyboard("{Delete}");
  expect(rowNames(tree())).toEqual(["home-login"]);

  await breakFileExternally(fake);
  await userEvent.keyboard("{Control>}z{/Control}");

  expect(rowNames(tree())).toEqual(["home-login"]);
});
