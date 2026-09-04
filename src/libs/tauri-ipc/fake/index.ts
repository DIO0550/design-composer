import type { TauriIpc } from "@/libs/tauri-ipc";

/**
 * イベントを 1 種類だけ配る `TauriIpc` の代役。
 *
 * コマンドは持たない（呼ばれたら本物と同じく「そのコマンドは無い」で reject する）。
 * 購読だけを包む境界（`AppMenu` / `FileDrop`）の代役はどれもこの形になるので、
 * イベント名と拒否の仕方をここ 1 つに集める。
 *
 * 差し込む先が `TauriIpc` の位置なので、これを渡した境界では本体の解釈
 * （イベント名の照合・payload の検証）がそのまま動く。モックライブラリを使わないのは
 * テスト規約に従うため。
 */
export type SingleEventIpcFake = Readonly<{
  /** 1 種類のイベントだけを配る `TauriIpc`。 */
  ipc: TauriIpc;
  /** そのイベントが届いたことにする。 */
  deliver(payload: unknown): void;
  /** 購読そのものを張れないようにする。 */
  denySubscribe(): void;
}>;

export const SingleEventIpcFake = {
  /**
   * 配るイベントを 1 つ決めて代役を作る。
   *
   * @param event 配るイベントの名前。これ以外の購読は本物と同じく reject する
   * @returns 代役の口と、イベントを起こす手段
   */
  create(event: string): SingleEventIpcFake {
    const listeners = new Set<(payload: unknown) => void>();
    let subscribeDenied = false;

    const ipc: TauriIpc = {
      invoke(command) {
        return Promise.reject(`Command ${command} not found`);
      },

      listen(listened, handler) {
        if (listened !== event) {
          return Promise.reject(`Event ${listened} not emitted`);
        }
        if (subscribeDenied) {
          return Promise.reject(`${listened}: 購読を開始できない`);
        }
        listeners.add(handler);
        return Promise.resolve(() => {
          listeners.delete(handler);
        });
      },
    };

    return {
      ipc,

      deliver(payload) {
        for (const listener of listeners) {
          listener(payload);
        }
      },

      denySubscribe() {
        subscribeDenied = true;
      },
    };
  },
} as const;
