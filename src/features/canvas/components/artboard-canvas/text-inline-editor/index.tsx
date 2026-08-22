import type { KeyboardEvent } from "react";
import type { TextEdit } from "@/features/canvas/domains/text-edit";

/** 編集を終えるキー（docs/06-ui.md「確定（Enter / フォーカス外し）」「キャンセル（Escape）」）。 */
const CommitKey = "Enter";
const CancelKey = "Escape";

/**
 * 編集中の Text に重ねる入力欄（docs/06-ui.md「Text のインライン編集」）。
 *
 * 描かれた要素そのものを編集させられない（キャンバスの中身は React の管理外にあり、
 * ドキュメントが変わるたびに innerHTML ごと入れ替わるためキャレットが飛ぶ）ので、
 * 実測した矩形の上へ重ねる。ズーム / パンの変形の**外側**へ置き、実測した client 座標を
 * そのまま `position: fixed` で使うのは `DropMarker` と同じ理由。
 */
export function TextInlineEditor({
  edit,
  onChange,
  onCommit,
  onCancel,
}: Readonly<{
  edit: TextEdit;
  onChange: (draft: string) => void;
  onCommit: () => void;
  onCancel: () => void;
}>) {
  return (
    <input
      type="text"
      // biome-ignore lint/a11y/noAutofocus: ダブルクリックで開く一時的な入力欄であり、開いた先で打てないと「その場で編集する」操作にならない
      autoFocus
      aria-label="文言を編集"
      value={edit.draft}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onCommit}
      onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === CommitKey) {
          onCommit();
        }
        if (event.key === CancelKey) {
          onCancel();
        }
      }}
      /*
       * 最小の幅と高さを与えるのは、文言が空の Text は矩形が潰れており、
       * 実測どおりに重ねると掴めない入力欄になるため。
       */
      className="fixed z-10 min-h-6 min-w-24 border-2 border-blue-500 bg-white px-1 text-sm"
      style={{
        left: `${edit.bounds.left}px`,
        top: `${edit.bounds.top}px`,
        width: `${edit.bounds.width}px`,
        height: `${edit.bounds.height}px`,
      }}
    />
  );
}
