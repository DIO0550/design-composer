import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { Option } from "@/utils/Option";

/**
 * artboard・インスタンス・部品にできるノードが揃ったドキュメント。
 * `home-panel` と `home-title` はどちらも部品にできるので、選び直しの取り直しも作れる。
 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          {
            name: "home-panel",
            type: "Box",
            children: [{ name: "home-title", type: "Text" }],
          },
          { name: "home-login", ref: "primary-button" },
        ],
      },
    ],
  });
}

/**
 * 名前を選んだ状態。
 *
 * @param selectedName 選んでおく名前。不在なら何も選んでいないまま
 * @returns その選択を持つエディタの状態
 */
export function setupState(selectedName: Option<string>): EditorState {
  const state = EditorState.create(setupDocument());
  return selectedName.some
    ? EditorState.select(state, selectedName.value)
    : state;
}
