import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

/** 購読を解除する。 */
export type Unsubscribe = () => void;

/**
 * Tauri のコマンド呼び出しとイベント購読。
 *
 * `@tauri-apps/api` を import するのはこのファイルだけに保つ。Tauri ランタイムの
 * 有無で振る舞いが変わる箇所をここ1つに集めることで、テストの差し替え口が
 * 1箇所に決まり、他の層が `@tauri-apps/*` へ直接依存する余地も無くなる（#28）。
 */
export type TauriIpc = Readonly<{
  /** コマンドを呼ぶ。Rust 側が `Err` を返した場合はその値で reject される。 */
  invoke(
    command: string,
    args: Readonly<Record<string, unknown>>,
  ): Promise<unknown>;
  /** イベントを購読し、解除関数を返す。 */
  listen(
    event: string,
    handler: (payload: unknown) => void,
  ): Promise<Unsubscribe>;
}>;

export const TauriIpc = {
  create(): TauriIpc {
    return {
      invoke(command, args) {
        return invoke(command, { ...args });
      },
      listen(event, handler) {
        return listen(event, (received) => handler(received.payload));
      },
    };
  },
} as const;
