import { expect, test } from "vitest";
import { ComponentSet } from "@/domains/component";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { Node } from "@/domains/node";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/**
 * 選択したサブツリーの部品化（UI 案 docs/Design Composer.html の `Create component` /
 * docs/06-ui.md「部品化・解除」）。
 *
 * 切り出しそのものの規則（元の位置を参照ノードに置き換える・名前の衝突）は
 * `domains/design-document` のテストが持つ。ここで見るのは
 * 「選択中のものが部品になり、履歴と選択がどうなるか」だけ。
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
            {
              name: "home-panel",
              type: "Box",
              children: [{ name: "home-title", type: "Text" }],
            },
            { name: "home-login", ref: "primary-button" },
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

test("選択中のノードを部品にするとその名前の部品が増える", () => {
  const selected = EditorState.select(setupState(), "home-panel");

  const created = Option.unwrap(
    EditorState.createComponent(selected, "info-panel"),
  );

  expect(
    ComponentSet.has(EditorState.document(created).components, "info-panel"),
  ).toBe(true);
});

test("部品にするとその中身は元のサブツリーになる", () => {
  const selected = EditorState.select(setupState(), "home-panel");

  const created = Option.unwrap(
    EditorState.createComponent(selected, "info-panel"),
  );
  const component = ComponentSet.get(
    EditorState.document(created).components,
    "info-panel",
  );

  expect(component?.children?.map((child) => child.name)).toEqual([
    "home-title",
  ]);
});

test("部品にすると元の位置がインスタンスに変わる", () => {
  const selected = EditorState.select(setupState(), "home-panel");

  const created = Option.unwrap(
    EditorState.createComponent(selected, "info-panel"),
  );

  expect(Node.isRef(nodeNamed(created, "home-panel"))).toBe(true);
});

test("部品にしたあとも同じ名前が選ばれたままになる", () => {
  const selected = EditorState.select(setupState(), "home-panel");

  const created = Option.unwrap(
    EditorState.createComponent(selected, "info-panel"),
  );

  expect(EditorState.singleName(created)).toEqual(Option.some("home-panel"));
});

test("部品化は元に戻せる", () => {
  const selected = EditorState.select(setupState(), "home-panel");
  const created = Option.unwrap(
    EditorState.createComponent(selected, "info-panel"),
  );

  const undone = Option.unwrap(EditorState.undo(created));

  expect(Node.isRef(nodeNamed(undone, "home-panel"))).toBe(false);
});
