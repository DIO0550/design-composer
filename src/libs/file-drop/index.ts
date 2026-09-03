import type { TauriIpc, Unsubscribe } from "@/libs/tauri-ipc";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * ウィンドウへファイルが落とされたことを知らせるイベント名。
 *
 * Tauri 自身が webview へ配る（`tauri` クレートの `DRAG_DROP_EVENT`）ので、
 * こちらの Rust 側には対になるコードが無い。
 *
 * export しているのは、テストの代役が同じ名前で配れるようにするため。
 */
export const DragDropEvent = "tauri://drag-drop";

/** 購読を張れなかった失敗と、診断用の原文。 */
export type FileDropError = Readonly<{ message: string }>;

/**
 * 落とされた値を、ファイルのパスの並びとして読む。
 *
 * ドラッグ中の通過（`tauri://drag-over`）とは別のイベントだが、同じ形の値が
 * 来るとは限らないので、`as` で通さず形を確かめる。
 *
 * @param payload ドロップのイベントで届いた値
 * @returns 落とされたファイルのパスの並び。並びとして読めなければ `none`
 */
function toDroppedPaths(payload: unknown): Option<readonly string[]> {
  if (typeof payload !== "object" || payload === null) {
    return Option.none;
  }
  const { paths } = payload as Record<string, unknown>;
  if (!Array.isArray(paths) || !paths.every((p) => typeof p === "string")) {
    return Option.none;
  }
  return Option.some(paths);
}

/**
 * ウィンドウへのファイルのドロップ（docs/05-architecture.md「Tauri IPC」）。
 *
 * 配るのは落とされたパスの並びだけで、開けるファイルかどうかは見ない。
 * Why not: 拡張子で絞ると、落としたのに何も起きないファイルができる
 * （`rules/coding.md`「失敗を握りつぶして既定値へフォールバックしない」）。
 * 開こうとして失敗させれば、理由が画面に出る。
 *
 * Why not: `@tauri-apps/api/webview` の `onDragDropEvent` は使わない。
 * `@tauri-apps/*` の import 先が `libs/tauri-ipc` の外へ増えるため
 * （同じイベントは `listen` で受けられる）。
 *
 * ドロップを OS 側で受けるので、Windows では webview の HTML5 ドラッグ & ドロップが
 * 使えなくなる（Tauri の `dragDropEnabled` は既定で有効）。今のところ HTML5 の
 * ドラッグ & ドロップを使っている箇所は無いので影響しないが、ツリーの並べ替えを
 * それで作るときはここと両立しない。
 */
export type FileDrop = Readonly<{
  /**
   * ドロップの購読を始め、解除関数を返す。
   *
   * 解除関数を `Promise` 越しに返す理由は `AppMenu.subscribeCommand` と同じ。
   */
  subscribeDropped(
    listener: (paths: readonly string[]) => void,
  ): Promise<Result<Unsubscribe, FileDropError>>;
}>;

export const FileDrop = {
  create(tauriIpc: TauriIpc): FileDrop {
    return {
      async subscribeDropped(listener) {
        try {
          const unsubscribe = await tauriIpc.listen(
            DragDropEvent,
            (payload) => {
              // パスの並びを持たない通知（ドラッグ中の通過など）は配らない。
              const paths = toDroppedPaths(payload);
              if (paths.some) {
                listener(paths.value);
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
