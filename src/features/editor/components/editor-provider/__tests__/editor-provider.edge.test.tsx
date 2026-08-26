import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { EditorProvider, useEditor } from "../index";

function SelectedNameView() {
  const { state } = useEditor();
  const name = EditorState.singleName(state);
  return <p>{name.some ? name.value : "未選択"}</p>;
}

test("Provider の内側ならエディタの状態を読める", () => {
  const { container } = render(
    <EditorProvider initialDocument={DesignDocument.create({ artboards: [] })}>
      <SelectedNameView />
    </EditorProvider>,
  );

  expect(container.textContent).toBe("未選択");
});

test("Provider の外でエディタの状態を読もうとするとエラーになる", () => {
  expect(() => render(<SelectedNameView />)).toThrow();
});
