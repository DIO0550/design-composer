import type { TauriDialog } from "@/libs/tauri-dialog";
import { Option } from "@/utils/Option";
import { DocumentDialog } from "../index";

/**
 * ダイアログを出したときに起きること。
 *
 * 「選ばれた」「選ばずに閉じた」「そもそも出せなかった」の 3 つは
 * ダイアログ 1 回の結果として排他なので直和で持つ。
 */
export type DialogChoice =
  | Readonly<{ kind: "chosen"; path: string }>
  | Readonly<{ kind: "canceled" }>
  | Readonly<{ kind: "failed"; message: string }>;

const Canceled: DialogChoice = { kind: "canceled" };

export const DialogChoice = {
  Canceled,

  chosen(path: string): DialogChoice {
    return { kind: "chosen", path };
  },

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
 * 差し込む先は `TauriDialog` の位置なので、`dialog` を通した呼び出しでは
 * `DocumentDialog` 本体（フィルタ・キャンセルと失敗の解釈）がそのまま動く。
 * モックライブラリを使わないのはテスト規約に従うため。
 */
export type DocumentDialogFake = Readonly<{ dialog: DocumentDialog }>;

/**
 * Tauri のプラグインが失敗したときと同じく、例外で失敗を伝える。
 *
 * @param choice テストが仕込んだ、ダイアログの返し方
 * @returns 選ばれたパス。閉じたなら `none`
 * @throws 失敗を仕込んだとき（本物のプラグインと同じく例外で伝える）
 */
function chosenPath(choice: DialogChoice): Promise<Option<string>> {
  switch (choice.kind) {
    case "chosen":
      return Promise.resolve(Option.some(choice.path));
    case "canceled":
      return Promise.resolve(Option.none);
    case "failed":
      return Promise.reject(new Error(choice.message));
  }
}

export const DocumentDialogFake = {
  create(choices: DialogChoices): DocumentDialogFake {
    const tauriDialog: TauriDialog = {
      chooseOpenPath() {
        return chosenPath(choices.open);
      },
      chooseSavePath() {
        return chosenPath(choices.save);
      },
    };

    return { dialog: DocumentDialog.create(tauriDialog) };
  },
} as const;
