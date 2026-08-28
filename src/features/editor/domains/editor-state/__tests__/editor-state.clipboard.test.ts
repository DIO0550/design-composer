import { expect, test } from "vitest";
import { ReceivedAt } from "@/domains/__tests__/instants";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/**
 * artboard の下に Text 1 つと、その下に Text を持つ Box が並ぶドキュメント。
 * コピー元が木に残ったままペーストする、という基本の並びを作る。
 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: { card: { type: "Box" } },
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "title", type: "Text" },
            {
              name: "body",
              type: "Box",
              children: [{ name: "caption", type: "Text" }],
            },
          ],
        },
      ],
    }),
  );
}

/** 選択中のノードをコピーし、続けて `pasteTarget` を選んで貼った状態。 */
function copyThenPaste(
  state: EditorState,
  pasteTarget: string,
): Option<EditorState> {
  return Option.flatMap(EditorState.copyNode(state), (copied) =>
    EditorState.pasteNode(EditorState.select(copied, pasteTarget)),
  );
}

test("ノードを選んでコピーするとクリップボードにそのノードが入る", () => {
  const state = EditorState.select(setupState(), "title");

  const copied = Option.unwrap(EditorState.copyNode(state));

  expect(copied.copiedNode).toEqual(
    Option.some({ name: "title", type: "Text" }),
  );
});

test("コピーしてもドキュメントは変わらない", () => {
  const state = EditorState.select(setupState(), "title");

  const copied = Option.unwrap(EditorState.copyNode(state));

  expect(EditorState.document(copied)).toEqual(EditorState.document(state));
});

test("artboard を選んでいるときはコピーできない", () => {
  const state = EditorState.select(setupState(), "home");

  expect(EditorState.copyNode(state)).toEqual(Option.none);
});

test("何も選んでいないときはコピーできない", () => {
  expect(EditorState.copyNode(setupState())).toEqual(Option.none);
});

test("コピーしたノードを artboard へ貼ると子の末尾に連番の名前で並ぶ", () => {
  const state = EditorState.select(setupState(), "title");

  const pasted = Option.unwrap(copyThenPaste(state, "home"));

  expect(
    Option.unwrap(
      DesignDocument.findArtboard(EditorState.document(pasted), "home"),
    ).children.map((child) => child.name),
  ).toEqual(["title", "body", "title-2"]);
});

test("子孫を持つノードを貼ると子孫の名前も付け替わる", () => {
  const state = EditorState.select(setupState(), "body");

  const pasted = Option.unwrap(copyThenPaste(state, "home"));

  expect(
    Option.unwrap(
      DesignDocument.findArtboard(EditorState.document(pasted), "home"),
    ).children[2],
  ).toEqual({
    name: "body-2",
    type: "Box",
    children: [{ name: "caption-2", type: "Text" }],
  });
});

test("貼った後もドキュメントは名前の一意性を満たす", () => {
  const state = EditorState.select(setupState(), "body");

  const pasted = Option.unwrap(copyThenPaste(state, "home"));

  expect(DesignDocument.collectErrors(EditorState.document(pasted))).toEqual(
    [],
  );
});

test("同じものを続けて貼ると別々の名前で並ぶ", () => {
  const state = EditorState.select(setupState(), "title");
  const once = Option.unwrap(copyThenPaste(state, "home"));

  const twice = Option.unwrap(EditorState.pasteNode(once));

  expect(
    Option.unwrap(
      DesignDocument.findArtboard(EditorState.document(twice), "home"),
    ).children.map((child) => child.name),
  ).toEqual(["title", "body", "title-2", "title-3"]);
});

test("コピー元を消してから貼ると元の名前のまま入る", () => {
  const state = EditorState.select(setupState(), "title");
  const copied = Option.unwrap(EditorState.copyNode(state));
  const removed = Option.unwrap(EditorState.removeSelected(copied));

  const pasted = Option.unwrap(
    EditorState.pasteNode(EditorState.select(removed, "home")),
  );

  expect(
    Option.unwrap(
      DesignDocument.findArtboard(EditorState.document(pasted), "home"),
    ).children.map((child) => child.name),
  ).toEqual(["body", "title"]);
});

test("子を持てないノードを選んでいるときは貼れない", () => {
  const state = EditorState.select(setupState(), "body");

  expect(copyThenPaste(state, "caption")).toEqual(Option.none);
});

test("何もコピーしていないときは貼れない", () => {
  const state = EditorState.select(setupState(), "home");

  expect(EditorState.pasteNode(state)).toEqual(Option.none);
});

test("貼っても選択は動かない", () => {
  const state = EditorState.select(setupState(), "title");

  const pasted = Option.unwrap(copyThenPaste(state, "home"));

  expect(EditorState.singleName(pasted)).toEqual(Option.some("home"));
});

test("外部変更を取り込んでもクリップボードの中身は残る", () => {
  const state = EditorState.select(setupState(), "title");
  const copied = Option.unwrap(EditorState.copyNode(state));

  const reloaded = EditorState.applyReload(
    copied,
    {
      kind: "reloaded",
      document: DesignDocument.create({
        artboards: [{ name: "home", width: 375, height: 812, children: [] }],
      }),
    },
    ReceivedAt,
  );

  expect(reloaded.copiedNode).toEqual(
    Option.some({ name: "title", type: "Text" }),
  );
});
