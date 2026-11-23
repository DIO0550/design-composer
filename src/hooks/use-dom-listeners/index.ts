import { useCallback } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import type { DomListener } from "@/libs/dom-event";
import { Option } from "@/utils/Option";

/**
 * `collect` が返すリスナーを描画のあとに張り、`collect` が変わるたび・外れるときに外す。
 * 並びではなく集める手続きを受け取るのは、張る先の要素（ref の `current`）を描画のあとに
 * 読むため。
 *
 * @param collect 張るリスナーを集める手続き。張らないなら空の並びを返す。張り直したくない
 *   なら `useCallback` で安定させる
 */
export function useDomListeners(collect: () => readonly DomListener[]): void {
  const subscribe = useCallback(() => {
    const listeners = collect();

    const unsubscribes = listeners.map((listener) => listener());

    const unsubscribe = () => {
      for (const unsubscribeListener of unsubscribes) {
        unsubscribeListener();
      }
    };
    return Option.some(unsubscribe);
  }, [collect]);
  useSubscription(subscribe);
}
