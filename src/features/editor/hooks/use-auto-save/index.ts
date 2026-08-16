import { useEffect, useRef, useState } from "react";
import type { DesignDocument } from "@/domains/design-document";
import { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import { FileValidity } from "@/features/editor/domains/file-validity";
import type { DocumentIpc } from "@/libs/document-ipc";
import { DocumentJson } from "@/libs/document-json";

/**
 * 編集が止まってからファイルへ書き出すまでの待ち時間
 * （docs/05-architecture.md「保存モデル: 自動保存」）。
 * 自動保存の間隔はこの 1 箇所で決める（#29）。
 */
export const AutoSaveDebounceMs = 500;

/**
 * 書き出す内容と書き出し先、および書き出してよいか。
 * どれか 1 つでは書き込みが決まらないため 1 つにまとめる。
 *
 * Why not: 「書き出してよい内容」を `Option<DesignDocument>` にして渡さない。
 * `Option.some` は毎回新しいオブジェクトを作るので、依存配列に入れるとレンダーのたびに
 * effect が張り直され、デバウンスが毎回リセットされて自動保存が発火しなくなる。
 * `fileValidity` は reducer が作ったときだけ同一性が変わるので依存として安全。
 */
export type AutoSaveTarget = Readonly<{
  ipc: DocumentIpc;
  path: string;
  document: DesignDocument;
  fileValidity: FileValidity;
}>;

/**
 * ドキュメントの変更をデバウンスしてファイルへ書き出す（docs/05-architecture.md
 * 「保存モデル: 自動保存」）。直近の書き込み失敗を返し、呼び出し側が表示を決める。
 *
 * 契機を個々の編集アクションではなく `document` の値の変化に置いているのは、
 * undo の適用も「通常の編集」として同じ経路で書き出すため（#29）。以降に足される
 * 編集操作も、このフックを触らずに自動保存の対象になる。
 *
 * 保存は last-write-wins で、書き込み前に現在のファイル内容を読み直したり
 * マージしたりはしない（docs/05-architecture.md「競合の解決」）。
 *
 * ファイルが不正な間は書き出さない。映っているのは最後に正常だった表示なので、
 * 書き出すと**より新しい外部の書き込みを古い内容で潰す**ことになり、
 * last-write-wins から外れる。表示中の内容でファイルを潰す操作自体は
 * `revert file`（`useFileRevert`）が別に持っている。
 *
 * @returns 画面のドキュメントとファイルが一致しているか。書き出し待ち・書き出し中は
 *   `saving`、書き込みが拒まれている間は `failed`。ファイルが不正な間は
 *   直前の状態のまま（凍結中は上部バーが保存状態を出さない）
 */
export function useAutoSave({
  ipc,
  path,
  document,
  fileValidity,
}: AutoSaveTarget): DocumentSaveState {
  const [saveState, setSaveState] = useState<DocumentSaveState>(
    DocumentSaveState.Saved,
  );
  /*
   * ファイルに載っていると分かっているドキュメント。マウント時の値はファイルから
   * 読んだ内容そのものなので、これと同一の間は書き込まない。
   * これが無いと、開いただけで書き込みが走り、ユーザーが編集していないのに
   * ファイルが現在の形式へ正規化されて差分になる（旧 major を読み込んだ場合など）。
   *
   * ref を書き換えても再レンダーは起きないので、「書き出し待ちかどうか」を
   * render 中の導出にすると表示が更新されない。保存状態を state で持つのはこのため
   * （rules/hooks.md「render で読むなら useState」）。
   */
  const savedDocumentRef = useRef(document);

  useEffect(() => {
    /*
     * 妥当性を最初に見る。書き出す必要の有無より先に置くことで、凍結中は
     * `saveState` を動かさずに抜ける（凍結が解ければこの effect が再び走り、
     * そこで書き出しの要否から決め直される）。
     */
    if (FileValidity.isInvalid(fileValidity)) {
      return;
    }
    if (document === savedDocumentRef.current) {
      /*
       * ファイルに載っている版へ戻ってきたので、書き出すものはもう無い。
       * ここで確定させないと、デバウンス中の undo（`EditHistory` は積んだ同じ参照を
       * 戻すので、この分岐に入りタイマーが cleanup で消える）で `saving` のまま固まる。
       */
      setSaveState(DocumentSaveState.Saved);
      return;
    }
    setSaveState(DocumentSaveState.Saving);

    // 書き込み中に次の編集が来たら、その結果は捨てて後続の書き込みに任せる
    // （rules/hooks.md「ref をフラグにした防御」の代わりのクリーンアップ）。
    let ignore = false;
    const timer = setTimeout(async () => {
      const saved = await ipc.save(path, DocumentJson.serialize(document));
      if (ignore) {
        return;
      }
      if (!saved.ok) {
        setSaveState(DocumentSaveState.fromError(saved.error));
        return;
      }
      savedDocumentRef.current = document;
      setSaveState(DocumentSaveState.Saved);
    }, AutoSaveDebounceMs);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [ipc, path, document, fileValidity]);

  return saveState;
}
