import { useEffect, useRef, useState } from "react";
import type { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSaveState } from "@/domains/session/document-save-state";
import { FileValidity } from "@/domains/session/file-validity";
import { type DocumentIpc, toDocumentAccessFailure } from "@/libs/document-ipc";
import { DocumentJson } from "@/libs/document-json";

/**
 * 編集が止まってからファイルへ書き出すまでの待ち時間（docs/05-architecture.md「保存モデル:
 * 自動保存」）。自動保存の間隔はこの 1 箇所で決める。
 */
export const AutoSaveDebounceMs = 500;

/**
 * 書き出す内容と書き出し先、および書き出してよいか。どれか 1 つでは書き込みが決まらない
 * ため 1 つにまとめる。
 */
export type AutoSaveTarget = Readonly<{
  ipc: DocumentIpc;
  path: string;
  document: DesignDocument;
  fileValidity: FileValidity;
}>;

/**
 * ドキュメントの変更をデバウンスしてファイルへ書き出す（docs/05-architecture.md「保存モ
 * デル: 自動保存」）。直近の書き込み失敗を返し、呼び出し側が表示を決める。
 *
 * 保存は last-write-wins で、書き込み前に読み直したりマージしたりはしない。
 *
 * ファイルが不正な間は書き出さない。映っているのは最後に正常だった表示なので、書き出す
 * と**より新しい外部の書き込みを古い内容で潰す**ことになる（表示中の内容で潰す操作は
 * `revert file` が別に持つ）。
 *
 * @returns 画面のドキュメントとファイルが一致しているか。書き出し待ち・書き出し
 *   中は `saving`、書き込みが拒まれている間は `failed`
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
    // 凍結が解ければ妥当性が変わってこの effect が再び走り、書き出しの要否から決め直される。
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
        setSaveState(
          DocumentSaveState.failed(toDocumentAccessFailure(saved.error)),
        );
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
