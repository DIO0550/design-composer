import { useEffect } from "react";
import type { DomListener } from "@/libs/dom-event";

/**
 * `collect` が返すリスナーを描画のあとに張り、`collect` が変わるたび・外れるときに外す。
 * 並びではなく集める手続きを受け取るのは、張る先の要素（ref の `current`）を描画のあとに
 * 読むため。
 *
 * @param collect 張るリスナーを集める手続き。張らないなら空の並びを返す。張り直したくない
 *   なら `useCallback` で安定させる
 */
export function useDomListeners(collect: () => readonly DomListener[]): void {
  useEffect(() => {
    const listeners = collect();
    for (const listener of listeners) {
      listener.attach();
    }
    return () => {
      for (const listener of listeners) {
        listener.detach();
      }
    };
  }, [collect]);
}
