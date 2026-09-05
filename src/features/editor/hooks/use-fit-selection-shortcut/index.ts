import {
  type KeyShortcut,
  KeyTriggers,
  useKeyShortcut,
} from "@/hooks/use-key-shortcut";

/**
 * 選んでいるものに合わせるズームに割り当てる組み合わせ（Shift+2）。
 *
 * 押された物理キーで待つ理由は `KeyTriggers` の doc にある。
 */
const FitSelectionShortcut: KeyShortcut = {
  waitsFor: KeyTriggers.PhysicalKey,
  codes: ["Digit2"],
  withCommandKey: false,
  withShiftKey: true,
};

/**
 * 選んでいるものが画面に収まる倍率と位置にする操作を、キーボードから行えるようにする
 * （docs/06-ui.md「キャンバス直接操作」のズーム / #419）。
 *
 * このフックが持つのは「選択に合わせるのに割り当てる組み合わせはどれか」だけで、
 * ページ全体で受けることと入力中は無視することは `useKeyShortcut` に任せる。
 *
 * 何も選んでいないときに何が起きるかはここでは決めない。渡す名前を持つ側
 * （`opened-document-editor`）が空の並びを渡し、収める側が何もしない。
 *
 * @param onFitSelection 組み合わせが押されたときに呼ぶ手続き
 */
export function useFitSelectionShortcut(onFitSelection: () => void): void {
  useKeyShortcut(FitSelectionShortcut, onFitSelection);
}
