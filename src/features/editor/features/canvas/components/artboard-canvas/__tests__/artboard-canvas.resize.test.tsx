import { fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { DocumentSelection } from "@/domains/session/document-selection";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { canvasContent } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import type { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import {
  drawn,
  drawnAt,
  renderCanvas,
  resizeHandleAt,
  resizeHandles,
} from "./setup";

/**
 * `home` に、2 軸とも固定の `panel`、幅だけ固定の `banner`、
 * モードを指定していない `title`、部品インスタンスの `action`、
 * 2 軸とも固定で親から見た座標を持つ `badge` が並ぶ状態。
 */
function setupSelection(
  selectedNames: readonly string[] = [],
): DocumentSelection {
  const designDocument = DesignDocument.create({
    components: { card: { type: "Box", children: [] } },
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "panel",
            type: "Box",
            props: {
              widthMode: "fixed",
              width: 200,
              heightMode: "fixed",
              height: 100,
            },
            children: [],
          },
          {
            name: "banner",
            type: "Box",
            props: { widthMode: "fixed", width: 200 },
            children: [],
          },
          { name: "title", type: "Text", props: { content: "ホーム" } },
          { name: "action", ref: "card" },
          {
            name: "badge",
            type: "Box",
            props: {
              widthMode: "fixed",
              width: 200,
              heightMode: "fixed",
              height: 100,
              placement: "absolute",
              x: 25,
              y: 10,
            },
            children: [],
          },
        ],
      },
    ],
  });
  return DocumentSelection.fromNames(designDocument, selectedNames);
}

/** 画面の (100, 50) に 200x100 で描かれている、という前提。右辺 x=300 / 下辺 y=150。 */
const PanelBounds: CanvasBounds = {
  left: 100,
  top: 50,
  width: 200,
  height: 100,
};

test("2 軸とも fixed のノードを選ぶとハンドルが描かれる", () => {
  renderCanvas({ selection: setupSelection(["panel"]) });

  // 四隅と各辺の中間の 8 箇所（docs/06-ui.md「リサイズハンドル」）
  expect(resizeHandles()).toHaveLength(8);
});

test("幅だけが fixed のノードを選んでもハンドルが描かれる", () => {
  /*
   * ハンドルは掴める軸ごとではなく、掴める軸が 1 つでもあれば四隅に出す
   * （UI 案 docs/Design Composer.html の `login-form` は width=fixed / height=hug）。
   */
  renderCanvas({ selection: setupSelection(["banner"]) });

  expect(resizeHandles()).toHaveLength(8);
});

test("モードを指定していないノードを選んでもハンドルは描かれない", () => {
  renderCanvas({ selection: setupSelection(["title"]) });

  expect(resizeHandles()).toHaveLength(0);
});

test("部品インスタンスを選んでもハンドルは描かれない", () => {
  renderCanvas({ selection: setupSelection(["action"]) });

  expect(resizeHandles()).toHaveLength(0);
});

test("artboard を選ぶとハンドルが描かれる", () => {
  renderCanvas({ selection: setupSelection(["home"]) });

  expect(resizeHandles()).toHaveLength(8);
});

test("何も選んでいなければハンドルは描かれない", () => {
  renderCanvas({ selection: setupSelection() });

  expect(resizeHandles()).toHaveLength(0);
});

test("右辺を掴んで右へ運ぶと、動かした分だけ幅が伸びた大きさが通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 298, y: 100 });
  movePointer(panel, { x: 338, y: 100 });
  releasePointer(panel, { x: 338, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 240 }]),
    expect.anything(),
  );
});

test("下辺を掴んで下へ運ぶと、動かした分だけ高さが伸びた大きさが通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 200, y: 148 });
  movePointer(panel, { x: 200, y: 178 });
  releasePointer(panel, { x: 200, y: 178 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "height", length: 130 }]),
    expect.anything(),
  );
});

test("ハンドルから離れたところを掴んで運んでも大きさは変わらない", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 200, y: 100 });
  movePointer(panel, { x: 240, y: 100 });
  releasePointer(panel, { x: 240, y: 100 });

  expect(onResize).not.toHaveBeenCalled();
});

test("選んでいないノードの辺を掴んでも大きさは変わらない", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["title"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 298, y: 100 });
  movePointer(panel, { x: 338, y: 100 });

  expect(onResize).not.toHaveBeenCalled();
});

test("ハンドルを掴んでいる間はツリー内の移動が起きない", () => {
  const onMoveNode = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onMoveNode });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 298, y: 100 });
  movePointer(drawn("title"), { x: 338, y: 100 });
  releasePointer(drawn("title"), { x: 338, y: 100 });

  expect(onMoveNode).not.toHaveBeenCalled();
});

test("大きさを変えた直後のクリックでは選択が変わらない", () => {
  const onSelect = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onSelect });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 298, y: 100 });
  movePointer(panel, { x: 338, y: 100 });
  releasePointer(panel, { x: 338, y: 100 });
  fireEvent.click(drawn("title"));

  expect(onSelect).not.toHaveBeenCalled();
});

test("幅のハンドルを掴んで右へ運ぶと、動かした分だけ幅が伸びた大きさが通知される", () => {
  /*
   * ハンドルは辺をまたいで置かれるので外半分は要素の矩形の外にあり、帯の当たり判定
   * （`NodeResize.grabAt`）では掴めない。掴んだあとの移動と解放を受けるのは
   * キャンバスの器なので、運ぶ側はノードへ dispatch する（そこから器へ泡立つ）。
   */
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(resizeHandleAt({ x: 1, y: 0.5 }), { x: 300, y: 100 });
  movePointer(panel, { x: 340, y: 100 });
  releasePointer(panel, { x: 340, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "width", length: 240 }]),
    expect.anything(),
  );
});

test("測り直すと、幅のハンドルは要素の右辺の上へ置かれる", () => {
  /*
   * 測定 → 描画の配線。ハンドルが出ているだけでは、測った矩形を使わずに置いていても
   * 通ってしまう。器の矩形は happy-dom では 0 なので、client 座標がそのまま
   * 器からの相対になる。右辺 300 の上に中心が来るので、左端は 5px ぶん手前。
   */
  renderCanvas({ selection: setupSelection(["panel"]) });
  drawnAt("panel", PanelBounds);

  fireEvent(globalThis.window, new Event("resize"));

  expect(resizeHandleAt({ x: 1, y: 0.5 }).style.left).toBe("295px");
});

test("高さのハンドルを掴んで下へ運ぶと、動かした分だけ高さが伸びた大きさが通知される", () => {
  // 幅の 1 件だけだと、押されたハンドルに関わらず先頭の軸を掴む実装でも通ってしまう
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(resizeHandleAt({ x: 0.5, y: 1 }), { x: 200, y: 150 });
  movePointer(panel, { x: 200, y: 180 });
  releasePointer(panel, { x: 200, y: 180 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([{ axis: "height", length: 130 }]),
    expect.anything(),
  );
});

test("ハンドルを掴んでいる間は、どのハンドルもポインタを受け取らない", () => {
  /*
   * 掴んだあとの移動と解放を受けるのはキャンバスの器なので、ハンドルが不透明のままだと
   * 追いかけてきたハンドルにポインタが乗った瞬間に器から離脱して取り消しになる。
   * 掴んでいるかをオーバーレイへ渡す配線が切れていても、オーバーレイ自身のテストは
   * props で受け取るぶん通ってしまうのでここで見る。
   */
  renderCanvas({ selection: setupSelection(["panel"]) });
  drawnAt("panel", PanelBounds);

  pressPointer(resizeHandleAt({ x: 1, y: 0.5 }), { x: 300, y: 100 });

  expect(resizeHandles().map((handle) => handle.style.pointerEvents)).toEqual(
    Array(8).fill("none"),
  );
});

test("ハンドルを覆う層はポインタを受け取らず、支援技術からも隠される", () => {
  /*
   * 層はキャンバス全面を覆うので、ポインタを受け取るとノードの選択もパンもできなくなる。
   * ハンドルは選択を示す飾りなので読み上げの対象にもしない（兄弟のオーバーレイと同じ）。
   */
  renderCanvas({ selection: setupSelection(["panel"]) });

  const overlay = resizeHandleAt({ x: 1, y: 0.5 }).parentElement;
  expect([
    overlay?.classList.contains("pointer-events-none"),
    overlay?.getAttribute("aria-hidden"),
  ]).toEqual([true, "true"]);
});

test("右下の角を掴んで斜めに運ぶと、幅と高さが同時に通知される", () => {
  /*
   * 縦横で違う量だけ動かすのは、両軸へ同じ差分を流す実装（軸の取り違え）でも
   * 通ってしまわないようにするため。まとめて 1 回で通知することも同時に見ている
   * （軸ごとに 2 回呼ぶと Undo 1 回で片方しか戻らない）。
   */
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(resizeHandleAt({ x: 1, y: 1 }), { x: 300, y: 150 });
  movePointer(panel, { x: 340, y: 175 });
  releasePointer(panel, { x: 340, y: 175 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.create([
      { axis: "width", length: 240 },
      { axis: "height", length: 125 },
    ]),
    expect.anything(),
  );
});

test("角を掴んでいる間は、器が斜めのカーソルを出す", () => {
  /*
   * 掴んでいる間はハンドルがポインタを通すので、器が代わりに出さないと
   * 下にある掴む手のカーソルへ戻ってしまう。
   */
  renderCanvas({ selection: setupSelection(["panel"]) });
  drawnAt("panel", PanelBounds);

  pressPointer(resizeHandleAt({ x: 1, y: 1 }), { x: 300, y: 150 });

  expect(canvasContent().style.cursor).toBe("nwse-resize");
});

test("ハンドルを掴み直すと、そこからまた別のまとまりとして届く", () => {
  /*
   * 掴み口は帯（`grabAt`）とハンドル（`grab`）の 2 経路あり、まとまりの始まりは
   * どちらでも戻す必要がある。帯の側は `use-node-resize.normal.test.tsx` が見ているが、
   * ハンドルを掴めるのはこちらだけ。戻し忘れると 2 回目のドラッグが 1 回目の続きとして
   * 届き、undo 1 回で 2 回分戻る。
   */
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(resizeHandleAt({ x: 1, y: 0.5 }), { x: 300, y: 100 });
  movePointer(panel, { x: 320, y: 100 });
  movePointer(panel, { x: 340, y: 100 });
  releasePointer(panel, { x: 340, y: 100 });
  pressPointer(resizeHandleAt({ x: 1, y: 0.5 }), { x: 340, y: 100 });
  movePointer(panel, { x: 360, y: 100 });

  expect(onResize.mock.calls.map(([, continuity]) => continuity)).toEqual([
    EditContinuities.Separate,
    EditContinuities.Continued,
    EditContinuities.Separate,
  ]);
});

test("左辺のハンドルを掴んで右へ運ぶと、幅と位置が同時に通知される", () => {
  /*
   * 始点側の辺から縮めるので、反対の右辺をその場に留めるために位置も動く。
   * 位置を持つ `badge` で見る（フロー配置の `panel` では掴めない）。
   */
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["badge"]), onResize });
  const badge = drawnAt("badge", PanelBounds);

  pressPointer(resizeHandleAt({ x: 0, y: 0.5 }), { x: 100, y: 100 });
  movePointer(badge, { x: 130, y: 100 });
  releasePointer(badge, { x: 130, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.placedAt([{ axis: "width", length: 170 }], { x: 55, y: 10 }),
    expect.anything(),
  );
});

test("左上の角のハンドルを掴んで運ぶと、幅・高さ・位置が同時に通知される", () => {
  // 縦横で違う動きにするのは、両軸へ同じ差分を流す実装でも通ってしまわないようにするため
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["badge"]), onResize });
  const badge = drawnAt("badge", PanelBounds);

  pressPointer(resizeHandleAt({ x: 0, y: 0 }), { x: 100, y: 50 });
  movePointer(badge, { x: 140, y: 75 });
  releasePointer(badge, { x: 140, y: 75 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.placedAt(
      [
        { axis: "width", length: 160 },
        { axis: "height", length: 75 },
      ],
      { x: 65, y: 35 },
    ),
    expect.anything(),
  );
});

test("フロー配置のノードでは左辺のハンドルが掴めない", () => {
  /*
   * 反対の辺を留める座標を持たないので掴めない。右辺のハンドルは掴めるので、
   * ハンドルを丸ごと出さない実装では「幅のハンドルを掴んで…」が落ちる。
   */
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(resizeHandleAt({ x: 0, y: 0.5 }), { x: 100, y: 100 });
  movePointer(panel, { x: 130, y: 100 });

  expect(onResize).not.toHaveBeenCalled();
});

test("座標を書いていない artboard の左辺を掴むと、自動配置の位置を起点に置き直す", () => {
  /*
   * artboard は掴んだ時点で描かれている位置が起点になる（docs/06-ui.md「キャンバス直接
   * 操作」）。以後その artboard は座標を持つので、並べ替えでは動かなくなる。
   */
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["home"]), onResize });
  const home = drawnAt("home", PanelBounds);

  pressPointer(resizeHandleAt({ x: 0, y: 0.5 }), { x: 100, y: 100 });
  movePointer(home, { x: 130, y: 100 });
  releasePointer(home, { x: 130, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith(
    ResizeEdit.placedAt([{ axis: "width", length: 330 }], { x: 30, y: 0 }),
    expect.anything(),
  );
});
