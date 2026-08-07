import type { DesignDocument } from "@/domains/design-document";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * 編集を戻す / やり直すための履歴（docs/06-ui.md「編集操作の一覧」の undo / redo）。
 *
 * ドキュメントは不変なので、差分ではなくスナップショットを並べるだけで成立する
 * （戻す = 1 つ前のスナップショットを今のドキュメントにする）。
 *
 * 「今のドキュメント」を履歴の外に置かず `present` として中に持つ。undo の結果は
 * 今のドキュメントと積んである並びが揃わないと決まらないため、対そのものを 1 つの型にする
 * （rules/architecture.md「2つ以上の値が常に対で渡っていないか」）。
 * 加えて、ドキュメントを差し替える道が `record` だけになるので、
 * 履歴を積み忘れたまま中身だけ差し替わった状態を作れない。
 */
export type EditHistory = Readonly<{
  /** 戻れるスナップショット。古い順に並び、末尾が `present` の 1 つ前。 */
  past: readonly DesignDocument[];
  present: DesignDocument;
  /** やり直せるスナップショット。先頭が `present` の 1 つ先。 */
  future: readonly DesignDocument[];
}>;

export const EditHistory = {
  /** 開いた直後は戻る先もやり直す先も無い。 */
  create(document: DesignDocument): EditHistory {
    return { past: [], present: document, future: [] };
  },

  /**
   * ドキュメントの差し替えを 1 つの編集として積む。
   *
   * `future` を捨てるのは、戻したところから別の編集をしたらそのやり直し先へは
   * もう到達できないため（一般的な undo / redo の分岐の扱い）。
   */
  record(history: EditHistory, document: DesignDocument): EditHistory {
    return {
      past: [...history.past, history.present],
      present: document,
      future: [],
    };
  },

  /** 1 つ前のスナップショットへ戻る。戻る先が無ければ `none`。 */
  undo(history: EditHistory): Option<EditHistory> {
    return Option.map(ArrayEx.last(history.past), (previous) => ({
      past: ArrayEx.dropLast(history.past),
      present: previous,
      future: [history.present, ...history.future],
    }));
  },

  /** 戻す前のスナップショットへ進む。やり直す先が無ければ `none`。 */
  redo(history: EditHistory): Option<EditHistory> {
    return Option.map(ArrayEx.first(history.future), (next) => ({
      past: [...history.past, history.present],
      present: next,
      future: ArrayEx.dropFirst(history.future),
    }));
  },
} as const;
