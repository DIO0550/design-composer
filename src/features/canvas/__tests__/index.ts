/**
 * キャンバスのテスト用の公開口。
 *
 * 外の feature（`features/editor` の `opened-document-editor`）が、キャンバスに何が
 * 描かれているか・キャンバスをどう操作するかを確かめるのに使う。出すのは外から要る
 * ものだけに絞る（`rules/architecture.md`「モジュールの公開API」）。
 *
 * Why: 本番の公開 API（`features/canvas/index.ts`）とは別の口にする。あちらへ出すと
 * `@testing-library/react` がアプリのバンドルへ入るため。`libs/<x>/fake/index.ts` が
 * 本番の入口と別に置かれているのと同じ形。
 *
 * Why not: fixture を層直下（`src/features/__tests__/`）へ移して共有する形は採らない。
 * ここの fixture はキャンバスの内部（`TokenReferrerOutline` / `CanvasOffset`）を読んで
 * おり、層直下からはその内部を引けない（feature の外から feature の中を読めるのは
 * 公開口だけ、を `lib/import-rule-violations.py` が行き先で判定して落とす）。
 */
export {
  canvasContent,
  highlightedNames,
  renderedElement,
  tokenReferrerNames,
} from "@/features/canvas/__tests__/canvas-elements";
export {
  movePointer,
  pressPointer,
  releasePointer,
} from "@/features/canvas/__tests__/canvas-gesture";
