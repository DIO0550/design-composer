import type { TauriIpc } from "@/libs/tauri-ipc";
import { ipcFailure } from "@/libs/tauri-ipc/fake";
import { createDocumentDialog, type DocumentDialog } from "../index";

/**
 * ダイアログを出したときに起きること。
 *
 * 「選ばれた」「選ばずに閉じた」「選ばれたものを Rust が受け付けなかった」「そもそも出せな
 * かった」の 4 つはダイアログ 1 回の結果として排他なので直和で持つ。
 */
export type DialogChoice =
  | Readonly<{ kind: "chosen"; path: string }>
  | Readonly<{ kind: "canceled" }>
  | Readonly<{ kind: "refused"; message: string }>
  | Readonly<{ kind: "failed"; message: string }>;

const Canceled: DialogChoice = { kind: "canceled" };

export const DialogChoice = {
  Canceled,

  /**
   * 利用者がパスを選んだことにする。
   *
   * @param path 選ばれたことにするパス。Rust が寄せた綴りとしてそのまま返る
   * @returns そのパスが選ばれた結果
   */
  chosen(path: string): DialogChoice {
    return { kind: "chosen", path };
  },

  /**
   * 選ばれたものを Rust が受け付けなかったことにする（`.dcmp` 以外を選んだときなど）。
   *
   * @param message 代役が Rust と同じ形（`{ kind: "invalidPath", message }`）で返す原文
   * @returns 選ばれたものを受け付けなかった結果
   */
  refused(message: string): DialogChoice {
    return { kind: "refused", message };
  },

  /**
   * ダイアログのコマンドに届かなかったことにする。
   *
   * @param message 代役が Tauri 自身の失敗と同じく文字列で reject する文言。
   *   `createDocumentDialog` が作る口を通すと、そのまま失敗の `message` に載る
   * @returns ダイアログを出せなかった結果
   */
  failed(message: string): DialogChoice {
    return { kind: "failed", message };
  },
} as const;

/** 開く / 保存それぞれのダイアログで起きること。 */
export type DialogChoices = Readonly<{
  open: DialogChoice;
  save: DialogChoice;
}>;

/**
 * ダイアログの代役。利用者の操作をテストごとに決め打ちする。
 *
 * 差し込む先は `TauriIpc` の位置なので、`dialog` を通した呼び出しでは
 * `createDocumentDialog` が作る本体（コマンド名・キャンセルと失敗の解釈）がそのまま動く。
 */
export type DocumentDialogFake = Readonly<{ dialog: DocumentDialog }>;

/**
 * 本物の Rust のコマンドと同じ形で、ダイアログの結果を返す。
 *
 * @param choice テストが仕込んだ、ダイアログの返し方
 * @returns 選ばれたパス。閉じたなら `null`
 * @throws 受け付けなかったことを仕込んだとき（Rust の `Err` の形）と、失敗を仕込んだとき
 *   （Tauri 自身の失敗と同じく文字列）
 */
function chosenPath(choice: DialogChoice): Promise<unknown> {
  switch (choice.kind) {
    case "chosen":
      return Promise.resolve(choice.path);
    case "canceled":
      return Promise.resolve(null);
    case "refused":
      return Promise.reject({ kind: "invalidPath", message: choice.message });
    case "failed":
      return ipcFailure(choice.message);
  }
}

/**
 * ダイアログの代役を作る。
 *
 * @param choices 開く / 保存それぞれのダイアログの結果。何度出しても同じ結果になる
 * @returns `choices` のとおりに答える `DocumentDialog`
 */
export function createDocumentDialogFake(
  choices: DialogChoices,
): DocumentDialogFake {
  const tauriIpc: TauriIpc = {
    invoke(command) {
      switch (command) {
        case "choose_open_document_path":
          return chosenPath(choices.open);
        case "choose_save_document_path":
          return chosenPath(choices.save);
        default:
          return ipcFailure(`Command ${command} not found`);
      }
    },

    listen(event) {
      return ipcFailure(`Event ${event} not emitted`);
    },
  };

  return { dialog: createDocumentDialog(tauriIpc) };
}
