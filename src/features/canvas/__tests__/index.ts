/**
 * キャンバスのテスト用の公開口。外の feature（`features/editor` の
 * `opened-document-editor`）が、キャンバスに何が描かれているか・キャンバスをどう操作す
 * るかを確かめるのに使う。
 */
export {
  artboardFrameContainer,
  artboardHandle,
  canvasContent,
  canvasSurface,
  highlightedNames,
  renderedElement,
  tokenReferrerNames,
} from "@/features/canvas/__tests__/canvas-elements";
export {
  drag,
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/canvas/__tests__/canvas-gesture";
export { stubBounds } from "@/features/canvas/__tests__/canvas-measure";
