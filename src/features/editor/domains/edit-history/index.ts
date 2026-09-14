import type { DesignDocument } from "@/domains/dcmp/design-document";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * 編集の履歴（docs/06-ui.md「編集操作の一覧」の undo / redo、docs/05-architecture.md「保
 * 存モデル」のメモリ内管理）。どちらの並びも時系列（古い → 新しい）で持ち、`past` の末
 * 尾が 1 つ前、`future` の先頭が 1 つ先になる。
 *
 * ドキュメントは不変なので、差分ではなくスナップショットを並べるだけで戻せる。書き換えた経
 * 路以外の枝は前のスナップショットと同じ参照が残るため、1 編集で増えるのは書き換えた経路ぶ
 * ん。
 *
 * ドキュメントだけを差し替える経路は `amend` だけで、そこは**直前に積んだものと同じまと
 * まりの続き**（1 回のドラッグの途中、1 つの入力欄への続けての打鍵）に限られる。
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
   * `future` は捨てる。
   */
  record(history: EditHistory, document: DesignDocument): EditHistory {
    return {
      past: [...history.past, history.present],
      present: document,
      future: [],
    };
  },

  /**
   * 直前に積んだものと同じまとまりの続きとして、戻る先を増やさずに現在地だけを差し替える。
   *
   * 1 回の操作が何度もドキュメントを書き換えるため、その連続を 1 件に畳むのに使う。畳む
   * 対象はドラッグ（docs/06-ui.md「リサイズハンドル」の「掴んでから離すまでが undo 1 回
   * ぶん」）と、プロパティパネルの入力欄への打鍵（同「編集操作の一覧」の props 編集）。
   *
   * まとまりの 1 件目は `record` が積む。戻る先が無いまま呼ぶと、**そのとき現在地にあった
   * ドキュメントへは戻れなくなる**（まとまりの始まりを知っているのは操作を受けている側
   * だけなので、ここでは `record` へ倒さない）。
   *
   * `future` は `record` と同じく捨てる。
   */
  amend(history: EditHistory, document: DesignDocument): EditHistory {
    return { past: history.past, present: document, future: [] };
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
