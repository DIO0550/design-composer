import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { TokenSet } from "@/domains/token";
import { Option } from "@/utils/Option";
import { EditorState } from "../index";

/** colors と spacing にトークンを持ち、artboard が 1 つあるドキュメント。 */
function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: {
        ...TokenSet.empty(),
        colors: { primary: "#3b82f6" },
        spacing: { sm: 8 },
        shadows: { sm: { x: 0, y: 1, blur: 3, color: "#0000001a" } },
      },
      artboards: [{ name: "home", width: 375, height: 812, children: [] }],
    }),
  );
}

test("トークンを選ぶと選択中のトークンとして引ける", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "colors",
    name: "primary",
  });

  expect(EditorState.selectedToken(state)).toEqual(
    Option.some({ kind: "colors", name: "primary", value: "#3b82f6" }),
  );
});

test("ドキュメントに無いトークンは選択されない", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "colors",
    name: "unknown",
  });

  expect(EditorState.selectedToken(state)).toEqual(Option.none);
});

test("同じ名前でも種別が違えば別のトークンとして扱う", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "spacing",
    name: "sm",
  });

  /* 種別まで見ていることは中身で分かる（`shadows.sm` は値の形が違う）。 */
  expect(EditorState.selectedToken(state)).toEqual(
    Option.some({ kind: "spacing", name: "sm", value: 8 }),
  );
});

test("トークンを追加すると種別の中で衝突しない名前が付く", () => {
  const added = Option.unwrap(
    EditorState.addToken(setupState(), { kind: "colors" }),
  );

  expect(TokenSet.names(EditorState.document(added).tokens, "colors")).toEqual([
    "primary",
    "color",
  ]);
});

test("トークンを追加するとそのトークンが選択される", () => {
  const added = Option.unwrap(
    EditorState.addToken(setupState(), { kind: "spacing" }),
  );

  expect(EditorState.selectedToken(added)).toEqual(
    Option.some({ kind: "spacing", name: "spacing", value: 0 }),
  );
});

test("同じ種別に続けて追加すると連番が付く", () => {
  const once = Option.unwrap(
    EditorState.addToken(setupState(), { kind: "radius" }),
  );

  const twice = Option.unwrap(EditorState.addToken(once, { kind: "radius" }));

  expect(TokenSet.names(EditorState.document(twice).tokens, "radius")).toEqual([
    "radius",
    "radius-2",
  ]);
});

test("選択中のトークンの値を変えると新しい値が引ける", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "spacing",
    name: "sm",
  });

  const edited = Option.unwrap(
    EditorState.setTokenValue(state, { kind: "spacing", value: 12 }),
  );

  expect(EditorState.selectedToken(edited)).toEqual(
    Option.some({ kind: "spacing", name: "sm", value: 12 }),
  );
});

test("トークンが選択されていなければ値の編集は存在しない", () => {
  const edited = EditorState.setTokenValue(setupState(), {
    kind: "spacing",
    value: 12,
  });

  expect(edited).toEqual(Option.none);
});

test("トークンを改名すると選択は新しい名前へ移る", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "colors",
    name: "primary",
  });

  const renamed = Option.unwrap(EditorState.renameToken(state, "brand"));

  expect(EditorState.selectedToken(renamed)).toEqual(
    Option.some({ kind: "colors", name: "brand", value: "#3b82f6" }),
  );
});

test("規則を満たさない名前への改名は存在しない", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "colors",
    name: "primary",
  });

  expect(EditorState.renameToken(state, "Brand Color")).toEqual(Option.none);
});

test("選択中のトークンを削除すると一覧から消えて選択も外れる", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "colors",
    name: "primary",
  });

  const removed = Option.unwrap(EditorState.removeToken(state));

  expect(
    TokenSet.names(EditorState.document(removed).tokens, "colors"),
  ).toEqual([]);
  expect(removed.selectedToken).toEqual(Option.none);
});

test("トークンの編集は undo で元に戻せる", () => {
  const state = EditorState.selectToken(setupState(), {
    kind: "spacing",
    name: "sm",
  });
  const edited = Option.unwrap(
    EditorState.setTokenValue(state, { kind: "spacing", value: 12 }),
  );

  const undone = Option.unwrap(EditorState.undo(edited));

  expect(EditorState.selectedToken(undone)).toEqual(
    Option.some({ kind: "spacing", name: "sm", value: 8 }),
  );
});

test("ノードの選択とトークンの選択は同時に持てる", () => {
  const state = EditorState.selectToken(
    EditorState.select(setupState(), "home"),
    { kind: "colors", name: "primary" },
  );

  expect(EditorState.singleName(state)).toEqual(Option.some("home"));
  expect(EditorState.selectedToken(state)).toEqual(
    Option.some({ kind: "colors", name: "primary", value: "#3b82f6" }),
  );
});
