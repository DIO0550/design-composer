import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Instant } from "@/domains/instant";
import { SYNTAX_ERROR } from "@/features/editor/__tests__/document-errors";
import { RECEIVED_AT } from "@/features/editor/__tests__/instants";
import { FileValidity } from "@/features/editor/domains/file-validity";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/** artboard を 1 枚だけ持つドキュメントを開いた直後の状態。 */
function openedState(artboardName: string): EditorState {
  return EditorState.create(
    DesignDocument.create({
      artboards: [
        { name: artboardName, width: 375, height: 812, children: [] },
      ],
    }),
  );
}

test("取り込めた外部変更のドキュメントが表示対象になる", () => {
  const opened = EditorState.create(DesignDocument.create({ artboards: [] }));
  const reloaded = DesignDocument.create({
    artboards: [{ name: "home", width: 375, height: 812, children: [] }],
  });

  const state = EditorState.applyReload(
    opened,
    { kind: "reloaded", document: reloaded },
    RECEIVED_AT,
  );

  expect(EditorState.document(state)).toEqual(reloaded);
});

test("取り込んだドキュメントにも同じ名前があれば選択は引き継がれる", () => {
  const selected = EditorState.select(openedState("home"), "home");
  const reloaded = DesignDocument.create({
    artboards: [{ name: "home", width: 414, height: 896, children: [] }],
  });

  const state = EditorState.applyReload(
    selected,
    { kind: "reloaded", document: reloaded },
    RECEIVED_AT,
  );

  expect(EditorState.isSelected(state, "home")).toBe(true);
});

test("取り込んだドキュメントから選択中の名前が消えていると選択は外れる", () => {
  const selected = EditorState.select(openedState("home"), "home");
  const reloaded = DesignDocument.create({
    artboards: [{ name: "settings", width: 375, height: 812, children: [] }],
  });

  const state = EditorState.applyReload(
    selected,
    { kind: "reloaded", document: reloaded },
    RECEIVED_AT,
  );

  expect(state.selectedName.some).toBe(false);
});

test("外部変更を拒んだときは表示中のドキュメントがそのまま残る", () => {
  const opened = openedState("home");

  const state = EditorState.applyReload(
    opened,
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    RECEIVED_AT,
  );

  expect(EditorState.document(state)).toEqual(EditorState.document(opened));
});

test("外部変更を拒んでも選択は外れない", () => {
  const selected = EditorState.select(openedState("home"), "home");

  const state = EditorState.applyReload(
    selected,
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    RECEIVED_AT,
  );

  expect(EditorState.isSelected(state, "home")).toBe(true);
});

test("外部変更を拒むと、その理由がファイルのエラー一覧として画面に載る", () => {
  const state = EditorState.applyReload(
    openedState("home"),
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    RECEIVED_AT,
  );

  expect(state.fileValidity).toStrictEqual({
    kind: "invalid",
    errors: [SYNTAX_ERROR],
    since: RECEIVED_AT,
  });
});

test("外部変更を拒むと、受け取った時刻が食い違いの起点になる", () => {
  const receivedAt = Instant.create(1_700_000_000_000);

  const state = EditorState.applyReload(
    openedState("home"),
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    receivedAt,
  );

  expect(FileValidity.since(state.fileValidity)).toStrictEqual(
    Option.some(receivedAt),
  );
});

test("ファイルが直って取り込めるようになるとファイルのエラー一覧は消える", () => {
  const rejected = EditorState.applyReload(
    openedState("home"),
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    RECEIVED_AT,
  );
  const fixed = DesignDocument.create({
    artboards: [{ name: "home", width: 414, height: 896, children: [] }],
  });

  const state = EditorState.applyReload(
    rejected,
    { kind: "reloaded", document: fixed },
    RECEIVED_AT,
  );

  expect(state.fileValidity.kind).toBe("valid");
});

test("ファイルが直ると食い違いの起点も消える", () => {
  const rejected = EditorState.applyReload(
    openedState("home"),
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    Instant.create(1_700_000_000_000),
  );
  const fixed = DesignDocument.create({
    artboards: [{ name: "home", width: 414, height: 896, children: [] }],
  });

  const state = EditorState.applyReload(
    rejected,
    { kind: "reloaded", document: fixed },
    Instant.create(1_700_000_004_000),
  );

  expect(FileValidity.since(state.fileValidity).some).toBe(false);
});

test("外部変更を拒むと、ファイルが不正なままだと答える", () => {
  const state = EditorState.applyReload(
    openedState("home"),
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    RECEIVED_AT,
  );

  expect(EditorState.isFileInvalid(state)).toBe(true);
});

test("ファイルが直って取り込めるようになると、ファイルは不正でないと答える", () => {
  const rejected = EditorState.applyReload(
    openedState("home"),
    { kind: "rejected", errors: [SYNTAX_ERROR] },
    RECEIVED_AT,
  );
  const fixed = DesignDocument.create({
    artboards: [{ name: "home", width: 414, height: 896, children: [] }],
  });

  const state = EditorState.applyReload(
    rejected,
    { kind: "reloaded", document: fixed },
    RECEIVED_AT,
  );

  expect(EditorState.isFileInvalid(state)).toBe(false);
});
