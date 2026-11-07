import { act } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { documentWithThreeArtboards } from "@/features/editor/__tests__/artboard-fixtures";
import { renderHookInEditor } from "@/features/editor/__tests__/hook-in-editor";
import { EditorState } from "@/features/editor/domains/editor-state";
import { useArtboardActions } from "../index";

/* artboard の追加と並べ替えが、artboard の並びを変えることを確かめる（docs/06-ui.md「編集操作の一覧」）。 */

test("add は、artboard の並びの末尾に 1 枚足す", () => {
  const { current } = renderHookInEditor(useArtboardActions, {
    document: documentWithThreeArtboards(),
    selected: [],
  });

  act(() => current().hook.add());

  const names = DesignDocument.collectArtboardNames(
    EditorState.document(current().editor.state),
  );
  expect({ length: names.length, leading: names.slice(0, 3) }).toEqual({
    length: 4,
    leading: ["home", "settings", "about"],
  });
});

test("reorder は、並びの中の 1 枚を指した位置へ移す", () => {
  const { current } = renderHookInEditor(useArtboardActions, {
    document: documentWithThreeArtboards(),
    selected: [],
  });

  act(() => current().hook.reorder({ fromIndex: 0, toIndex: 2 }));

  expect(
    DesignDocument.collectArtboardNames(
      EditorState.document(current().editor.state),
    ),
  ).toEqual(["settings", "about", "home"]);
});
