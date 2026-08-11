import { useState } from "react";
import type { DesignDocument } from "@/domains/design-document";
import { DocumentSaveState } from "@/features/editor/domains/document-save-state";
import type { DocumentIpc } from "@/libs/document-ipc";
import { DocumentJson } from "@/libs/document-json";

/**
 * 書き戻す先と中身、および書き戻せたことの伝え先。
 * どのパスへ何を書くかは片方だけでは決まらないため 1 つにまとめる
 * （`AutoSaveTarget` / `DocumentReloadTarget` と同じ形）。
 */
export type FileRevertTarget = Readonly<{
  ipc: DocumentIpc;
  path: string;
  document: DesignDocument;
  onReverted: () => void;
}>;

/** 画面が使う書き戻しの操作と、その書き込みの状態。 */
export type FileRevertControl = Readonly<{
  revert: () => void;
  saveState: DocumentSaveState;
}>;

/**
 * 外部変更で不正になったファイルを、表示中の内容で上書きして捨てる
 * （UI 案 docs/Design Composer.html の Error 画面 `revert file`）。
 *
 * 書き込みはボタンの押下から始めるので `useEffect` には置かない
 * （rules/hooks.md「イベント起因の処理を Effect に書かない」）。
 *
 * Why not: `useAutoSave` に任せない。あちらの書き込みの契機は
 * 「表示中のドキュメントが最後に書き出したものと違うこと」で、書き戻しは
 * 表示中のドキュメントを変えないため一度も条件に当たらない。
 *
 * 成功を `onReverted` で伝えるのは、アプリ自身の書き込みが外部変更として
 * 返ってこないため（Rust 側の `known_content` が自書き込みを識別して通知を止める / #27）。
 * 待っていてもエラー一覧が畳まれないので、書けたことをここから伝える。
 *
 * @returns 書き戻しの操作と、その書き込みの状態
 */
export function useFileRevert({
  ipc,
  path,
  document,
  onReverted,
}: FileRevertTarget): FileRevertControl {
  /*
   * 「書き込み中」と「失敗した理由」を別々の state で持たない。2 つは連動していて
   * 「書き込み中なのに失敗している」が作れてしまうため、自動保存と同じ直和を使う
   * （rules/hooks.md「1 つの処理が複数の state を更新するなら」）。
   */
  const [saveState, setSaveState] = useState<DocumentSaveState>(
    DocumentSaveState.SAVED,
  );

  const revert = () => {
    setSaveState(DocumentSaveState.SAVING);
    void ipc.save(path, DocumentJson.serialize(document)).then((saved) => {
      if (!saved.ok) {
        setSaveState(DocumentSaveState.fromError(saved.error));
        return;
      }
      setSaveState(DocumentSaveState.SAVED);
      onReverted();
    });
  };

  return { revert, saveState };
}
