import { useEffect } from "react";
import { Option } from "@/utils/Option";

/**
 * 購読を始める手続き。始めたら止め方を、始めなかったら `none` を返す。止め方は
 * `libs/tauri-ipc` の `Unsubscribe` と同じ形で、Tauri 以外の相手も返すため素の関数で受ける。
 */
export type Subscribe = () => Option<() => void>;

/**
 * 描画のあとに購読を始め、`subscribe` が変わるたび・外れるときに止める。購読の相手は
 * `libs/` が渡す時計・タイマー・Tauri の通知・非同期の結果で、どれも「始めたら止め方を返す
 * 手続き」に揃えて渡す。DOM のイベントは `useDomListeners` で張る。
 *
 * @param subscribe 始める手続き。張り直したくないなら `useCallback` で安定させる
 */
export function useSubscription(subscribe: Subscribe): void {
  useEffect(() => {
    const unsubscribe = subscribe();
    return Option.isSome(unsubscribe) ? unsubscribe.value : undefined;
  }, [subscribe]);
}
