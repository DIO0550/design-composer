import { TauriIpc } from "@/libs/tauri-ipc";
import { Result } from "@/utils/Result";

/** ウィンドウを操作できなかったことと、診断用の原文。 */
export type AppWindowError = Readonly<{ message: string }>;

/** `docs/05-architecture.md`「Tauri IPC」が挙げているウィンドウのコマンド名。 */
export type AppWindowCommand = "close_current_window";

/** この画面を載せているウィンドウそのものへの操作。 */
export type AppWindow = Readonly<{
  /** この画面を載せているウィンドウを閉じる。 */
  close(): Promise<Result<void, AppWindowError>>;
}>;

export const AppWindow = {
  /**
   * この画面を載せているウィンドウを操作する口を作る。
   *
   * 失敗は Rust の `tauri::Error` もコマンドに届く前の Tauri 自身の失敗も文字列で reject
   * されるので、形で見分けずに原文へ詰め替える。
   *
   * @param tauriIpc コマンドを呼ぶ IPC
   * @returns `tauriIpc` を通してウィンドウを操作する口
   */
  create(tauriIpc: TauriIpc): AppWindow {
    const call = TauriIpc.caller<AppWindowCommand, AppWindowError>(
      tauriIpc,
      (reason) => ({ message: String(reason) }),
    );

    return {
      async close() {
        return Result.map(
          await call("close_current_window", {}),
          () => undefined,
        );
      },
    };
  },
} as const;
