/**
 * DOM イベントが運ぶ生の値（`PointerEvent.button` の番号・`KeyboardEvent.key` の綴り・
 * 修飾キーのフラグ）に、アプリで使う名前を付ける境界。
 *
 * 要素の性質を答える判定（`ElementEx`）は同じくイベントの `target` を受け取るが、ここへ
 * 入れない。値の語彙を持たない組み込み型への汎用操作なので `utils/` の `<型名>Ex` に置く。
 */
export { ClientPoint } from "./client-point";
export { CommandKey } from "./command-key";
export { KeyName, KeyNames } from "./key-name";
export { PointerButton, PointerButtons } from "./pointer-button";
