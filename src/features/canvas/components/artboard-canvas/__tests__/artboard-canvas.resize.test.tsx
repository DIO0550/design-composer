import { fireEvent } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/canvas/__tests__/canvas-gesture";
import type { CanvasBounds } from "@/features/canvas/domains/node-drop";
import {
  drawn,
  drawnAt,
  renderCanvas,
  resizeHandleFor,
  resizeHandles,
} from "./setup";

/**
 * `home` に、2 軸とも固定の `panel`、幅だけ固定の `banner`、
 * モードを指定していない `title`、部品インスタンスの `action` が並ぶ状態。
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

  expect(onResize).toHaveBeenLastCalledWith({ axis: "width", length: 240 });
});

test("下辺を掴んで下へ運ぶと、動かした分だけ高さが伸びた大きさが通知される", () => {
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(panel, { x: 200, y: 148 });
  movePointer(panel, { x: 200, y: 178 });
  releasePointer(panel, { x: 200, y: 178 });

  expect(onResize).toHaveBeenLastCalledWith({ axis: "height", length: 130 });
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
   * （`NodeResize.handleAt`）では掴めない。掴んだあとの移動と解放を受けるのは
   * キャンバスの器なので、運ぶ側はノードへ dispatch する（そこから器へ泡立つ）。
   */
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(resizeHandleFor("width"), { x: 300, y: 100 });
  movePointer(panel, { x: 340, y: 100 });
  releasePointer(panel, { x: 340, y: 100 });

  expect(onResize).toHaveBeenLastCalledWith({ axis: "width", length: 240 });
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

  expect(resizeHandleFor("width").style.left).toBe("295px");
});

test("高さのハンドルを掴んで下へ運ぶと、動かした分だけ高さが伸びた大きさが通知される", () => {
  // 幅の 1 件だけだと、押されたハンドルに関わらず先頭の軸を掴む実装でも通ってしまう
  const onResize = vi.fn();
  renderCanvas({ selection: setupSelection(["panel"]), onResize });
  const panel = drawnAt("panel", PanelBounds);

  pressPointer(resizeHandleFor("height"), { x: 200, y: 150 });
  movePointer(panel, { x: 200, y: 180 });
  releasePointer(panel, { x: 200, y: 180 });

  expect(onResize).toHaveBeenLastCalledWith({ axis: "height", length: 130 });
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

  pressPointer(resizeHandleFor("width"), { x: 300, y: 100 });

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

  const overlay = resizeHandleFor("width").parentElement;
  expect([
    overlay?.classList.contains("pointer-events-none"),
    overlay?.getAttribute("aria-hidden"),
  ]).toEqual([true, "true"]);
});
