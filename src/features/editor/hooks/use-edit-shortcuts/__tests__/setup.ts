import {
  type RenderedHookInEditor,
  renderHookInEditor,
} from "@/features/editor/__tests__/hook-in-editor";
import { DocumentWithEditTargets } from "@/features/editor/__tests__/sample-document";
import { useEditShortcuts } from "../index";

/**
 * `DocumentWithEditTargets` を開いて、名前で指したものを選んだ状態でショートカットを張る。
 *
 * @param selected 最初に選んでおくノードの名前（この順で選ばれる）
 * @returns エディタを読む手続き（フック自身は何も返さない）
 */
export function setup(selected: readonly string[]): RenderedHookInEditor<void> {
  return renderHookInEditor(useEditShortcuts, {
    document: DocumentWithEditTargets,
    selected,
  });
}
