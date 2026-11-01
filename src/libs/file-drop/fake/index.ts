import { createSingleEventIpcFake } from "@/libs/tauri-ipc/fake";
import { createFileDrop, DocumentDroppedEvent, type FileDrop } from "../index";

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
   * 形の合わない値を受けたときの振る舞いを再現するために分けている。
   */
  deliverUnknown(payload: unknown): void;
  /** 購読そのものを張れないようにする。 */
  denySubscribe(): void;
}>;

/**
 * ドロップの代役を作る。
 *
 * @returns 代役の口と、ドロップを起こす手段
 */
export function createFileDropFake(): FileDropFake {
  const events = createSingleEventIpcFake(DocumentDroppedEvent);

  return {
    drop: createFileDrop(events.ipc),

    dropFiles(paths) {
      // 本物（Rust の `DocumentDropped`）と同じ形で配る。
      events.deliver({ paths: [...paths] });
    },

    deliverUnknown: events.deliver,
    denySubscribe: events.denySubscribe,
  };
}
