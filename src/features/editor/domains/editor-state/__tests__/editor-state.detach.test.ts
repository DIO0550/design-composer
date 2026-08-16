import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { Node } from "@/domains/node";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/**
 * インスタンスの解除（UI 案 docs/Design Composer.html の `Detach instance`）。
 *
 * 展開そのものの規則（overrides の焼き込み・内側ノードの自動改名）は
 * `services/instance-composition` のテストが持つ。ここで見るのは
 * 「選択中のものが解除され、履歴と選択がどうなるか」だけ。
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: DocumentTemplate.Default.components,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "home-title", type: "Text" },
            {
              name: "home-login",
              ref: "primary-button",
              overrides: { label: "ログイン" },
            },
            { name: "home-broken", ref: "missing" },
          ],
        },
      ],
    }),
  );
}

/**
 * 名前で引いたノード。見つからなければテストを落とす。
 *
 * @param state 引き先のエディタの状態
 * @param name 引きたいノードの名前
 * @returns そのノード
 */
function nodeNamed(state: EditorState, name: string): Node {
  return Option.unwrap(
    DesignDocument.findNode(EditorState.document(state), name),
  );
}

test("インスタンスを解除すると部品への参照が消える", () => {
  const selected = EditorState.select(setupState(), "home-login");

  const detached = Option.unwrap(EditorState.detachInstance(selected));

  expect(Node.isRef(nodeNamed(detached, "home-login"))).toBe(false);
});

test("解除したインスタンスは部品の中身を実体として持つ", () => {
  const selected = EditorState.select(setupState(), "home-login");

  const detached = Option.unwrap(EditorState.detachInstance(selected));

  expect(Node.children(nodeNamed(detached, "home-login")).length).toBe(1);
});

test("解除しても上書きしていた値は残る", () => {
  const selected = EditorState.select(setupState(), "home-login");

  const detached = Option.unwrap(EditorState.detachInstance(selected));
  const label = Node.children(nodeNamed(detached, "home-login"))[0];

  expect(
    label !== undefined && Node.isPrimitive(label)
      ? label.props?.content
      : undefined,
  ).toBe("ログイン");
});

test("解除したあとも同じものが選ばれたままになる", () => {
  const selected = EditorState.select(setupState(), "home-login");

  const detached = Option.unwrap(EditorState.detachInstance(selected));

  expect(EditorState.singleName(detached)).toEqual(Option.some("home-login"));
});

test("解除は元に戻せる", () => {
  const selected = EditorState.select(setupState(), "home-login");
  const detached = Option.unwrap(EditorState.detachInstance(selected));

  const undone = Option.unwrap(EditorState.undo(detached));

  expect(Node.isRef(nodeNamed(undone, "home-login"))).toBe(true);
});

test("解除しても他のインスタンスは参照のまま残る", () => {
  const selected = EditorState.select(setupState(), "home-login");
  const withTwo = Option.unwrap(EditorState.detachInstance(selected));

  expect(Node.isRef(nodeNamed(withTwo, "home-broken"))).toBe(true);
});

test("存在しない部品を指すインスタンスは解除できない", () => {
  const selected = EditorState.select(setupState(), "home-broken");

  expect(EditorState.detachInstance(selected)).toEqual(Option.none);
});

test("インスタンスでないノードを選んでいるときは解除できない", () => {
  const selected = EditorState.select(setupState(), "home-title");

  expect(EditorState.detachInstance(selected)).toEqual(Option.none);
});

test("何も選んでいないときは解除できない", () => {
  expect(EditorState.detachInstance(setupState())).toEqual(Option.none);
});
