import { useEffect, useState } from "react";
import { KeyShortcut, KeyTriggers } from "@/hooks/use-key-shortcut";

/**
 * パンの修飾に使うキー。
 *
 * 押下の判定と「フォーカスのある要素に食われるか」を `KeyShortcut` へ委ねるために、割り当
 * てと同じ形で持つ。
 */
const PanModifierKeyCodes: readonly string[] = ["Space"];

const PanModifierKey: KeyShortcut = {
  kind: KeyTriggers.PhysicalKey,
  codes: PanModifierKeyCodes,
  withCommandKey: false,
  withShiftKey: false,
};

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

/**
 * space を押している間だけ真を返す（docs/06-ui.md「キャンバス直接操作」のパン）。
 *
 * 解かないと、戻ってきたときに押していない space で掴んだドラッグがパンになる。
 *
 * @returns space を押している間だけ真
 */
export function useSpaceHeld(): boolean {
  const [isHeld, setIsHeld] = useState(false);

  useEffect(() => {
    const hold = (event: KeyboardEvent) => {
      const armsPan =
        pressesSpace(event) &&
        !KeyShortcut.isConsumedBy(PanModifierKey, event.target);
      if (armsPan) {
        setIsHeld(true);
      }
    };
    const release = (event: KeyboardEvent) => {
      if (pressesSpace(event)) {
        setIsHeld(false);
      }
    };
    const clear = () => setIsHeld(false);

    globalThis.document.addEventListener("keydown", hold);
    globalThis.document.addEventListener("keyup", release);
    globalThis.window.addEventListener("blur", clear);
    return () => {
      globalThis.document.removeEventListener("keydown", hold);
      globalThis.document.removeEventListener("keyup", release);
      globalThis.window.removeEventListener("blur", clear);
    };
  }, []);

  return isHeld;
}
