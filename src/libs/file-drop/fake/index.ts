import { FileDrop } from "@/libs/file-drop";
import type { TauriIpc } from "@/libs/tauri-ipc";

/**
 * ウィンドウへのドロップの代役。落とされたファイルをテストから起こす。
 *
 * 差し込む先は `TauriIpc` の位置なので、`drop` を通した呼び出しでは `FileDrop` 本体
 * （イベント名・payload の解釈）がそのまま動く。モックライブラリを使わないのは
 * テスト規約に従うため。
 */
export type FileDropFake = Readonly<{
  /** 代役のイベントに向いた `FileDrop`。 */
  drop: FileDrop;
  /** ファイルが落とされたことにする。 */
  dropFiles(paths: readonly string[]): void;
  /**
   * パスの並びを持たない通知が届いたことにする。
   * ドラッグ中の通過など、同じ購読へ来うる別の形を再現するために分けている。
   */
  deliverUnknown(payload: unknown): void;
  /** 購読そのものを張れないようにする。 */
  denySubscribe(): void;
}>;

export const FileDropFake = {
  create(): FileDropFake {
    const listeners = new Set<(payload: unknown) => void>();
    let subscribeDenied = false;

    const tauriIpc: TauriIpc = {
      invoke(command) {
        return Promise.reject(`Command ${command} not found`);
      },

      listen(event, handler) {
        if (event !== "tauri://drag-drop") {
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
      drop: FileDrop.create(tauriIpc),

      dropFiles(paths) {
        // 本物と同じ形（位置も添える）で配る。
        deliver({ paths: [...paths], position: { x: 0, y: 0 } });
      },

      deliverUnknown: deliver,

      denySubscribe() {
        subscribeDenied = true;
      },
    };
  },
} as const;
