import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Result } from "@/utils/Result";

/** 購読を解除する。 */
export type Unsubscribe = () => void;

/**
 * Tauri のコマンド呼び出しとイベント購読。
 *
 * `@tauri-apps/api` を import するのはこのファイルだけに保つ。Tauri ランタイムの有無で振る
 * 舞いが変わる箇所をここ1つに集めることで、テストの差し替え口が 1箇所に決まり、他の層が
 * `@tauri-apps/*` へ直接依存する余地も無くなる。
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

/**
 * 失敗を値として返すコマンドの呼び出し口。
 *
 * Rust 側の関数名がそのままコマンド名になるので、`C` に置く語彙は
 * `src-tauri/src/lib.rs` の `generate_handler!` と対で保つ。
 */
export type IpcCaller<C extends string, E> = (
  command: C,
  args: Readonly<Record<string, unknown>>,
) => Promise<Result<unknown, E>>;

export const TauriIpc = {
  /**
   * 例外で返ってくる失敗を、詰め替え関数を通して値にする呼び出し口を作る。
   *
   * ここが例外と `Result` の境界。`libs/` の外へ例外を出さないため、コマンドを呼ぶ
   * モジュールはこの口を通す。
   *
   * @param tauriIpc 呼び出しに使う IPC
   * @param toError reject された値を、そのモジュールの失敗へ詰め替える手続き
   * @returns コマンド名と引数を受け取り、戻り値か失敗を返す呼び出し口
   */
  caller<C extends string, E>(
    tauriIpc: TauriIpc,
    toError: (reason: unknown) => E,
  ): IpcCaller<C, E> {
    return async (command, args) => {
      try {
        return Result.ok(await tauriIpc.invoke(command, args));
      } catch (reason) {
        return Result.err(toError(reason));
      }
    };
  },

  /**
   * 本物の Tauri のコマンドとイベントに向いた口を作る。
   *
   * @returns `@tauri-apps/api` を呼ぶ口。イベントの購読者には payload だけを渡す
   */
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
