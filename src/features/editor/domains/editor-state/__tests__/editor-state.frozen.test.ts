import { expect, test } from "vitest";
import { ReceivedAt } from "@/domains/__tests__/instants";
import { Artboard } from "@/domains/artboard";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { PropEdit } from "@/domains/node";
import { frozen } from "@/features/editor/__tests__/frozen-state";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/*
 * 外部編集でファイルが壊れている間、編集が起こらないこと（#155）。
 *
 * 編集が通ると `document-sync` の `useAutoSave` がその内容をファイルへ書き出し、
 * **より新しい外部の書き込みを古い内容で潰す**。凍結の見た目（#135）は `inert` で
 * 作られているが、ショートカットは `document` に張るので `inert` を素通りする。
 * 止まるのは状態の側。
 *
 * どのテストも**凍結する前に**対象（選択・履歴・クリップボード）を用意している。
 * これらのメソッドは凍結と無関係にも `none` を返す（未選択・履歴が空・未コピー）ので、
 * 用意しないとガードを丸ごと消しても通るテストになる。
 */

/** typography の `heading` を指す Text を 1 つ持つ、artboard 1 枚のドキュメント。 */
function openedState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      artboards: [
        Artboard.create({
          name: "home",
          width: 360,
          height: 240,
          children: [
            {
              name: "home-title",
              type: "Text",
              props: { content: "ホーム", typography: "heading" },
            },
          ],
        }),
      ],
    }),
  );
}

test("ファイルが不正な間は、選んでいるノードを削除できない", () => {
  const selected = EditorState.select(openedState(), "home-title");

  expect(EditorState.removeNode(frozen(selected))).toStrictEqual(Option.none);
});

test("ファイルが不正でなければ、選んでいるノードを削除できる", () => {
  const selected = EditorState.select(openedState(), "home-title");

  expect(EditorState.removeNode(selected).some).toBe(true);
});

test("ファイルが不正な間は、選んでいるノードの prop を編集できない", () => {
  const selected = EditorState.select(openedState(), "home-title");

  expect(
    EditorState.applyPropEdit(
      frozen(selected),
      PropEdit.set(["content"], "書き換え"),
    ),
  ).toStrictEqual(Option.none);
});

test("ファイルが不正な間は、選んでいる位置へノードを挿せない", () => {
  const selected = EditorState.select(openedState(), "home");

  expect(
    EditorState.insertNode(frozen(selected), {
      kind: "primitive",
      type: "Box",
    }),
  ).toStrictEqual(Option.none);
});

test("ファイルが不正な間は、積んである編集を undo できない", () => {
  const selected = EditorState.select(openedState(), "home-title");
  const edited = Option.unwrap(EditorState.removeNode(selected));

  expect(EditorState.undo(frozen(edited))).toStrictEqual(Option.none);
});

test("ファイルが不正な間は、戻した編集を redo できない", () => {
  const selected = EditorState.select(openedState(), "home-title");
  const edited = Option.unwrap(EditorState.removeNode(selected));
  const undone = Option.unwrap(EditorState.undo(edited));

  expect(EditorState.redo(frozen(undone))).toStrictEqual(Option.none);
});

test("ファイルが不正な間は、コピーしたノードを貼り付けられない", () => {
  const selected = EditorState.select(openedState(), "home-title");
  const copied = Option.unwrap(EditorState.copyNode(selected));
  const atInsertable = EditorState.select(copied, "home");

  expect(EditorState.pasteNode(frozen(atInsertable))).toStrictEqual(
    Option.none,
  );
});

test("ファイルが不正でなければ、コピーしたノードを貼り付けられる", () => {
  const selected = EditorState.select(openedState(), "home-title");
  const copied = Option.unwrap(EditorState.copyNode(selected));
  const atInsertable = EditorState.select(copied, "home");

  expect(EditorState.pasteNode(atInsertable).some).toBe(true);
});

test("ファイルが不正な間は、選んでいるトークンを削除できない", () => {
  const selected = EditorState.selectToken(openedState(), {
    kind: "typography",
    name: "heading",
  });

  expect(EditorState.removeToken(frozen(selected))).toStrictEqual(Option.none);
});

test("ファイルが不正な間でも、ノードのコピーはできる", () => {
  const selected = EditorState.select(openedState(), "home-title");

  expect(EditorState.copyNode(frozen(selected)).some).toBe(true);
});

test("ファイルが不正な間でも、選択は変えられる", () => {
  const selected = EditorState.select(frozen(openedState()), "home-title");

  expect(EditorState.singleName(selected)).toStrictEqual(
    Option.some("home-title"),
  );
});

test("ファイルが不正な間でも、外部変更の取り込みは成立する", () => {
  const reloaded = DesignDocument.create({
    artboards: [{ name: "settings", width: 360, height: 240, children: [] }],
  });

  const applied = EditorState.applyReload(
    frozen(openedState()),
    { kind: "reloaded", document: reloaded },
    ReceivedAt,
  );

  expect(EditorState.document(applied)).toStrictEqual(reloaded);
});

test("凍結中に取り込んだ後は、undo で取り込む前の表示へ戻れる", () => {
  const opened = openedState();
  const reloaded = DesignDocument.create({
    artboards: [{ name: "settings", width: 360, height: 240, children: [] }],
  });
  const applied = EditorState.applyReload(
    frozen(opened),
    { kind: "reloaded", document: reloaded },
    ReceivedAt,
  );

  const undone = Option.unwrap(EditorState.undo(applied));

  expect(EditorState.document(undone)).toStrictEqual(
    EditorState.document(opened),
  );
});

test("書き戻すと、凍結中は止まっていた編集が再びできるようになる", () => {
  const selected = EditorState.select(openedState(), "home-title");

  const reverted = EditorState.applyRevert(frozen(selected));

  expect(EditorState.removeNode(reverted).some).toBe(true);
});

test("ファイルが不正な間は、落とし先を指しても挿さらない", () => {
  const opened = openedState();

  expect(
    EditorState.insertNodeAt(
      frozen(opened),
      { kind: "primitive", type: "Box" },
      { parentName: "home", index: 0 },
    ),
  ).toStrictEqual(Option.none);
});

test("ファイルが不正でなければ、落とし先を指して挿せる", () => {
  const opened = openedState();

  expect(
    EditorState.insertNodeAt(
      opened,
      { kind: "primitive", type: "Box" },
      { parentName: "home", index: 0 },
    ).some,
  ).toBe(true);
});
