import type { TauriIpc } from "@/libs/tauri-ipc";
import { ipcFailure } from "@/libs/tauri-ipc/fake";
import { Option } from "@/utils/Option";
import {
  createDocumentIpc,
  type DocumentIpc,
  type DocumentIpcErrorKind,
} from "../index";

/** 別の綴りと、それが指す実体の綴り。symlink に限らず、同じファイルを指す別の綴りを表す。 */
export type PathLink = Readonly<{ link: string; target: string }>;

/** `denyCanonicalize` で再現できる失敗の種別。 */
type CanonicalizeDenialKind = Extract<
  DocumentIpcErrorKind,
  "invalidPath" | "ipcFailed"
>;

/** 綴りを寄せられないパスと、そのときに返す失敗の種別。 */
export type CanonicalizeDenial = Readonly<{
  path: string;
  kind: CanonicalizeDenialKind;
}>;

/**
 * Rust 側の代役。インメモリのファイル表に対して `docs/05-architecture.md`「Tauri IPC」の
 * 5コマンドと `document-changed` を再現する。
 *
 * 差し込む先は `TauriIpc` の位置なので、`ipc` を通した呼び出しでは `createDocumentIpc`
 * が作る本体（コマンド名・引数・エラーの解釈）がそのまま動く。
 */
export type DocumentIpcFake = Readonly<{
  /** インメモリのファイル表に向いた `DocumentIpc`。 */
  ipc: DocumentIpc;
  /**
   * 外部（AI・エディタ・git 操作等）による書き換えを再現する。
   * 監視中のパスなら `document-changed` が届く。
   */
  changeExternally(path: string, content: string): void;
  /** 現在のファイルの中身。別の綴りを登録したパスは、その実体の中身を返す。 */
  contentOf(path: string): Option<string>;
  /**
   * そのパスを監視しているか。
   * 監視の開始 / 停止は Rust 側に残る状態なので、代役の側から見えるようにしておく。
   */
  isWatching(path: string): boolean;
  /**
   * `link` を `target` の別の綴りにする（symlink・`.` を含む綴り・大文字小文字違いの代わり）。
   *
   * 本物と同じく、読み込み・書き込み・監視・外部変更のどれも実体へ届き、綴りを寄せると
   * `target` が返る。解決するのは 1 段だけ（`target` がさらに別の綴りでも辿らない）。
   */
  linkPath(link: PathLink): void;
  /**
   * そのパスの綴りを寄せるコマンドを、`kind` の種別で失敗させる。
   *
   * 既定では寄せても綴りは変わらない（`linkPath` で登録した綴りだけが実体へ寄る）。
   */
  denyCanonicalize(denial: CanonicalizeDenial): void;
  /**
   * そのパスへの書き込みだけを拒むようにする（読み込みと監視はそのまま動く）。
   *
   * 全コマンドを失敗させる代役だと監視も張れず、「ファイルが不正な状態」に到達できないため、
   * 書き込みだけを落とせるようにしている。
   */
  denyWrites(path: string): void;
  /**
   * 外部変更の購読そのものを張れないようにする。
   *
   * 監視は「購読を張る」と「watch を始める」の 2 段で、`denyWrites` でも
   * `notFound` でも前段には届かない。前段が失敗したときの見え方を確かめるために分けている。
   */
  denySubscribe(): void;
  /**
   * そのパスへの書き込みを、返した関数が呼ばれるまで終わらせないようにする。
   *
   * 代役の書き込みは即座に解決するため、そのままでは「書き込み中」の状態を画面から観測できな
   * い。押した直後の見え方（ボタンが押せないこと）を確かめるために止められるようにしている。
   *
   * @param path 止める対象のパス
   * @returns 止めていた書き込みを進める関数
   */
  holdWrites(path: string): () => void;
}>;

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
  /**
   * Rust 側の代役を作る。
   *
   * @param files 始めから在るファイルの、パスから中身への表。省くとファイルが 1 つも無い
   * @returns 代役の口と、外部変更を起こす手段・ファイル表の様子を見る手段
   */
  create(files: Readonly<Record<string, string>> = {}): DocumentIpcFake {
    const contents = new Map(Object.entries(files));
    const deniedWritePaths = new Set<string>();
    const heldWrites = new Map<string, Promise<void>>();
    const linkTargets = new Map<string, string>();
    const canonicalizeDenials = new Map<string, CanonicalizeDenialKind>();
    // 実体から、監視を張ったときの綴りへの表。通知はその綴りで届き、別の綴りで張り直すと
    // 置き換わる（Rust の `watch/watchers.rs` が実体ごとに監視を 1 つだけ持つのと同じ）。
    const watchedSpellings = new Map<string, string>();
    const listeners = new Set<(payload: unknown) => void>();
    let subscribeDenied = false;

    const targetOf = (path: string): string => linkTargets.get(path) ?? path;

    const notifyChange = (target: string, content: string): void => {
      const path = watchedSpellings.get(target);
      if (path === undefined) {
        return;
      }
      for (const listener of listeners) {
        listener({ path, content });
      }
    };

    const canonicalizeDocumentPath = (path: string): Promise<unknown> => {
      switch (canonicalizeDenials.get(path)) {
        case "invalidPath":
          return Promise.reject({
            kind: "invalidPath",
            message: `${path}: ドキュメントのパスとして扱えない`,
          });
        case "ipcFailed":
          return ipcFailure(`canonicalize_document_path: ${path} に届かない`);
        case undefined:
          return Promise.resolve(targetOf(path));
      }
    };

    const loadDocument = (path: string): Promise<unknown> => {
      const content = contents.get(targetOf(path));
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
          contents.set(targetOf(path), content);
        });
      }
      contents.set(targetOf(path), content);
      // 自アプリの書き込みでは通知しない。Rust 側が自書き込みを識別して
      // 自己ループを防いでいるので、代役も同じ振る舞いにする。
      return Promise.resolve(undefined);
    };

    const watchDocument = (path: string): Promise<unknown> => {
      // Rust 側は監視開始時に現在の内容を読むため、読めないパスは失敗する。
      if (!contents.has(targetOf(path))) {
        return notFound(path);
      }
      watchedSpellings.set(targetOf(path), path);
      return Promise.resolve(undefined);
    };

    const unwatchDocument = (path: string): Promise<unknown> => {
      watchedSpellings.delete(targetOf(path));
      return Promise.resolve(undefined);
    };

    const tauriIpc: TauriIpc = {
      invoke(command, args) {
        const { path } = args;
        if (typeof path !== "string") {
          return ipcFailure(`${command}: path が文字列でない`);
        }
        switch (command) {
          case "canonicalize_document_path":
            return canonicalizeDocumentPath(path);
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
        if (subscribeDenied) {
          return ipcFailure(`${event}: 購読を開始できない`);
        }
        listeners.add(handler);
        return Promise.resolve(() => {
          listeners.delete(handler);
        });
      },
    };

    return {
      ipc: createDocumentIpc(tauriIpc),

      changeExternally(path, content) {
        contents.set(targetOf(path), content);
        notifyChange(targetOf(path), content);
      },

      contentOf(path) {
        return Option.fromNullable(contents.get(targetOf(path)));
      },

      isWatching(path) {
        return watchedSpellings.has(targetOf(path));
      },

      linkPath({ link, target }) {
        linkTargets.set(link, target);
      },

      denyCanonicalize({ path, kind }) {
        canonicalizeDenials.set(path, kind);
      },

      denyWrites(path) {
        deniedWritePaths.add(path);
      },

      denySubscribe() {
        subscribeDenied = true;
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
