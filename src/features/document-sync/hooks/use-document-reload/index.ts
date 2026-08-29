import { useEffect, useEffectEvent, useState } from "react";
import type { DocumentAccessFailure } from "@/domains/session/document-access-failure";
import { DocumentReload } from "@/domains/session/document-reload";
import {
  type DocumentChanged,
  type DocumentIpc,
  toDocumentAccessFailure,
} from "@/libs/document-ipc";
import { DocumentJson } from "@/libs/document-json";
import type { Unsubscribe } from "@/libs/tauri-ipc";
import { Option } from "@/utils/Option";

/**
 * 監視する対象と、取り込み結果の渡し先。
 * どのファイルをどの IPC で見るかは片方だけでは決まらないため 1 つにまとめる。
 */
export type DocumentReloadTarget = Readonly<{
  ipc: DocumentIpc;
  path: string;
  onReload: (reload: DocumentReload) => void;
}>;

/**
 * 開いているファイルの外部変更を検知して取り込む（docs/05-architecture.md「外部編集の検知」）。
 * 監視は表示している間だけ張り、直近の IPC の失敗を返して呼び出し側が表示を決める。
 *
 * テキストの解釈は `libs/document-json`、「取り込めたか / 拒んだか」の判断は
 * `DocumentReload` が持ち、ここは外部システム（file watch）との同期と、
 * その 2 つへの受け渡しだけを行う（rules/hooks.md）。
 *
 * 失敗をドメインの語彙で返す理由は `toDocumentAccessFailure` の doc にある
 * （残る 2 つの経路は `DocumentSaveState.failure()` 経由で届く）。
 *
 * @returns 直近の監視 / 読み込みの失敗。1 度も失敗していなければ `none`
 */
export function useDocumentReload({
  ipc,
  path,
  onReload,
}: DocumentReloadTarget): Option<DocumentAccessFailure> {
  const [failure, setFailure] = useState<Option<DocumentAccessFailure>>(
    Option.none,
  );

  /*
   * 届いた内容の解釈は監視の張り直しと関係がないため Effect Event に出す。
   * これが無いと、レンダーのたびに変わる `onReload` を Effect の依存に入れることになり、
   * 監視と購読が張り直されて、その隙間に届いた変更を落とす。
   */
  const reload = useEffectEvent((changed: DocumentChanged) => {
    // `document-changed` はアプリ全体へ配られるので、開いているファイルのものだけ取り込む。
    if (changed.path !== path) {
      return;
    }
    // 届いた内容をそのまま解釈する。`load_document` で読み直すと、その間に挟まった
    // 自アプリの保存を読んでしまい、Rust 側の自己ループ防止が崩れる（#27）。
    onReload(DocumentReload.fromParsed(DocumentJson.parse(changed.content)));
  });

  useEffect(() => {
    let stopped = false;
    let unsubscribe: Option<Unsubscribe> = Option.none;

    const start = async (): Promise<void> => {
      // 購読を先に張る。監視の開始を先にすると、購読が成立するまでの間に届いた
      // 変更を受け取れない。
      const subscribed = await ipc.subscribeChanged(reload);
      if (!subscribed.ok) {
        setFailure(Option.some(toDocumentAccessFailure(subscribed.error)));
        return;
      }
      if (stopped) {
        subscribed.value();
        return;
      }
      unsubscribe = Option.some(subscribed.value);

      const watched = await ipc.watch(path);
      if (!watched.ok) {
        setFailure(Option.some(toDocumentAccessFailure(watched.error)));
        return;
      }
      setFailure(Option.none);
    };
    void start();

    return () => {
      stopped = true;
      if (unsubscribe.some) {
        unsubscribe.value();
      }
      void ipc.unwatch(path);
    };
  }, [ipc, path]);

  return failure;
}
