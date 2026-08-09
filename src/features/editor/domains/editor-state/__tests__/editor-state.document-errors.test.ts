import { expect, test } from "vitest";
import { Artboard } from "@/domains/artboard";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { DocumentError } from "@/features/editor/domains/document-error";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/** 外部エディタが不正なファイルを保存したときに届くエラー。 */
const SYNTAX_ERROR: DocumentError = {
  kind: "syntax-error",
  message: "expected ',' or '}'",
  location: { kind: "text-position", position: 42 },
};

/**
 * typography の `heading` を指す Text と `subheading` を指す Text を 1 つずつ持つ状態。
 *
 * 対照（`subheading` 側）を同じドキュメントに置くのは、`heading` を消したときの
 * 期待値を「1 件だけの並び」にするため（rules/testing.md）。
 */
function openedState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.DEFAULT.tokens,
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
            {
              name: "home-lead",
              type: "Text",
              props: { content: "ようこそ", typography: "subheading" },
            },
          ],
        }),
      ],
    }),
  );
}

/** エラーが指している場所。並びの比較に使う。 */
function locations(errors: readonly DocumentError[]): readonly string[] {
  return errors.map((error) =>
    error.location.kind === "node"
      ? `${error.location.nodeName}.${error.location.prop}`
      : error.location.kind,
  );
}

/** 選択中のトークンを消した状態。消せない指定はテストを落としたいので `unwrap` する。 */
function removeToken(state: EditorState, name: string): EditorState {
  return Option.unwrap(
    EditorState.removeToken(
      EditorState.selectToken(state, { kind: "typography", name }),
    ),
  );
}

test("使用中のトークンを削除すると、そのトークンを参照しているノードのエラーが出る", () => {
  const removed = removeToken(openedState(), "heading");

  expect(locations(EditorState.documentErrors(removed))).toStrictEqual([
    "home-title.typography",
  ]);
});

test("編集で不正が生まれていないうちはドキュメントのエラーは出ない", () => {
  expect(EditorState.documentErrors(openedState())).toStrictEqual([]);
});

test("トークンの削除を取り消すとドキュメントのエラーは消える", () => {
  const removed = removeToken(openedState(), "heading");

  const undone = Option.unwrap(EditorState.undo(removed));

  expect(EditorState.documentErrors(undone)).toStrictEqual([]);
});

test("外部変更を拒んでいても、表示中のドキュメントが正常ならドキュメントのエラーは出ない", () => {
  const rejected = EditorState.applyReload(openedState(), {
    kind: "rejected",
    errors: [SYNTAX_ERROR],
  });

  expect(EditorState.documentErrors(rejected)).toStrictEqual([]);
});

test("外部変更を拒んでいる間に編集で作った不正は、ファイルのエラーとは別に出る", () => {
  const rejected = EditorState.applyReload(openedState(), {
    kind: "rejected",
    errors: [SYNTAX_ERROR],
  });

  const removed = removeToken(rejected, "heading");

  expect(locations(EditorState.documentErrors(removed))).toStrictEqual([
    "home-title.typography",
  ]);
});

test("編集で不正を作ってもファイルのエラー一覧は変わらない", () => {
  const rejected = EditorState.applyReload(openedState(), {
    kind: "rejected",
    errors: [SYNTAX_ERROR],
  });

  const removed = removeToken(rejected, "heading");

  expect(removed.fileErrors).toStrictEqual([SYNTAX_ERROR]);
});
