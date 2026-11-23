/**
 * DOM イベントの境界。イベントが運ぶ生の値（`PointerEvent.button` の番号・`KeyboardEvent.key`
 * の綴り・修飾キーのフラグ）にアプリで使う名前を付け、リスナーの張り方と外し方を対で持つ。
 *
 * 要素の性質を答える判定（`ElementEx`）は同じくイベントの `target` を受け取るが、ここへ
 * 入れない。値の語彙を持たない組み込み型への汎用操作なので `utils/` の `<型名>Ex` に置く。
 */
export { AltKey } from "./alt-key";
export { CommandKey } from "./command-key";
export { DomListener } from "./dom-listener";
export { KeyName, KeyNames } from "./key-name";
export { PointerButton, PointerButtons } from "./pointer-button";
