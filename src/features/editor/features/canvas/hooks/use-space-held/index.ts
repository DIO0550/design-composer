import { useState } from "react";
import {
  type HeldModifierKey,
  useModifierKeyHold,
} from "@/features/editor/features/canvas/hooks/use-modifier-key-hold";
import { KeyTriggers } from "@/hooks/use-key-shortcut";

const PanModifierKeyCodes: readonly string[] = ["Space"];

/**
 * その押下が space そのものか。修飾キーは見ない。
 *
 * Shift を押したまま space を押しても構えは同じで、keyup の時点で修飾が外れていても解けな
 * ければならない。
 *
 * @param event 見るキー操作
 * @returns 押されたのが space なら真
 */
function pressesSpace(event: KeyboardEvent): boolean {
  return PanModifierKeyCodes.includes(event.code);
}

/** パンの修飾に使うキー。離したかも space そのもので見る。 */
const PanModifierKey: HeldModifierKey = {
  shortcut: {
    kind: KeyTriggers.PhysicalKey,
    codes: PanModifierKeyCodes,
    withCommandKey: false,
    withShiftKey: false,
  },
  isReleasedBy: pressesSpace,
};

/**
 * space を押している間だけ真を返す（docs/06-ui.md「キャンバス直接操作」のパン）。
 *
 * ウィンドウを離れたら解く。解かないと、戻ってきたときに押していない space で掴んだドラッグ
 * がパンになる。
 *
 * @returns space を押している間だけ真
 */
export function useSpaceHeld(): boolean {
  const [isHeld, setIsHeld] = useState(false);
  useModifierKeyHold(PanModifierKey, setIsHeld);
  return isHeld;
}
