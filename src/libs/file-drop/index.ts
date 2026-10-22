import { FilePath } from "@/domains/unit/file-path";
import type { TauriIpc, Unsubscribe } from "@/libs/tauri-ipc";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * ウィンドウへファイルが落とされたことを知らせるイベント名。
 *
 * Tauri 自身が webview へ配る（`tauri` クレートの `DRAG_DROP_EVENT`）ので、
 * こちらの Rust 側には対になるコードが無い。
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
 * @returns 落とされたファイルのパスの並び（ファイル名の要素を持たないものは落とす）。
 *   並びとして読めない・残ったパスが 1 件も無いときは `none`
 */
function toDroppedPaths(payload: unknown): Option<readonly FilePath[]> {
  if (typeof payload !== "object" || payload === null) {
    return Option.none;
  }
  const { paths } = payload as Record<string, unknown>;
  if (!Array.isArray(paths) || !paths.every((p) => typeof p === "string")) {
    return Option.none;
  }
  const filePaths = paths.flatMap((path) => {
    const filePath = FilePath.create(path);
    return Option.isSome(filePath) ? [filePath.value] : [];
  });
  return filePaths.length > 0 ? Option.some(filePaths) : Option.none;
}

/**
 * ウィンドウへのファイルのドロップ（docs/05-architecture.md「Tauri IPC」）。配るのは落
 * とされたパスのうちファイル名の要素を持つものの並びだけで、開けるファイルかどうかは見ない。
 *
 * ドロップを OS 側で受けるので、Windows では webview の HTML5 ドラッグ & ドロップが使え
 * ない（今のところ使っている箇所は無い）。
 */
export type FileDrop = Readonly<{
  /**
   * ドロップの購読を始め、解除関数を返す。
   */
  subscribeDropped(
    listener: (paths: readonly FilePath[]) => void,
  ): Promise<Result<Unsubscribe, FileDropError>>;
}>;

export const FileDrop = {
  /**
   * ウィンドウへのファイルのドロップを受け取る口を作る。
   *
   * @param tauriIpc ドロップのイベントを購読する IPC
   * @returns ドロップを購読できる口。作っただけでは購読せず、`subscribeDropped` を呼んだ時点で張る
   */
  create(tauriIpc: TauriIpc): FileDrop {
    return {
      async subscribeDropped(listener) {
        try {
          const unsubscribe = await tauriIpc.listen(
            DragDropEvent,
            (payload) => {
              // ファイルのパスを 1 件も持たない通知（ドラッグ中の通過・空の並びなど）は配らない。
              const paths = toDroppedPaths(payload);
              if (Option.isSome(paths)) {
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
