import { SingleEventIpcFake } from "@/libs/tauri-ipc/fake";
import { AppMenu, type AppMenuCommand, MenuCommandEvent } from "../index";

/**
 * OS のメニューの代役。利用者がどの項目を選んだかをテストから起こす。
 *
 * 包む相手が `AppMenu` になるだけで、口そのものは `SingleEventIpcFake` の形。
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
    const events = SingleEventIpcFake.create(MenuCommandEvent);

    return {
      menu: AppMenu.create(events.ipc),
      choose: events.deliver,
      deliverUnknown: events.deliver,
      denySubscribe: events.denySubscribe,
    };
  },
} as const;
