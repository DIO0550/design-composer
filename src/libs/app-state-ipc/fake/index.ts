import type { TauriIpc } from "@/libs/tauri-ipc";
import { Option } from "@/utils/Option";
import { AppStateIpc } from "../index";

/**
 * Rust 側の代役。インメモリに 1 つだけ持つ中身に対して `load_app_state` /
 * `save_app_state` を再現する。
 *
 * 差し込む先は `TauriIpc` の位置なので、`ipc` を通した呼び出しでは `AppStateIpc` 本体
 * （コマンド名・引数・エラーの解釈）がそのまま動く。
 */
export type AppStateIpcFake = Readonly<{
  /** インメモリの中身に向いた `AppStateIpc`。 */
  ipc: AppStateIpc;
  /** 今保存されている生のテキスト。まだ保存していなければ `none`。 */
  storedContent(): Option<string>;
  /** 読み込みを拒むようにする。 */
  denyLoad(): void;
  /** 書き出しを拒むようにする。 */
  denySave(): void;
}>;

/**
 * Tauri 自身が失敗したときと同じく、文字列で reject する。
 *
 * @param message 失敗として伝える文言
 * @returns 決して解決しない Promise
 * @throws 必ず。文字列で reject する
 */
function ipcFailure(message: string): Promise<never> {
  return Promise.reject(message);
}

/**
 * 本物と同じ形（文言つき）で拒否を返す。
 *
 * @param reason 拒まれた理由
 * @returns 決して解決しない Promise
 * @throws 必ず。文言を持つ失敗で reject する
 */
function denied(reason: string): Promise<never> {
  return Promise.reject({ message: `app-state.json: ${reason}` });
}

export const AppStateIpcFake = {
  /**
   * 保存済みの中身を決めて代役を作る。
   *
   * @param stored 既に保存されている生のテキスト。省略すると「まだ一度も保存していない」
   * @returns 代役の口と、保存されている中身を見る手段
   */
  create(stored?: string): AppStateIpcFake {
    let content = stored;
    let loadDenied = false;
    let saveDenied = false;

    const loadAppState = (): Promise<unknown> => {
      if (loadDenied) {
        return denied("読み込みが拒まれた");
      }
      return Promise.resolve(content ?? null);
    };

    const saveAppState = (written: unknown): Promise<unknown> => {
      if (typeof written !== "string") {
        return ipcFailure("save_app_state: content が文字列でない");
      }
      if (saveDenied) {
        return denied("書き込みが拒まれた");
      }
      content = written;
      return Promise.resolve(undefined);
    };

    const tauriIpc: TauriIpc = {
      invoke(command, args) {
        switch (command) {
          case "load_app_state":
            return loadAppState();
          case "save_app_state":
            return saveAppState(args.content);
          default:
            return ipcFailure(`Command ${command} not found`);
        }
      },

      listen(event) {
        return ipcFailure(`Event ${event} not emitted`);
      },
    };

    return {
      ipc: AppStateIpc.create(tauriIpc),

      storedContent() {
        return Option.fromNullable(content);
      },

      denyLoad() {
        loadDenied = true;
      },

      denySave() {
        saveDenied = true;
      },
    };
  },
} as const;
