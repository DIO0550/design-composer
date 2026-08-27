import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/** 部品化できない選択と、使えない部品名（docs/06-ui.md「部品化・解除」）。 */
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
            { name: "home-login", ref: "primary-button" },
          ],
        },
      ],
    }),
  );
}

test("何も選んでいないときは部品にできない", () => {
  expect(EditorState.createComponent(setupState(), "info-panel")).toEqual(
    Option.none,
  );
});

test("artboard を選んでいるときは部品にできない", () => {
  const selected = EditorState.select(setupState(), "home");

  expect(EditorState.createComponent(selected, "info-panel")).toEqual(
    Option.none,
  );
});

test("インスタンスを選んでいるときは部品にできない", () => {
  const selected = EditorState.select(setupState(), "home-login");

  expect(EditorState.createComponent(selected, "info-panel")).toEqual(
    Option.none,
  );
});

test("既に使われている名前では部品にできない", () => {
  const selected = EditorState.select(setupState(), "home-title");

  expect(EditorState.createComponent(selected, "primary-button")).toEqual(
    Option.none,
  );
});

test("識別子の規則を満たさない名前では部品にできない", () => {
  const selected = EditorState.select(setupState(), "home-title");

  expect(EditorState.createComponent(selected, "Info Panel")).toEqual(
    Option.none,
  );
});

/*
 * 不正なドキュメントも画面には残る（docs/03-schema.md「不正ファイル時の挙動」）ので
 * スキーマに無い `type` のノードが選ばれることがある。部品化を受理する条件
 * （`Component.fromNode`）は「参照ノードでないこと」だけなので、スキーマに知られていない
 * 型でも部品にできる。
 */
test("スキーマに無い型のノードでも部品にできる", () => {
  const state = EditorState.create(
    DesignDocument.create({
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [{ name: "home-unknown", type: "Unknown" }],
        },
      ],
    }),
  );
  const selected = EditorState.select(state, "home-unknown");

  expect(EditorState.createComponent(selected, "unknown-part").some).toBe(true);
});
