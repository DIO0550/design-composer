import { useEffect, useState } from "react";
import { ElementEx } from "@/utils/ElementEx";

/**
 * パンの修飾に使うキー。打たれた文字ではなく物理キーで見るのは、
 * 空白の `event.key` が `" "` という 1 文字で、他の空白文字と見分けにくいため
 * （`use-key-shortcut` の `PhysicalKey` と同じ理由）。
 */
const SpaceKeyCode = "Space";

/**
 * space を押している間だけ真を返す（docs/06-ui.md「キャンバス直接操作」のパン）。
 *
 * `useKeyShortcut` に載せていないのは、あれが**押下 1 回に手続きを結び付ける**形で、
 * 当たった押下を `preventDefault` するため。ここが要るのは押している**間**の状態
 * （keyup まで見る）で、パンの修飾として既定動作を止める理由も無い。
 * 「文字を打ち込める場所と選択欄では素のキーを通さない」規則だけは同じ線引きへ揃える
 * （docs/06-ui.md「編集操作の一覧」末尾）。
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
      // フォーカスのある要素が space を自分で受け取るなら、パンの構えにはしない
      const isConsumedByFocused =
        ElementEx.isTextEditable(event.target) ||
        ElementEx.isSelectControl(event.target);
      const armsPan = event.code === SpaceKeyCode && !isConsumedByFocused;
      if (armsPan) {
        setIsHeld(true);
      }
    };
    const release = (event: KeyboardEvent) => {
      if (event.code === SpaceKeyCode) {
        setIsHeld(false);
      }
    };
    const clear = () => setIsHeld(false);

    const document = globalThis.document;
    const window = globalThis.window;
    document.addEventListener("keydown", hold);
    document.addEventListener("keyup", release);
    window.addEventListener("blur", clear);
    return () => {
      document.removeEventListener("keydown", hold);
      document.removeEventListener("keyup", release);
      window.removeEventListener("blur", clear);
    };
  }, []);

  return isHeld;
}
