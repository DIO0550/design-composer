import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { EditorState } from "../index";

test("読み直したドキュメントを表示対象にする", () => {
  const opened = EditorState.create(DesignDocument.create({ artboards: [] }));
  const reloaded = DesignDocument.create({
    artboards: [{ name: "home", width: 375, height: 812, children: [] }],
  });

  const state = EditorState.loadDocument(opened, reloaded);

  expect(state.document).toEqual(reloaded);
});

test("読み直したドキュメントにも同じ名前があれば選択は引き継がれる", () => {
  const selected = EditorState.select(
    EditorState.create(
      DesignDocument.create({
        artboards: [{ name: "home", width: 375, height: 812, children: [] }],
      }),
    ),
    "home",
  );
  const reloaded = DesignDocument.create({
    artboards: [{ name: "home", width: 414, height: 896, children: [] }],
  });

  const state = EditorState.loadDocument(selected, reloaded);

  expect(EditorState.isSelected(state, "home")).toBe(true);
});

test("読み直したドキュメントから選択中の名前が消えていると選択は外れる", () => {
  const selected = EditorState.select(
    EditorState.create(
      DesignDocument.create({
        artboards: [{ name: "home", width: 375, height: 812, children: [] }],
      }),
    ),
    "home",
  );
  const reloaded = DesignDocument.create({
    artboards: [{ name: "settings", width: 375, height: 812, children: [] }],
  });

  const state = EditorState.loadDocument(selected, reloaded);

  expect(state.selectedName.some).toBe(false);
});
