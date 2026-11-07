import {
  type RenderedHookInEditor,
  renderHookInEditor,
} from "@/features/editor/__tests__/hook-in-editor";
import { DocumentWithEditTargets } from "@/features/editor/__tests__/sample-document";
import { type EditActions, useEditActions } from "../index";

/**
 * `DocumentWithEditTargets` を開いて、名前で指したものを選んだ状態でフックを描く。
 *
 * @param selected 最初に選んでおくノードの名前（この順で選ばれる）
 * @returns 今のフックの戻り値とエディタを読む手続き
 */
export function setup(
  selected: readonly string[],
): RenderedHookInEditor<EditActions> {
  return renderHookInEditor(useEditActions, {
    document: DocumentWithEditTargets,
    selected,
  });
}
