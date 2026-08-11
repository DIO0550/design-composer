import type { TauriIpc } from "@/libs/tauri-ipc";
import { Option } from "@/utils/Option";
import { DocumentIpc } from "../index";

/**
 * Rust 側の代役。インメモリのファイル表に対して `docs/05-architecture.md`「Tauri IPC」の
 * 4コマンドと `document-changed` を再現する。
 *
 * 差し込む先は `TauriIpc` の位置なので、`ipc` を通した呼び出しでは `DocumentIpc` 本体
 * （コマンド名・引数・エラーの解釈）がそのまま動く。モックライブラリを使わないのは
 * テスト規約に従うため。
 */
export type DocumentIpcFake = Readonly<{
  /** インメモリのファイル表に向いた `DocumentIpc`。 */
  ipc: DocumentIpc;
  /**
   * 外部（AI・エディタ・git 操作等）による書き換えを再現する。
   * 監視中のパスなら `document-changed` が届く。
   */
  changeExternally(path: string, content: string): void;
  /** 現在のファイルの中身。 */
  contentOf(path: string): Option<string>;
  /**
   * そのパスを監視しているか。
   * 監視の開始 / 停止は Rust 側に残る状態なので、代役の側から見えるようにしておく。
   */
  isWatching(path: string): boolean;
  /**
   * そのパスへの書き込みだけを拒むようにする（読み込みと監視はそのまま動く）。
   *
   * 全コマンドを失敗させる代役だと監視も張れず、「ファイルが不正な状態」に
   * 到達できないため、書き込みだけを落とせるようにしている（#136）。
   */
  denyWrites(path: string): void;
  /**
   * そのパスへの書き込みを、返した関数が呼ばれるまで終わらせないようにする。
   *
   * 代役の書き込みは即座に解決するため、そのままでは「書き込み中」の状態を
   * 画面から観測できない。押した直後の見え方（ボタンが押せないこと）を
   * 確かめるために止められるようにしている（#136）。
   *
   * @param path 止める対象のパス
   * @returns 止めていた書き込みを進める関数
   */
  holdWrites(path: string): () => void;
}>;

/**
 * Tauri 自身が失敗したときと同じく、文字列で reject する。
 *
 * @param message 失敗として伝える文言
 * @returns 決して解決しない Promise
 * @throws 必ず。文字列で reject する
 */
function ipcFailure(message: string): Promise<never> {
  return Promise.reject(message);
}

/**
 * 本物と同じ形（種別つき）でファイルの不在を返す。
 *
 * @param path 見つからなかったパス
 * @returns 決して解決しない Promise
 * @throws 必ず。`notFound` の種別を持つ失敗で reject する
 */
function notFound(path: string): Promise<never> {
  return Promise.reject({
    kind: "notFound",
    message: `${path}: ファイルが存在しない`,
  });
}

/**
 * 本物と同じ形（種別つき）で書き込みの拒否を返す。
 *
 * @param path 書けなかったパス
 * @returns 決して解決しない Promise
 * @throws 必ず。`permissionDenied` の種別を持つ失敗で reject する
 */
function permissionDenied(path: string): Promise<never> {
  return Promise.reject({
    kind: "permissionDenied",
    message: `${path}: 書き込みが拒まれた`,
  });
}

export const DocumentIpcFake = {
  create(files: Readonly<Record<string, string>> = {}): DocumentIpcFake {
    const contents = new Map(Object.entries(files));
    const deniedWritePaths = new Set<string>();
    const heldWrites = new Map<string, Promise<void>>();
    const watchedPaths = new Set<string>();
    const listeners = new Set<(payload: unknown) => void>();

    const notifyChange = (path: string, content: string): void => {
      if (!watchedPaths.has(path)) {
        return;
      }
      for (const listener of listeners) {
        listener({ path, content });
      }
    };

    const loadDocument = (path: string): Promise<unknown> => {
      const content = contents.get(path);
      return content === undefined ? notFound(path) : Promise.resolve(content);
    };

    const saveDocument = (path: string, content: unknown): Promise<unknown> => {
      if (typeof content !== "string") {
        return ipcFailure("save_document: content が文字列でない");
      }
      if (deniedWritePaths.has(path)) {
        return permissionDenied(path);
      }
      const held = heldWrites.get(path);
      if (held !== undefined) {
        // 解放されるまで書き込みを終わらせない（呼び出し側が「書き込み中」を観測できる）
        return held.then(() => {
          contents.set(path, content);
        });
      }
      contents.set(path, content);
      // 自アプリの書き込みでは通知しない。Rust 側が自書き込みを識別して
      // 自己ループを防いでいる（#26 / #27）ので、代役も同じ振る舞いにする。
      return Promise.resolve(undefined);
    };

    const watchDocument = (path: string): Promise<unknown> => {
      // Rust 側は監視開始時に現在の内容を読むため、読めないパスは失敗する。
      if (!contents.has(path)) {
        return notFound(path);
      }
      watchedPaths.add(path);
      return Promise.resolve(undefined);
    };

    const unwatchDocument = (path: string): Promise<unknown> => {
      watchedPaths.delete(path);
      return Promise.resolve(undefined);
    };

    const tauriIpc: TauriIpc = {
      invoke(command, args) {
        const { path } = args;
        if (typeof path !== "string") {
          return ipcFailure(`${command}: path が文字列でない`);
        }
        switch (command) {
          case "load_document":
            return loadDocument(path);
          case "save_document":
            return saveDocument(path, args.content);
          case "watch_document":
            return watchDocument(path);
          case "unwatch_document":
            return unwatchDocument(path);
          default:
            return ipcFailure(`Command ${command} not found`);
        }
      },

      listen(event, handler) {
        if (event !== "document-changed") {
          return ipcFailure(`Event ${event} not emitted`);
        }
        listeners.add(handler);
        return Promise.resolve(() => {
          listeners.delete(handler);
        });
      },
    };

    return {
      ipc: DocumentIpc.create(tauriIpc),

      changeExternally(path, content) {
        contents.set(path, content);
        notifyChange(path, content);
      },

      contentOf(path) {
        return Option.fromNullable(contents.get(path));
      },

      isWatching(path) {
        return watchedPaths.has(path);
      },

      denyWrites(path) {
        deniedWritePaths.add(path);
      },

      holdWrites(path) {
        let release = (): void => {};
        heldWrites.set(
          path,
          new Promise<void>((resolve) => {
            release = resolve;
          }),
        );
        return () => {
          heldWrites.delete(path);
          release();
        };
      },
    };
  },
} as const;
