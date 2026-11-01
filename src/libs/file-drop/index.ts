import { FilePath } from "@/domains/unit/file-path";
import type { TauriIpc, Unsubscribe } from "@/libs/tauri-ipc";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * ウィンドウへファイルが落とされたことを知らせるイベント名（Rust 側の
 * `DOCUMENT_DROPPED_EVENT` と対）。
 *
 * Tauri 自身が配る `tauri://drag-drop` は聞かない。Rust が落とされたパスを開いてよいものと
 * して記録する前に webview へ届くので、それを見て開くと記録の前に読み込みが届きうる。
 */
export const DocumentDroppedEvent = "document-dropped";

/** 購読を張れなかった失敗と、診断用の原文。 */
export type FileDropError = Readonly<{ message: string }>;

/**
 * 落とされた値を、ファイルのパスの並びとして読む。
 *
 * IPC を渡ってくる値に型は無いので、`as` で通さず形を確かめる。
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
 * `.dcmp` として受け付けられたものは Rust が寄せた綴りで、それ以外は落とされた綴りのまま届く。
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

/**
 * ウィンドウへのファイルのドロップを受け取る口を作る。
 *
 * @param tauriIpc ドロップのイベントを購読する IPC
 * @returns ドロップを購読できる口。作っただけでは購読せず、`subscribeDropped` を呼んだ時点で張る
 */
export function createFileDrop(tauriIpc: TauriIpc): FileDrop {
  return {
    async subscribeDropped(listener) {
      try {
        const unsubscribe = await tauriIpc.listen(
          DocumentDroppedEvent,
          (payload) => {
            // ファイルのパスを 1 件も持たない通知（空の並び・形の合わない値）は配らない。
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
}
