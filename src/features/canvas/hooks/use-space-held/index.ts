import { useEffect, useState } from "react";
import { KeyShortcut, KeyTriggers } from "@/hooks/use-key-shortcut";

/**
 * パンの修飾に使うキー。
 *
 * 押下の判定と「フォーカスのある要素に食われるか」を `KeyShortcut` へ委ねるために、
 * 割り当てと同じ形で持つ。物理キー（`event.code`）で見るのは、空白の `event.key` が
 * `" "` の 1 文字で他の空白文字と見分けにくいため。
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
 * `KeyShortcut.matches` を使わないのは、あちらが修飾キーの一致まで要求するため。
 * Shift を押したまま space を押しても構えは同じで、keyup の時点で修飾が外れていても
 * 解けなければならない。
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
 * `useKeyShortcut` に載せていないのは、あれが**押下 1 回に手続きを結び付ける**形で、
 * 当たった押下を `preventDefault` するため。ここが要るのは押している**間**の状態
 * （keyup まで見る）で、パンの修飾として既定動作を止める理由も無い。「文字を打ち込める
 * 場所と選択欄では素のキーを通さない」規則だけは `KeyShortcut.isConsumedBy` を共有する
 * （2 経路で同じ線引きを導かない）。
 *
 * ウィンドウのフォーカスが外れたときに構えを解くのは、そのあいだの keyup が
 * 届かないため。解かないと、戻ってきたときに押していない space で掴んだドラッグが
 * パンになる。
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
