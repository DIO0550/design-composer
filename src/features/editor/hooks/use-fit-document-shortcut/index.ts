import {
  type KeyShortcut,
  KeyTriggers,
  useKeyShortcut,
} from "@/hooks/use-key-shortcut";

/**
 * 文書全体を収めるズームに割り当てる組み合わせ（Shift+1）。
 *
 * 押された物理キーで待つ理由は `KeyTriggers` の doc にある。
 */
const FitDocumentShortcut: KeyShortcut = {
  waitsFor: KeyTriggers.PhysicalKey,
  codes: ["Digit1"],
  withCommandKey: false,
  withShiftKey: true,
};

/**
 * 文書全体が画面に収まる倍率と位置にする操作を、キーボードから行えるようにする
 * （docs/06-ui.md「キャンバス直接操作」のズーム / #419）。
 *
 * このフックが持つのは「全体を収めるのに割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 *
 * @param onFitDocument 組み合わせが押されたときに呼ぶ手続き
 */
export function useFitDocumentShortcut(onFitDocument: () => void): void {
  useKeyShortcut(FitDocumentShortcut, onFitDocument);
}
