import type { TauriIpc, Unsubscribe } from "@/libs/tauri-ipc";
import type { ValueOf } from "@/types/ValueOf";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * OS のメニューから届く指示。
 *
 * 名前で指せるようにするのは、消費側が `"open"` を綴り直さずに済ませるため
 * （rules/coding.md「値の集合から union を導出する」）。Rust 側のメニュー項目の id
 * （`src-tauri/src/menu.rs`）と対で保つ。
 */
export const AppMenuCommands = {
  Open: "open",
  Create: "create",
} as const;

/** メニューから届く指示。 */
export type AppMenuCommand = ValueOf<typeof AppMenuCommands>;

/** メニューの選択を知らせるイベント名（Rust 側の `MENU_COMMAND_EVENT` と対）。 */
const MenuCommandEvent = "document-menu";

/** 購読を張れなかった失敗と、診断用の原文。 */
export type AppMenuError = Readonly<{ message: string }>;

/**
 * 届いた値が、こちらが知っている指示として読めるか。
 *
 * IPC を渡ってくる値に型は無いので、`as` で通さず語彙に照らして確かめる。
 * 語彙に無い指示が来るのは Rust 側と TS 側の版がずれたときで、指示としては扱えない。
 *
 * @param payload メニューのイベントで届いた値
 * @returns 語彙にある指示。無ければ `none`
 */
function toAppMenuCommand(payload: unknown): Option<AppMenuCommand> {
  const known = Object.values(AppMenuCommands).find(
    (command) => command === payload,
  );
  return Option.fromNullable(known);
}

/**
 * OS のメニュー（docs/05-architecture.md「Tauri IPC」）。
 *
 * ドキュメントを開く / 作る指示は、開いている間はメニューからしか来ない
 * （画面の帯には置かない / #374）。ここが知っているのは指示の語彙までで、
 * それを受けて何をするかは呼び出し側が決める。
 */
export type AppMenu = Readonly<{
  /**
   * メニューの選択の購読を始め、解除関数を返す。
   *
   * 解除関数を `Promise` 越しに返すのは、`listen` の完了を待たないと購読が成立せず、
   * 同期の解除関数を返す形にすると `listen` 自体の失敗を握りつぶすことになるため
   * （`DocumentIpc.subscribeChanged` と同じ）。
   */
  subscribeCommand(
    listener: (command: AppMenuCommand) => void,
  ): Promise<Result<Unsubscribe, AppMenuError>>;
}>;

export const AppMenu = {
  create(tauriIpc: TauriIpc): AppMenu {
    return {
      async subscribeCommand(listener) {
        try {
          const unsubscribe = await tauriIpc.listen(
            MenuCommandEvent,
            (payload) => {
              // 語彙に無い値は配らない。指示として渡せる中身が無く、イベントの
              // コールバックには失敗を返す相手もいないため。
              const command = toAppMenuCommand(payload);
              if (command.some) {
                listener(command.value);
              }
            },
          );
          return Result.ok(unsubscribe);
        } catch (reason) {
          return Result.err({ message: String(reason) });
        }
      },
    };
  },
} as const;
