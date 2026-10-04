import { renderHook } from "@testing-library/react";
import { vi } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { useTextEdit } from "../index";

/**
 * `home` に Text の `title`（文言は既定値と違う「ホーム」）と Box の `card` を並べ、
 * `title` を選んでいる対。
 */
function titleSelected(): DocumentSelection {
  const designDocument = DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "title", type: "Text", props: { content: "ホーム" } },
          { name: "card", type: "Box", children: [] },
        ],
      },
    ],
  });
  return DocumentSelection.fromNames(designDocument, ["title"]);
}

/** `title` が描かれている矩形。原点から外して、実測を使っていることが見えるようにする。 */
export const TitleBounds = { left: 120, top: 80, width: 64, height: 20 };

/**
 * `title` を選んだ状態でフックを動かす。
 *
 * @returns 今の戻り値を読む手続きと、確定した編集を受け取った `onEditProp`
 */
export function setup() {
  const onEditProp = vi.fn();
  const { result } = renderHook(() =>
    useTextEdit({ selection: titleSelected(), onEditProp }),
  );
  return { control: () => result.current, onEditProp };
}
