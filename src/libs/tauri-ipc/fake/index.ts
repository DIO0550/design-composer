import type { TauriIpc } from "@/libs/tauri-ipc";

/**
 * Tauri 自身が失敗したときと同じく、文字列で reject する。
 *
 * コマンドを持たない代役も、境界を包む代役も、この形で拒む必要があるのでここに置く。
 *
 * @param message 失敗として伝える文言
 * @returns 決して解決しない Promise
 * @throws 必ず。文字列で reject する
 */
export function ipcFailure(message: string): Promise<never> {
  return Promise.reject(message);
}

/**
 * イベントを 1 種類だけ配る `TauriIpc` の代役。コマンドは持たない（呼ばれたら本物と同じ
 * く「そのコマンドは無い」で reject する）。
 *
 * 購読だけを包む境界（`AppMenu` / `FileDrop`）の代役はどれもこの形になるので、イベント
 * 名と拒否の仕方をここ 1 つに集める。差し込む先が `TauriIpc` の位置なので、これを渡した
 * 境界では本体の解釈（イベント名の照合・payload の検証）がそのまま動く。
 */
export type SingleEventIpcFake = Readonly<{
  /** 1 種類のイベントだけを配る `TauriIpc`。 */
  ipc: TauriIpc;
  /**
   * そのイベントが届いたことにする。
   *
   * 配るのはその時点で張られている購読だけで、購読が張られる前に起こしたものは誰にも届かない。
   */
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
        return ipcFailure(`Command ${command} not found`);
      },

      listen(listened, handler) {
        if (listened !== event) {
          return ipcFailure(`Event ${listened} not emitted`);
        }
        if (subscribeDenied) {
          return ipcFailure(`${listened}: 購読を開始できない`);
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
