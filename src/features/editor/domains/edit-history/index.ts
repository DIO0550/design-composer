import type { DesignDocument } from "@/domains/dcmp/design-document";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * 編集の履歴（docs/06-ui.md「編集操作の一覧」の undo / redo、
 * docs/05-architecture.md「保存モデル」のメモリ内管理）。
 *
 * ドキュメントは不変なので、差分ではなくスナップショットを並べるだけで戻せる（#41）。
 * 書き換えた経路以外の枝は前のスナップショットと同じ参照が残るため、
 * 1 編集で増えるのは書き換えた経路ぶんになる。
 *
 * 今表示しているドキュメント（`present`）を履歴の外に置かず中に持つ。
 * undo は「今のドキュメント」と「積んである並び」が揃って初めて結果が決まる
 * （rules/architecture.md「2つ以上の値が常に対で渡っていないか」）ためで、
 * これにより履歴を積まずにドキュメントだけ差し替える経路が無くなる。
 *
 * どちらの並びも時系列（古い → 新しい）で持つ。`past` の末尾が 1 つ前、
 * `future` の先頭が 1 つ先になる。
 */
export type EditHistory = Readonly<{
  past: readonly DesignDocument[];
  present: DesignDocument;
  future: readonly DesignDocument[];
}>;

export const EditHistory = {
  /** 開いた直後は戻る先も進む先も無い。 */
  create(document: DesignDocument): EditHistory {
    return { past: [], present: document, future: [] };
  },

  /**
   * 新しいドキュメントを現在地にし、それまでの現在地を戻る先として積む。
   *
   * `future` は捨てる。戻ったあとに別の編集をしたら、それまで進める先だった並びは
   * もう今の現在地から続いていないため。
   */
  record(history: EditHistory, document: DesignDocument): EditHistory {
    return {
      past: [...history.past, history.present],
      present: document,
      future: [],
    };
  },

  /** 1 つ前へ戻る。戻る先が無ければ `none`。 */
  undo(history: EditHistory): Option<EditHistory> {
    return Option.map(ArrayEx.last(history.past), (previous) => ({
      past: ArrayEx.dropLast(history.past),
      present: previous,
      future: [history.present, ...history.future],
    }));
  },

  /** 戻る前の位置へ進む。進む先が無ければ `none`。 */
  redo(history: EditHistory): Option<EditHistory> {
    return Option.map(ArrayEx.first(history.future), (next) => ({
      past: [...history.past, history.present],
      present: next,
      future: ArrayEx.dropFirst(history.future),
    }));
  },
} as const;
