/**
 * キャンバスのテスト用の公開口。外の feature（`features/editor` の `opened-document-editor`）が、キャンバスに何が描かれているか・キャンバスを
 * どう操作するかを確かめるのに使う。
 *
 * 本番の公開 API（`features/canvas/index.ts`）とは別の口にするのは、あちらへ出すと `@testing-library/react` がアプリのバンドルへ入るため
 * （`libs/<x>/fake/index.ts` が本番の入口と別に置かれているのと同じ形）。
 *
 * fixture を層直下（`src/features/__tests__/`）へ移して共有しないのは、ここの fixture がキャンバスの内部（`TokenReferrerOutline`）を読んでおり、
 * 層直下からはその内部を引けないため。
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
