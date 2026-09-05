import { fireEvent, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
  releasePointer,
  wheel,
} from "@/features/canvas/__tests__/canvas-gesture";
import { Option } from "@/utils/Option";
import { nameSelector } from "../name-style-rule";
import {
  CarriedNodeUnclipped,
  repositionPreviewDeclarations,
} from "../reposition-preview-style";
import {
  artboardList,
  drawn,
  drawnAt,
  injectedStyles,
  renderCanvas,
  selectionFromArtboards,
} from "./setup";

/**
 * `home` に絶対配置の `badge` とフローの `title` が並び、隣に `settings` がある未選択の対。
 *
 * `badge` と `title` を並べるのは、同じドラッグが配置によって別の意味になることを
 * 対照付きで確かめるため（片方だけだと、出し分けを丸ごと壊しても通る）。
 * `settings` は親の付け替え先。
 *
 * @param badgeAt `badge` を置く座標。省略すると `home` の内側
 * @returns その座標に `badge` を置いたドキュメントと、未選択の対
 */
function setupSelection(
  badgeAt: Readonly<{ x: number; y: number }> = { x: 40, y: 24 },
): DocumentSelection {
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "badge",
            type: "Text",
            props: {
              content: "3",
              placement: "absolute",
              x: badgeAt.x,
              y: badgeAt.y,
            },
          },
          { name: "title", type: "Text", props: { content: "ホーム" } },
        ],
      },
      { name: "settings", width: 360, height: 240, children: [] },
    ],
    [],
  );
}

/** ノードを掴んで運び、離すまで。移動量は縦横で違う値にする（取り違えを落とすため）。 */
function dragNode(from: Element, by: Readonly<{ x: number; y: number }>): void {
  pressPointer(from, { x: 100, y: 100 });
  movePointer(from, { x: 100 + by.x, y: 100 + by.y });
  releasePointer(from, { x: 100 + by.x, y: 100 + by.y });
}

/**
 * `badge` を掴んで別の要素の上まで運び、そこで離す。
 *
 * 離すのを運んだ先の要素へ撃つのは、ブラウザで起きるのがそれだから
 * （運んでいるノードは当たり判定から外れる / `repositionPreviewDeclarations`）。
 */
function dragBadgeOnto(to: Element): void {
  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(to, { x: 130, y: 88 });
  releasePointer(to, { x: 130, y: 88 });
}

/**
 * `home` と `settings` に、キャンバス上で離れた位置を与える。
 * `settings` の左上は `home` の左上から (400, 40) ずれた場所にある。
 */
function drawnApart(): void {
  drawnAt("home", { left: 100, top: 60, width: 360, height: 240 });
  drawnAt("settings", { left: 500, top: 100, width: 360, height: 240 });
}

test("絶対配置のノードを運んで離すと、掴んだ時点の座標から動いた分だけずれる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });

  dragNode(drawn("badge"), { x: 30, y: -12 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 70, y: 12 },
  });
});

test("何度も動かしても、ずれるのは掴んだ時点からの合計になる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });

  // 途中のポインタ位置を基準にし直すと、最後の 1 区間分（8, -4）しか動かない
  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(drawn("badge"), { x: 115, y: 95 });
  movePointer(drawn("badge"), { x: 122, y: 92 });
  movePointer(drawn("badge"), { x: 130, y: 88 });
  releasePointer(drawn("badge"), { x: 130, y: 88 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 70, y: 12 },
  });
});

test("絶対配置のノードを同じ親の中で運んでもツリーの並びは変わらない", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode });

  dragNode(drawn("badge"), { x: 30, y: -12 });

  expect(onMoveNode).not.toHaveBeenCalled();
});

test("フローのノードを運ぶと今までどおりツリー内の移動になる", () => {
  const onMoveNode = vi.fn();
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode, onRepositionNode });

  dragNode(drawn("title"), { x: 30, y: -12 });

  expect([
    onMoveNode.mock.calls.length,
    onRepositionNode.mock.calls.length,
  ]).toEqual([1, 0]);
});

test("押しただけで運んでいなければ座標は動かない", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });

  pressPointer(drawn("badge"), { x: 100, y: 100 });
  releasePointer(drawn("badge"), { x: 100, y: 100 });

  expect(onRepositionNode).not.toHaveBeenCalled();
});

test("運んでいる途中でキャンバスの外へ出ると座標は動かない", () => {
  const onRepositionNode = vi.fn();
  const { container } = renderCanvas({
    selection: setupSelection(),
    onRepositionNode,
  });

  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(drawn("badge"), { x: 130, y: 88 });
  // 掴んだあとのポインタを受けているのは 3 ペインの器（`dragHandlers` の付け先）
  fireEvent.pointerLeave(
    Option.unwrap(Option.fromNullable(container.firstElementChild)),
  );
  releasePointer(drawn("badge"), { x: 130, y: 88 });

  expect(onRepositionNode).not.toHaveBeenCalled();
});

test("倍率を上げても、動く量は画面上ではなくドキュメント上の px になる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });
  wheel(screen.getByTestId("canvas-surface"), { x: 0, y: -100 }, "ctrl");

  /*
   * 1.2 倍で見ているとき、画面上の (34, -13) はドキュメント上の
   * (28.33…, -10.83…) にあたる。割り切れない量を選ぶのは、割り切れる量だと
   * 丸めの有無で答えが変わらず「丸めている」ことを確かめられないため。
   */
  dragNode(drawn("badge"), { x: 34, y: -13 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 68, y: 13 },
  });
});

test("親の外へ出る位置で離すと、はみ出した座標がそのまま届く", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });

  // 親（360×240）の右下より外へ出る量。収めると (316, 216) のような値で止まる
  dragNode(drawn("badge"), { x: 400, y: 300 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 440, y: 324 },
  });
});

test("もともと親の外にあるノードを動かしても、親の内側へ戻らない", () => {
  const onRepositionNode = vi.fn();
  // 左へ出た x と下へ出た y にして、軸ごとに違う側で確かめる
  renderCanvas({
    selection: setupSelection({ x: -104, y: 300 }),
    onRepositionNode,
  });

  dragNode(drawn("badge"), { x: 8, y: 6 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: -96, y: 306 },
  });
});

test("親が変わらなければ、2 つの親を実測していてもずれは足されない", () => {
  // 実測値をそのまま足す実装だと、同じ親の中で運んだだけで座標が親の位置ぶん飛ぶ
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });
  drawnApart();

  dragNode(drawn("badge"), { x: 30, y: -12 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "home",
    placement: { mode: "absolute", x: 70, y: 12 },
  });
});

test("別の artboard の上で離すと、その artboard を親にした置き直しになる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });
  drawnApart();

  dragBadgeOnto(drawn("settings"));

  expect(onRepositionNode).toHaveBeenCalledWith(
    "badge",
    expect.objectContaining({ parentName: "settings" }),
  );
});

test("親をまたいで離すと、届く座標は 2 つの親の左上のずれを打ち消した値になる", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });
  drawnApart();

  dragBadgeOnto(drawn("settings"));

  /*
   * 掴んだ時点 (40, 24) から (30, -12) 運んだ先は `home` 基準で (70, 12)。
   * `settings` の左上は `home` の左上から (400, 40) 右下にあるので、
   * 同じ画面上の位置は `settings` 基準では (-330, -28) になる。
   */
  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "settings",
    placement: { mode: "absolute", x: -330, y: -28 },
  });
});

test("倍率を上げると、親の左上のずれもドキュメント上の px へ割り戻される", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });
  wheel(screen.getByTestId("canvas-surface"), { x: 0, y: -100 }, "ctrl");
  drawnApart();

  dragBadgeOnto(drawn("settings"));

  /*
   * 1.2 倍で見ているとき、画面上の移動量 (30, -12) はドキュメント上の (25, -10)、
   * 画面上の親のずれ (400, 40) は (333.33…, 33.33…) にあたる。
   * 割り戻さないと (-335, -26) になる。
   */
  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "settings",
    placement: { mode: "absolute", x: -268, y: -19 },
  });
});

test("親をまたいで離しても、ツリーの移動としては届かない", () => {
  // 木の付け替えは置き直しに含まれる（`DesignDocument.reposition`）
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onMoveNode });
  drawnApart();

  dragBadgeOnto(drawn("settings"));

  expect(onMoveNode).not.toHaveBeenCalled();
});

test("落とせる親が無い場所で離しても置き直しは届かない", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });

  dragBadgeOnto(artboardList());

  expect(onRepositionNode).not.toHaveBeenCalled();
});

/**
 * 掴んだノードへ差し込まれる、ずらして見せる規則 1 本。
 *
 * 宣言だけでなく**選択子込み**で組むのは、付ける相手を取り違えても宣言だけの
 * 突き合わせでは落ちないため（規則が別のノードへ付くと付け替えが丸ごと壊れる）。
 *
 * @param name ずれて見えるはずのノードの名前
 * @param offset ドキュメント上の px で表した移動量
 * @returns そのノードへ差し込まれる規則 1 本
 */
function previewRule(
  name: string,
  offset: Readonly<{ x: number; y: number }>,
): string {
  return `${nameSelector(name)}{${repositionPreviewDeclarations(offset)}}`;
}

/**
 * `badge` を掴んだまま、まだ離していない状態にする。
 * 離す前の見た目を見るので `releasePointer` は撃たない。
 */
function carryBadge(by: Readonly<{ x: number; y: number }>): void {
  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(drawn("badge"), { x: 100 + by.x, y: 100 + by.y });
}

test("運んでいる間、掴んだノードは離す位置まで見た目だけ先に動く", () => {
  renderCanvas({ selection: setupSelection() });

  carryBadge({ x: 30, y: -12 });

  expect(injectedStyles()).toContain(previewRule("badge", { x: 30, y: -12 }));
});

test("倍率を上げても、見た目の移動量は画面上ではなくドキュメント上の px になる", () => {
  renderCanvas({ selection: setupSelection() });
  wheel(screen.getByTestId("canvas-surface"), { x: 0, y: -100 }, "ctrl");

  // 1.2 倍で見ているとき、画面上の (34, -13) はドキュメント上の (28.33…, -10.83…)。
  // 丸めた行き先から逆算するので、見た目のずれも確定後と同じ (28, -11) になる
  carryBadge({ x: 34, y: -13 });

  expect(injectedStyles()).toContain(previewRule("badge", { x: 28, y: -11 }));
});

test("親をまたいで運んでいる間も、見た目のずらし量は運んだ分のままになる", () => {
  renderCanvas({ selection: setupSelection() });
  drawnApart();

  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(drawn("settings"), { x: 130, y: 88 });

  // 書かれる座標は親のずれを含むが、画面上の位置は動かないので見た目は運んだ分だけ
  expect(injectedStyles()).toContain(previewRule("badge", { x: 30, y: -12 }));
});

test("運んでいる間、掴んだノードは当たり判定から外れる", () => {
  /*
   * これが無いとポインタの下にあるのは運んでいるノード自身になり、
   * 落とし先の親が元の親から動かなくなる（happy-dom は CSS の当たり判定を
   * 解釈しないので、宣言が出ていることでしか確かめられない）。
   */
  renderCanvas({ selection: setupSelection() });

  carryBadge({ x: 30, y: -12 });

  expect(injectedStyles()).toContain("pointer-events:none");
});

/**
 * 包んでいるものへ差し込まれる、切り取りを解く規則 1 本。
 *
 * `previewRule` と同じく**選択子込み**で組む。宣言だけを見ると、解く相手が
 * 包んでいるものかどうかを取り違えても落ちない。
 *
 * @param name 切り取りを解かれるはずの artboard / ノードの名前
 * @returns そこへ差し込まれる規則 1 本
 */
function unclippedRule(name: string): string {
  return `${nameSelector(name)}{${CarriedNodeUnclipped}}`;
}

/**
 * `home` の中の `card` に絶対配置の `badge` が入っている、未選択の対。
 * 包んでいるものが 2 段あるので、artboard 1 枚だけを解く実装と区別できる。
 */
function setupNestedSelection(): DocumentSelection {
  return selectionFromArtboards(
    [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "card",
            type: "Box",
            props: {},
            children: [
              {
                name: "badge",
                type: "Text",
                props: { content: "3", placement: "absolute", x: 40, y: 24 },
              },
            ],
          },
        ],
      },
    ],
    [],
  );
}

test("運んでいる間、掴んだノードを包んでいる artboard は中身を切り取らなくなる", () => {
  // 解かないと、artboard の外まで運んだ時点で運んでいるノードが見えなくなる
  renderCanvas({ selection: setupSelection() });

  carryBadge({ x: 30, y: -12 });

  expect(injectedStyles()).toContain(unclippedRule("home"));
});

test("包んでいるものが入れ子のときは、間の Box も中身を切り取らなくなる", () => {
  // Box も `overflow: clip` を持てるので、artboard 1 枚を解くだけでは足りない
  renderCanvas({ selection: setupNestedSelection() });

  carryBadge({ x: 30, y: -12 });

  expect(injectedStyles()).toContain(unclippedRule("card"));
});

test("運んでいる間、掴んだノードは他の artboard より前に出る", () => {
  /*
   * artboard の枠は z-index を持たない兄弟なので、前に出さないと隣の artboard の
   * 白い面の裏へ回る（happy-dom は重なりを解釈しないので、宣言でしか確かめられない）。
   */
  renderCanvas({ selection: setupSelection() });

  carryBadge({ x: 30, y: -12 });

  expect(injectedStyles()).toContain("z-index:1");
});

test("フローのノードを運んでいる間は、包んでいるものの切り取りを解かない", () => {
  // 見た目を動かさないドラッグなので、切り取りの外へ出るものが無い
  renderCanvas({ selection: setupSelection() });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(drawn("title"), { x: 130, y: 88 });

  expect(injectedStyles()).not.toContain(CarriedNodeUnclipped);
});

test("離すと包んでいるものの切り取りは元に戻る", () => {
  renderCanvas({ selection: setupSelection() });
  carryBadge({ x: 30, y: -12 });

  releasePointer(drawn("badge"), { x: 130, y: 88 });

  expect(injectedStyles()).not.toContain(CarriedNodeUnclipped);
});

test("座標のドラッグでも、落とし先の親が枠で示される", () => {
  renderCanvas({ selection: setupSelection() });
  drawnApart();

  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(drawn("settings"), { x: 130, y: 88 });

  expect(injectedStyles()).toContain(
    '[data-name="settings"]{outline:2px dashed',
  );
});

test("落とせる親が無い場所へ運んでいる間は、落とし先の枠が出ない", () => {
  // 枠そのものを見る（規則が 1 本も無いことではなく、出し分けを狙う）
  renderCanvas({ selection: setupSelection() });

  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(artboardList(), { x: 130, y: 88 });

  expect(injectedStyles()).not.toContain("outline:2px dashed");
});

test("フローのノードを運んでいる間は、絶対配置のノードを動かさない", () => {
  renderCanvas({ selection: setupSelection() });

  pressPointer(drawn("title"), { x: 100, y: 100 });
  movePointer(drawn("title"), { x: 130, y: 88 });

  // `badge` が動いていないことを見る（規則が 1 本も無いことではなく、
  // 動かす側を壊しても動かしすぎる側を壊しても落ちる形にする）
  expect(injectedStyles()).not.toContain("transform:translate(");
});

test("運んでいる途中でキャンバスの外へ出ると見た目も戻る", () => {
  const { container } = renderCanvas({ selection: setupSelection() });
  carryBadge({ x: 30, y: -12 });

  fireEvent.pointerLeave(
    Option.unwrap(Option.fromNullable(container.firstElementChild)),
  );

  expect(injectedStyles()).not.toContain("transform:translate(");
});

test("落とせる親が無い場所へ運んでいる間も、掴んだノードはずれたままになる", () => {
  /*
   * 落とせなくなるたびに元の位置へ戻すと、キャンバスの余白へ一瞬寄っただけで
   * 運べているのか分からなくなる（PR #407 のレビュー指摘）。落とせないことは
   * 落とし先の枠が出ないことで示す。
   */
  renderCanvas({ selection: setupSelection() });
  carryBadge({ x: 30, y: -12 });

  movePointer(artboardList(), { x: 130, y: 88 });

  expect(injectedStyles()).toContain(previewRule("badge", { x: 30, y: -12 }));
});

test("落とせる親が無い場所を通っても、戻ってくれば置き直しが届く", () => {
  const onRepositionNode = vi.fn();
  renderCanvas({ selection: setupSelection(), onRepositionNode });
  drawnApart();

  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(artboardList(), { x: 200, y: 300 });
  movePointer(drawn("settings"), { x: 130, y: 88 });
  releasePointer(drawn("settings"), { x: 130, y: 88 });

  expect(onRepositionNode).toHaveBeenCalledWith("badge", {
    parentName: "settings",
    placement: { mode: "absolute", x: -330, y: -28 },
  });
});

test("離すと見た目のずれは消える（座標そのものが動くため）", () => {
  renderCanvas({ selection: setupSelection() });
  carryBadge({ x: 30, y: -12 });

  releasePointer(drawn("badge"), { x: 130, y: 88 });

  expect(injectedStyles()).not.toContain("transform:translate(");
});
