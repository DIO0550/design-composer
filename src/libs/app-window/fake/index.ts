import type { TauriIpc } from "@/libs/tauri-ipc";
import { ipcFailure } from "@/libs/tauri-ipc/fake";
import { type AppWindow, createAppWindow } from "../index";

/**
 * Rust 側の代役。`close_current_window` を受けて、ウィンドウが閉じたかどうかだけを持つ。
 *
 * 差し込む先は `TauriIpc` の位置なので、`appWindow` を通した呼び出しでは `createAppWindow` が
 * 作る本体（コマンド名・エラーの解釈）がそのまま動く。
 */
export type AppWindowFake = Readonly<{
  /** 代役のウィンドウに向いた `AppWindow`。 */
  appWindow: AppWindow;
  /** ウィンドウが閉じたか。 */
  isWindowClosed(): boolean;
  /** ウィンドウを閉じるのを拒むようにする。 */
  denyClose(): void;
}>;

export const AppWindowFake = {
  /**
   * 開いているウィンドウ 1 つの代役を作る。
   *
   * @returns 代役の口と、ウィンドウが閉じたかを見る手段
   */
  create(): AppWindowFake {
    let closed = false;
    let closeDenied = false;

    const closeCurrentWindow = (): Promise<unknown> => {
      // 本物の `tauri::Error` も文字列で reject されるので、同じ形で拒む。
      if (closeDenied) {
        return ipcFailure("close_current_window: ウィンドウを閉じられない");
      }
      closed = true;
      return Promise.resolve(undefined);
    };

    const tauriIpc: TauriIpc = {
      invoke(command) {
        return command === "close_current_window"
          ? closeCurrentWindow()
          : ipcFailure(`Command ${command} not found`);
      },

      listen(event) {
        return ipcFailure(`Event ${event} not emitted`);
      },
    };

    return {
      appWindow: createAppWindow(tauriIpc),

      isWindowClosed() {
        return closed;
      },

      denyClose() {
        closeDenied = true;
      },
    };
  },
} as const;
