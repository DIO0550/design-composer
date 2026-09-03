import { AppMenu, type AppMenuCommand } from "@/libs/app-menu";
import type { TauriIpc } from "@/libs/tauri-ipc";

/**
 * OS のメニューの代役。利用者がどの項目を選んだかをテストから起こす。
 *
 * 差し込む先は `TauriIpc` の位置なので、`menu` を通した呼び出しでは `AppMenu` 本体
 * （イベント名・語彙の照合）がそのまま動く。モックライブラリを使わないのは
 * テスト規約に従うため。
 */
export type AppMenuFake = Readonly<{
  /** 代役のイベントに向いた `AppMenu`。 */
  menu: AppMenu;
  /** 利用者がメニューの項目を選んだことにする。 */
  choose(command: AppMenuCommand): void;
  /**
   * 語彙に無い値が届いたことにする。
   * Rust 側と TS 側の版がずれた場合の届き方を再現するために分けている。
   */
  deliverUnknown(payload: unknown): void;
  /** 購読そのものを張れないようにする。 */
  denySubscribe(): void;
}>;

export const AppMenuFake = {
  create(): AppMenuFake {
    const listeners = new Set<(payload: unknown) => void>();
    let subscribeDenied = false;

    const tauriIpc: TauriIpc = {
      invoke(command) {
        return Promise.reject(`Command ${command} not found`);
      },

      listen(event, handler) {
        if (event !== "document-menu") {
          return Promise.reject(`Event ${event} not emitted`);
        }
        if (subscribeDenied) {
          return Promise.reject(`${event}: 購読を開始できない`);
        }
        listeners.add(handler);
        return Promise.resolve(() => {
          listeners.delete(handler);
        });
      },
    };

    const deliver = (payload: unknown): void => {
      for (const listener of listeners) {
        listener(payload);
      }
    };

    return {
      menu: AppMenu.create(tauriIpc),

      choose: deliver,

      deliverUnknown: deliver,

      denySubscribe() {
        subscribeDenied = true;
      },
    };
  },
} as const;
