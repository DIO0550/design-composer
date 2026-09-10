import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * キャンバスの操作が、押された位置のどこまで内側へ入るか（docs/06-ui.md「選択」）。
 *
 * 3 つとも「今いる深さからどれだけ深くするか」という 1 本の軸に載せている
 * （深くしない / 1 階層だけ / 掘れるだけ）。押し方（クリック・ダブルクリック・
 * ⌘ + クリック）そのものを値にしないのは、それが入力の事情であって選択の規則ではないため
 * （rules/architecture.md「解釈はコントロール側に置き、ドメインには解釈済みの値を渡す」）。
 */
export const SelectionDigs = {
  NoDeeper: "no-deeper",
  OneDeeper: "one-deeper",
  Deepest: "deepest",
} as const;

/*
 * `NoDeeper` が今の選択を据え置くのは、ダブルクリックの直前に `click` が 2 回届くため。
 * 押すたびに入口へ戻すと、その 2 回が掘った選択を毎回巻き戻して 2 階層より内側へ入れない。
 *
 * 2 回目以降の `click` を `event.detail` で捨てる形にはしない。人が間を空けて
 * ダブルクリックを繰り返すと `detail` が 1 に戻るので、テストだけが通って実機では直らない。
 */

/** 掘る量。 */
export type SelectionDig = ValueOf<typeof SelectionDigs>;

/**
 * 今の選択が候補の中にある位置。
 *
 * @param candidates 押された位置から外へ辿った、選べるノードの名前（内→外）
 * @param selected 今選んでいる名前。単一選択でなければ `none`
 * @returns 候補の中の位置。押された位置が今の選択の内側でなければ `none`
 */
function selectedIndexIn(
  candidates: readonly string[],
  selected: Option<string>,
): Option<number> {
  return Option.flatMap(selected, (name) => {
    const index = candidates.indexOf(name);
    return index >= 0 ? Option.some(index) : Option.none;
  });
}

/**
 * 今の選択より 1 つ内側の候補。
 *
 * 候補は内側から外へ並んでいるので、選択より外側（後ろ）を落とした残りの**末尾**が
 * 1 つ内側になる。選べない名前（部品定義の中のノードなど）は候補に入っていないため、
 * 掘った先がインスタンスならそこで止まる。
 *
 * @param candidates 押された位置から外へ辿った、選べるノードの名前（内→外）
 * @param selectedIndex 今の選択が候補の中にある位置
 * @returns 1 つ内側の名前。今の選択がいちばん内側なら `none`
 */
function insideOf(
  candidates: readonly string[],
  selectedIndex: number,
): Option<string> {
  return ArrayEx.last(candidates.slice(0, selectedIndex));
}

export const SelectionDig = {
  /**
   * 掘る量から、選ぶ名前を決める。
   *
   * `candidates` に artboard を含めないのは、artboard が掘る対象の外側にある器で、
   * 据え置き（`NoDeeper`）や 1 階層（`OneDeeper`）の起点にならないため。混ぜると
   * 「artboard を選んでいるときも据え置く」が成立し、中身を押しても選択が動かなくなる。
   * 決まらなかったときに artboard へ倒すかどうかは呼び出し側が決める。
   *
   * @param dig 掘る量
   * @param candidates 押された位置から外へ辿った、選べるノードの名前（内→外。artboard を含まない）
   * @param selected 今選んでいる名前。単一選択でなければ `none`
   * @returns 選ぶ名前。候補が空なら `none`。`OneDeeper` で今の選択より内側が無いときは
   *   今の選択そのもの（掘りきった状態を保つ）
   */
  nameAt(
    dig: SelectionDig,
    candidates: readonly string[],
    selected: Option<string>,
  ): Option<string> {
    /*
     * 押された位置が今の選択の内側にあるときだけ、今の深さを起点にする。
     * 外れていれば枝が違うので、掘る量に関わらず押された枝の入口から選び直す
     * （掘った深さを枝をまたいで引き継がない / docs/06-ui.md「選択」）。
     */
    const selectedIndex = selectedIndexIn(candidates, selected);
    const outermost = ArrayEx.last(candidates);
    switch (dig) {
      case "no-deeper":
        return selectedIndex.some ? selected : outermost;
      case "one-deeper":
        return selectedIndex.some
          ? Option.or(insideOf(candidates, selectedIndex.value), selected)
          : outermost;
      case "deepest":
        return ArrayEx.first(candidates);
    }
  },
} as const;
