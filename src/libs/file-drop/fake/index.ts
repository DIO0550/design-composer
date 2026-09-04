import { SingleEventIpcFake } from "@/libs/tauri-ipc/fake";
import { DragDropEvent, FileDrop } from "../index";

/**
 * ウィンドウへのドロップの代役。落とされたファイルをテストから起こす。
 *
 * 包む相手が `FileDrop` になるだけで、口そのものは `SingleEventIpcFake` の形。
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
    const events = SingleEventIpcFake.create(DragDropEvent);

    return {
      drop: FileDrop.create(events.ipc),

      dropFiles(paths) {
        // 本物と同じ形（位置も添える）で配る。
        events.deliver({ paths: [...paths], position: { x: 0, y: 0 } });
      },

      deliverUnknown: events.deliver,
      denySubscribe: events.denySubscribe,
    };
  },
} as const;
