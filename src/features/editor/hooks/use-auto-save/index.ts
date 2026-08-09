import { useEffect, useRef, useState } from "react";
import type { DesignDocument } from "@/domains/design-document";
import type { DocumentIpc, DocumentIpcError } from "@/libs/document-ipc";
import { DocumentJson } from "@/libs/document-json";
import { Option } from "@/utils/Option";

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
 * @returns 直近の書き込みの失敗。1 度も失敗していなければ `none`
 */
export function useAutoSave({
  ipc,
  path,
  document,
}: AutoSaveTarget): Option<DocumentIpcError> {
  const [failure, setFailure] = useState<Option<DocumentIpcError>>(Option.none);
  /*
   * ファイルに載っていると分かっているドキュメント。マウント時の値はファイルから
   * 読んだ内容そのものなので、これと同一の間は書き込まない。
   * これが無いと、開いただけで書き込みが走り、ユーザーが編集していないのに
   * ファイルが現在の形式へ正規化されて差分になる（旧 major を読み込んだ場合など）。
   */
  const savedDocumentRef = useRef(document);

  useEffect(() => {
    if (document === savedDocumentRef.current) {
      return;
    }

    // 書き込み中に次の編集が来たら、その結果は捨てて後続の書き込みに任せる
    // （rules/hooks.md「ref をフラグにした防御」の代わりのクリーンアップ）。
    let ignore = false;
    const timer = setTimeout(async () => {
      const saved = await ipc.save(path, DocumentJson.serialize(document));
      if (ignore) {
        return;
      }
      if (!saved.ok) {
        setFailure(Option.some(saved.error));
        return;
      }
      savedDocumentRef.current = document;
      setFailure(Option.none);
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [ipc, path, document]);

  return failure;
}
