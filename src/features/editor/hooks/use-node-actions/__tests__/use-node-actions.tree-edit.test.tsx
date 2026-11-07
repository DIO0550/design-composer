import { act } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { RepositionEdit } from "@/domains/dcmp/reposition-edit";
import {
  childPositionNamed,
  nodeNamed,
} from "@/features/editor/__tests__/editor-state-reads";
import { renderHookOnEditTargets } from "@/features/editor/__tests__/hook-in-editor";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { useNodeActions } from "../index";

/*
 * ツリー・キャンバス・パレットから届くツリーの編集が、それぞれの行き先へ届くことを確かめる
 * （docs/06-ui.md「編集操作の一覧」「キャンバス直接操作」）。
 */

test("reorder は、指した位置の子を同じ親の中の別の index へ移す", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, []);

  act(() => current().hook.reorder({ parentName: "home", index: 2 }, 0));

  expect(childPositionNamed(current().editor.state, "panel")).toEqual(
    Option.some({ parentName: "home", index: 0 }),
  );
});

test("move は、名前で指したノードを別の親の中の位置へ移す", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, []);

  act(() => current().hook.move("title", { parentName: "panel", index: 1 }));

  expect(childPositionNamed(current().editor.state, "title")).toEqual(
    Option.some({ parentName: "panel", index: 1 }),
  );
});

test("reposition は、絶対配置のノードを指した座標へ置き直す", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, []);

  act(() =>
    current().hook.reposition(
      "footer",
      RepositionEdit.create({
        parentName: "home",
        placement: { mode: "absolute", x: 100, y: 200 },
      }),
    ),
  );

  const footer = nodeNamed(current().editor.state, "footer");
  expect(Node.writtenPropsOf(footer)).toMatchObject({ x: 100, y: 200 });
});

test("repositionArtboard は、artboard をキャンバス上の指した位置へ置き直す", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, []);

  act(() => current().hook.repositionArtboard("home", { x: 500, y: 300 }));

  const home = Option.unwrap(
    DesignDocument.findArtboard(
      EditorState.document(current().editor.state),
      "home",
    ),
  );
  expect(home.canvasPosition).toEqual({ x: 500, y: 300 });
});

test("insert は、選んでいる Box の子の末尾へ挿す", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["panel"]);

  act(() => current().hook.insert({ kind: "primitive", type: "Ellipse" }));

  expect(childPositionNamed(current().editor.state, "ellipse")).toEqual(
    Option.some({ parentName: "panel", index: 1 }),
  );
});

test("insertAt は、選択に依らず指した位置へ挿す", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["panel"]);

  act(() =>
    current().hook.insertAt(
      { kind: "primitive", type: "Ellipse" },
      { parentName: "home", index: 0 },
    ),
  );

  expect(childPositionNamed(current().editor.state, "ellipse")).toEqual(
    Option.some({ parentName: "home", index: 0 }),
  );
});

test("子を持てる Box を選んでいれば、挿入は押せる", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["panel"]);

  expect(current().hook.isInsertEnabled).toBe(true);
});

test("子を持てない Text を選んでいれば、挿入は押せない", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["title"]);

  expect(current().hook.isInsertEnabled).toBe(false);
});

test("detachInstance は、選んでいるインスタンスを部品の参照ではなくなるよう解除する", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["home-card"]);

  act(() => current().hook.detachInstance());

  const homeCard = nodeNamed(current().editor.state, "home-card");
  expect(Node.isRef(homeCard)).toBe(false);
});

test("createComponent は、選んでいるノードを渡した名前の部品にして、元の位置をそのインスタンスにする", () => {
  const { current } = renderHookOnEditTargets(useNodeActions, ["panel"]);

  act(() => current().hook.createComponent("badge"));

  const panel = nodeNamed(current().editor.state, "panel");
  expect(panel).toMatchObject({ ref: "badge" });
});
