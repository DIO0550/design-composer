import { useEffect, useRef, useState } from "react";
import type { DesignDocument } from "@/domains/design-document";
import { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import type { DocumentIpc } from "@/libs/document-ipc";
import { DocumentJson } from "@/libs/document-json";

/**
 * 編集が止まってからファイルへ書き出すまでの待ち時間
 * （docs/05-architecture.md「保存モデル: 自動保存」）。
 * 自動保存の間隔はこの 1 箇所で決める（#29）。
 */
export const AUTO_SAVE_DEBOUNCE_MS = 500;

/** 書き出す内容と書き出し先。片方だけでは書き込みが決まらないため 1 つにまとめる。 */
export type AutoSaveTarget = Readonly<{
  ipc: DocumentIpc;
  path: string;
  document: DesignDocument;
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
 * @returns 画面のドキュメントとファイルが一致しているか。書き出し待ち・書き出し中は
 *   `saving`、書き込みが拒まれている間は `failed`
 */
export function useAutoSave({
  ipc,
  path,
  document,
}: AutoSaveTarget): DocumentSaveState {
  const [saveState, setSaveState] = useState<DocumentSaveState>(
    DocumentSaveState.SAVED,
  );
  /*
   * ファイルに載っていると分かっているドキュメント。マウント時の値はファイルから
   * 読んだ内容そのものなので、これと同一の間は書き込まない。
   * これが無いと、開いただけで書き込みが走り、ユーザーが編集していないのに
   * ファイルが現在の形式へ正規化されて差分になる（旧 major を読み込んだ場合など）。
   *
   * ref なので render では読めない。「書き出し待ちかどうか」を render 中の導出に
   * できないのはこのため（rules/hooks.md「render で読むなら useState」）。
   */
  const savedDocumentRef = useRef(document);

  useEffect(() => {
    if (document === savedDocumentRef.current) {
      /*
       * ファイルに載っている版へ戻ってきたので、書き出すものはもう無い。
       * ここで確定させないと、デバウンス中の undo（`EditHistory` は積んだ同じ参照を
       * 戻すので、この分岐に入りタイマーが cleanup で消える）で `saving` のまま固まる。
       */
      setSaveState(DocumentSaveState.SAVED);
      return;
    }
    setSaveState(DocumentSaveState.SAVING);

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
      setSaveState(DocumentSaveState.SAVED);
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [ipc, path, document]);

  return saveState;
}
