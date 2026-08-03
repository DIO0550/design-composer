import { open, save } from "@tauri-apps/plugin-dialog";
import { Option } from "@/utils/Option";

/** ダイアログに出すファイルの種類（表示名と、選ばせる拡張子）。 */
export type FileFilter = Readonly<{
  name: string;
  extensions: readonly string[];
}>;

/**
 * ファイルを開く / 保存先を決めるダイアログ（docs/05-architecture.md
 * 「ファイルを開くダイアログ等は Tauri 標準プラグインを使用する」）。
 *
 * `@tauri-apps/plugin-dialog` を import するのはこのファイルだけに保つ。テストの
 * 差し替え口が 1 箇所に決まり、他の層が `@tauri-apps/*` へ直接依存する余地も無くなる
 * （`TauriIpc` と同じ理由 / #28）。
 *
 * 選ばずに閉じた場合をプラグインは `null` で返すが、境界を越えるのは `Option` にする。
 * 外部ライブラリの不在の表し方を他の層へ持ち込まないため。
 */
export type TauriDialog = Readonly<{
  /** 既存のファイルを 1 つ選ばせる。 */
  chooseOpenPath(filter: FileFilter): Promise<Option<string>>;
  /** 保存先を選ばせる。 */
  chooseSavePath(
    filter: FileFilter,
    defaultFileName: string,
  ): Promise<Option<string>>;
}>;

/** プラグインは可変の配列を要求するので、渡す直前にコピーする。 */
function toPluginFilter(filter: FileFilter): {
  name: string;
  extensions: string[];
} {
  return { name: filter.name, extensions: [...filter.extensions] };
}

export const TauriDialog = {
  create(): TauriDialog {
    return {
      async chooseOpenPath(filter) {
        const chosen = await open({
          multiple: false,
          directory: false,
          filters: [toPluginFilter(filter)],
        });
        return Option.fromNullable(chosen);
      },

      async chooseSavePath(filter, defaultFileName) {
        const chosen = await save({
          defaultPath: defaultFileName,
          filters: [toPluginFilter(filter)],
        });
        return Option.fromNullable(chosen);
      },
    };
  },
} as const;
