import { Result } from "../../src/utils/Result.ts";

/**
 * Storybook の index から、完全一致する story を探す。
 *
 * @param _index Storybook が返した index
 * @param _selector `{ id }` または `{ title, name }`
 * @returns 選択した story、または不在・曖昧さを表す失敗
 */
export function resolveStory(_index, _selector) {
  return Result.err({ kind: "not-run" });
}

/**
 * 手順を順に実行し、期待の観測と途中の撮影を記録する。
 *
 * @param _steps 実行する手順
 * @param _driver `perform(step)`・`observe(step)`・`capture(name)` を持つ操作先
 * @returns 確認の記録、または失敗した手順と直前までの記録
 */
export async function runSteps(_steps, _driver) {
  return Result.err({ kind: "not-run" });
}
