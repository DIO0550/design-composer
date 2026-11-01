import { useEffect } from "react";
import { KeyShortcut, type KeyTriggers } from "@/hooks/use-key-shortcut";

/**
 * 押している間だけ効く修飾キー（パンの space・距離の Alt / Option）。
 *
 * 押したかは `shortcut.codes` で見て、フォーカスのある要素がキーを受け取るか
 * （`KeyShortcut.isConsumedBy`）だけを割り当てに委ねる。そのために割り当てと同じ形で持つ。
 */
export type HeldModifierKey = Readonly<{
  /** 待ち受ける物理キーと、フォーカスの判定に渡す割り当て */
  shortcut: Extract<KeyShortcut, { kind: typeof KeyTriggers.PhysicalKey }>;
  /** そのキー操作（keyup）で離したことになるか */
  isReleasedBy: (event: KeyboardEvent) => boolean;
}>;

/**
 * 修飾キーを押した・離したことを伝える（docs/06-ui.md「キャンバス直接操作」のパンと、選択
 * しているだけのときの Alt / Option の距離）。
 *
 * ウィンドウを離れたら離したことにする。戻ってきたときに、離れている間に離したキーの
 * keyup は届かない。
 *
 * @param key 見る修飾キー
 * @param onChange 押した（`true`）・離した（`false`）ときに呼ぶ。押したままの間も keydown
 *   が繰り返し届くたびに `true` で呼ぶ。購読は `key` と `onChange` が変わるたびに張り直す
 */
export function useModifierKeyHold(
  key: HeldModifierKey,
  onChange: (isHeld: boolean) => void,
): void {
  useEffect(() => {
    const hold = (event: KeyboardEvent) => {
      const startsHold =
        key.shortcut.codes.includes(event.code) &&
        !KeyShortcut.isConsumedBy(key.shortcut, event.target);
      if (startsHold) {
        onChange(true);
      }
    };
    const release = (event: KeyboardEvent) => {
      if (key.isReleasedBy(event)) {
        onChange(false);
      }
    };
    const clear = () => onChange(false);

    globalThis.document.addEventListener("keydown", hold);
    globalThis.document.addEventListener("keyup", release);
    globalThis.window.addEventListener("blur", clear);
    return () => {
      globalThis.document.removeEventListener("keydown", hold);
      globalThis.document.removeEventListener("keyup", release);
      globalThis.window.removeEventListener("blur", clear);
    };
  }, [key, onChange]);
}
