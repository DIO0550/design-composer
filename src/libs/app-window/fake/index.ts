import { Result } from "@/utils/Result";
import type { AppWindow } from "../index";

/**
 * ウィンドウの代役。`AppWindow` を直接満たし、ウィンドウが閉じたかどうかだけを持つ。
 *
 * `AppWindow` 本体（コマンド名・エラーの解釈）は通らない。
 */
export type AppWindowFake = Readonly<{
  /** 代役のウィンドウに向いた `AppWindow`。 */
  appWindow: AppWindow;
  /** ウィンドウが閉じたか。 */
  isWindowClosed(): boolean;
}>;

export const AppWindowFake = {
  /**
   * 開いているウィンドウ 1 つの代役を作る。
   *
   * @returns 代役の口と、ウィンドウが閉じたかを見る手段
   */
  create(): AppWindowFake {
    let closed = false;

    return {
      appWindow: {
        close() {
          closed = true;
          return Promise.resolve(Result.ok(undefined));
        },
      },

      isWindowClosed() {
        return closed;
      },
    };
  },
} as const;
