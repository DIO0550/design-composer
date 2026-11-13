import { DesignDocument } from "@/domains/dcmp/design-document";
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
 * まりの続き**に限られる。
 *
 * `past` の後ろに `present` を続けた並びで、同じ中身が隣り合うのは末尾の 1 組（`past` の末尾
 * と `present`）だけ。中身の変わらない編集は積まれたあと、次の `record` / `undo` の入口で落ちる。
 */
export type EditHistory = Readonly<{
  past: readonly DesignDocument[];
  present: DesignDocument;
  future: readonly DesignDocument[];
}>;

/**
 * 戻る先の末尾が現在地と同じ中身なら、それを落とした履歴にする。
 *
 * 落とすのは 1 件で足りる。同じ中身が隣り合いうるのは末尾の 1 組だけ（型の不変条件）。
 * `undo` だけで通すと無変化の編集を 2 回続けたときに 1 回目の undo が画面を変えないので、
 * `record` が積む前にも通して不変条件を保つ。
 *
 * @param history 整える履歴
 * @returns 戻る先の末尾が現在地と同じ中身ならそれを落とした履歴。違えば `history` のまま
 */
function withoutUnchangedLast(history: EditHistory): EditHistory {
  const unchanged = Option.equals(
    ArrayEx.last(history.past),
    Option.some(history.present),
    DesignDocument.isSameContent,
  );
  if (!unchanged) {
    return history;
  }
  return { ...history, past: ArrayEx.dropLast(history.past) };
}

export const EditHistory = {
  /**
   * 開いた直後の履歴を作る。
   *
   * @param document 開いたドキュメント
   * @returns そのドキュメントを現在地にした、戻る先も進む先も無い履歴
   */
  create(document: DesignDocument): EditHistory {
    return { past: [], present: document, future: [] };
  },

  /**
   * 新しいドキュメントを現在地にし、それまでの現在地を戻る先として積む。
   *
   * `document` が現在地と同じ中身でも積む。ここで弾くと、続く `amend` が戻る先の無いまま現在
   * 地を上書きし、まとまりの前へ戻れなくなる。
   *
   * @param history 積む先の履歴
   * @param document 新しく現在地にするドキュメント
   * @returns それまでの現在地を戻る先の末尾へ積み、進む先を捨てた履歴。積む前に、戻る先の末尾
   *   が現在地と同じ中身ならそれを落とす
   */
  record(history: EditHistory, document: DesignDocument): EditHistory {
    const normalized = withoutUnchangedLast(history);
    return {
      past: [...normalized.past, normalized.present],
      present: document,
      future: [],
    };
  },

  /**
   * 直前に積んだものと同じまとまりの続きとして、戻る先を増やさずに現在地だけを差し替える。
   *
   * 1 回の操作が何度もドキュメントを書き換えるため、その連続を 1 件に畳むのに使う。どの
   * 操作が 1 件になるかは docs/06-ui.md「キャンバス直接操作」「編集操作の一覧」。
   *
   * まとまりの 1 件目は `record` が積む。戻る先が無いまま呼ぶと、**そのとき現在地にあった
   * ドキュメントへは戻れなくなる**（まとまりの始まりを知っているのは操作を受けている側
   * だけなので、ここでは `record` へ倒さない）。
   *
   * @param history 差し替える先の履歴
   * @param document 新しく現在地にするドキュメント
   * @returns 戻る先はそのままで、進む先を捨てた履歴
   */
  amend(history: EditHistory, document: DesignDocument): EditHistory {
    return { past: history.past, present: document, future: [] };
  },

  /**
   * 1 つ前へ戻る。
   *
   * @param history 戻す履歴
   * @returns 今の現在地を進む先の先頭へ移し、戻る先の末尾を現在地にした履歴。戻る先の末尾が
   *   今の現在地と同じ中身ならそれを飛ばして 1 つ前へ戻る。戻る先が無ければ（飛ばした結果
   *   無くなったときも）`none`
   */
  undo(history: EditHistory): Option<EditHistory> {
    const normalized = withoutUnchangedLast(history);
    return Option.map(ArrayEx.last(normalized.past), (previous) => ({
      past: ArrayEx.dropLast(normalized.past),
      present: previous,
      future: [normalized.present, ...normalized.future],
    }));
  },

  /**
   * 戻る前の位置へ進む。
   *
   * @param history 進める履歴
   * @returns 今の現在地を戻る先の末尾へ積んだ履歴。進む先が無ければ `none`
   */
  redo(history: EditHistory): Option<EditHistory> {
    return Option.map(ArrayEx.first(history.future), (next) => ({
      past: [...history.past, history.present],
      present: next,
      future: ArrayEx.dropFirst(history.future),
    }));
  },
} as const;
