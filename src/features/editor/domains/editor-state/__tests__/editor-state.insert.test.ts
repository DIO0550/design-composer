import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Node } from "@/domains/node";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      components: { card: { type: "Box" } },
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "title", type: "Text" },
            { name: "body", type: "Box", children: [] },
          ],
        },
      ],
    }),
  );
}

function childNames(state: EditorState, parentName: string): readonly string[] {
  const artboard = DesignDocument.findArtboard(state.document, parentName);
  if (artboard.some) {
    return artboard.value.children.map((child) => child.name);
  }
  return Node.children(
    Option.unwrap(DesignDocument.findNode(state.document, parentName)),
  ).map((child) => child.name);
}

test("artboard を選んで Box を挿すと artboard の子の末尾に並ぶ", () => {
  const state = EditorState.select(setupState(), "home");

  const inserted = EditorState.insertNode(state, {
    kind: "primitive",
    type: "Box",
  });

  expect(childNames(Option.unwrap(inserted), "home")).toEqual([
    "title",
    "body",
    "box",
  ]);
});

test("子を持てるノードを選んで挿すとそのノードの子になる", () => {
  const state = EditorState.select(setupState(), "body");

  const inserted = EditorState.insertNode(state, {
    kind: "primitive",
    type: "Text",
  });

  expect(childNames(Option.unwrap(inserted), "body")).toEqual(["text"]);
});

test("部品を挿すとその部品を指す参照ノードが選択位置の子になる", () => {
  const state = EditorState.select(setupState(), "home");

  const inserted = EditorState.insertNode(state, {
    kind: "instance",
    componentName: "card",
  });

  const node = Option.unwrap(
    DesignDocument.findNode(Option.unwrap(inserted).document, "card-2"),
  );
  expect(Node.isRef(node) && node.ref).toBe("card");
});

test("続けて挿しても選択は動かないため同じ親に兄弟として並ぶ", () => {
  const state = EditorState.select(setupState(), "home");

  const once = Option.unwrap(
    EditorState.insertNode(state, { kind: "primitive", type: "Box" }),
  );
  const twice = Option.unwrap(
    EditorState.insertNode(once, { kind: "primitive", type: "Box" }),
  );

  expect(childNames(twice, "home")).toEqual(["title", "body", "box", "box-2"]);
});

test("挿しても選択は挿したノードへ移らない", () => {
  const state = EditorState.select(setupState(), "home");

  const inserted = EditorState.insertNode(state, {
    kind: "primitive",
    type: "Box",
  });

  expect(Option.unwrap(inserted).selectedName).toEqual(Option.some("home"));
});
