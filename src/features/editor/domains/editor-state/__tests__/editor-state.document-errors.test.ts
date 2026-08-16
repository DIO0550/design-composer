import { expect, test } from "vitest";
import { Artboard } from "@/domains/artboard";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { Instant } from "@/domains/instant";
import { SampleSyntaxError } from "@/features/editor/__tests__/document-errors";
import { ReceivedAt } from "@/features/editor/__tests__/instants";
import type { DocumentErrorLocation } from "@/features/editor/domains/document-error";
import { FileValidity } from "@/features/editor/domains/file-validity";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/**
 * typography の `heading` を指す Text と `subheading` を指す Text を 1 つずつ持つ状態。
 *
 * 対照（`subheading` 側）を同じドキュメントに置くのは、`heading` を消したときの
 * 期待値を「1 件だけの並び」にするため（rules/testing.md）。
 */
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

/** dangling 参照が出る位置。表示の綴りは UI の担当なので、構造のまま比べる。 */
const HomeTitleTypography: DocumentErrorLocation = {
  kind: "node",
  nodeName: "home-title",
  prop: "typography",
};

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

  expect(
    EditorState.documentErrors(removed).map((error) => error.location),
  ).toStrictEqual([HomeTitleTypography]);
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
  const rejected = EditorState.applyReload(
    openedState(),
    {
      kind: "rejected",
      errors: [SampleSyntaxError],
    },
    ReceivedAt,
  );

  expect(EditorState.documentErrors(rejected)).toStrictEqual([]);
});

test("外部変更を拒んでいる間に編集で作った不正は、ファイルのエラーとは別に出る", () => {
  const rejected = EditorState.applyReload(
    openedState(),
    {
      kind: "rejected",
      errors: [SampleSyntaxError],
    },
    ReceivedAt,
  );

  const removed = removeToken(rejected, "heading");

  expect(
    EditorState.documentErrors(removed).map((error) => error.location),
  ).toStrictEqual([HomeTitleTypography]);
});

test("編集で不正を作ってもファイルのエラー一覧は変わらない", () => {
  const rejected = EditorState.applyReload(
    openedState(),
    {
      kind: "rejected",
      errors: [SampleSyntaxError],
    },
    ReceivedAt,
  );

  const removed = removeToken(rejected, "heading");

  expect(removed.fileValidity).toStrictEqual({
    kind: "invalid",
    errors: [SampleSyntaxError],
    since: ReceivedAt,
  });
});

test("編集で不正を作っても食い違いの起点は変わらない", () => {
  const receivedAt = Instant.create(1_700_000_000_000);
  const rejected = EditorState.applyReload(
    openedState(),
    {
      kind: "rejected",
      errors: [SampleSyntaxError],
    },
    receivedAt,
  );

  const removed = removeToken(rejected, "heading");

  expect(FileValidity.since(removed.fileValidity)).toStrictEqual(
    Option.some(receivedAt),
  );
});
