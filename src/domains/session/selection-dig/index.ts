import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * キャンバスの操作が、押された位置のどこまで内側へ入るか（docs/06-ui.md「選択」）。
 *
 * 3 つとも「今いる深さからどれだけ深くするか」という 1 本の軸に載せている（深くしない /
 * 1 階層だけ / 掘れるだけ）。
 */
export const SelectionDigs = {
  NoDeeper: "no-deeper",
  OneDeeper: "one-deeper",
  Deepest: "deepest",
} as const;

/*
 * `NoDeeper` が今の選択を据え置くのは、ダブルクリックの直前に `click` が 2 回届くため。
 * 押すたびに入口へ戻すと、その 2 回が掘った選択を毎回巻き戻して 2 階層より内側へ入れな
 * い。
 *
 * 2 回目以降の `click` を `event.detail` で捨てる形にはしない。人が間を空けてダブルクリ
 * ックを繰り返すと `detail` が 1 に戻るので、テストだけが通って実機では直らない。
 */

/** 掘る量。 */
export type SelectionDig = ValueOf<typeof SelectionDigs>;

/** 候補の中に載っている今の選択と、その位置。 */
type SelectedCandidate = Readonly<{
  /** 候補の中の位置。 */
  index: number;
  /** その位置にある、選ばれている名前。 */
  name: string;
}>;

/**
 * 今の選択が候補の中にある位置と、その名前。選んでいるものが候補に 2 つ以上載っていれば
 * （祖先と子孫を両方選んでいるとき）、いちばん内側のもの。
 *
 * @param candidates 押された位置から外へ辿った、選べるノードの名前（内→外）
 * @param selected 今選んでいる名前すべて。未選択なら空
 * @returns 候補の中の位置と名前。押された位置がどの選択の内側でもなければ `none`
 */
function selectedCandidateIn(
  candidates: readonly string[],
  selected: readonly string[],
): Option<SelectedCandidate> {
  return Option.fromNullable(
    candidates
      .map((name, index) => ({ index, name }))
      .find((candidate) => selected.includes(candidate.name)),
  );
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
   * 混ぜると「artboard を選んでいるときも据え置く」が成立し、中身を押しても選択が動かなくな
   * る。
   *
   * 決まらなかったときに artboard へ倒すかどうかは呼び出し側が決める。
   *
   * @param dig 掘る量
   * @param candidates 押された位置から外へ辿った、選べるノードの名前（内→外。artboard を含まない）
   * @param selected 今選んでいる名前すべて。複数選択ならその一員それぞれが掘る起点になる。
   *   未選択なら空
   * @returns 選ぶ名前。候補が空なら `none`。`NoDeeper` で押された位置が選択の内側なら、
   *   候補に載っている選択（2 つ以上載っていればいちばん内側）。`OneDeeper` でその選択より
   *   内側が無いときはその選択そのもの（掘りきった状態を保つ）
   */
  nameAt(
    dig: SelectionDig,
    candidates: readonly string[],
    selected: readonly string[],
  ): Option<string> {
    /*
     * 押された位置が今の選択の内側にあるときだけ、今の深さを起点にする。
     * 外れていれば枝が違うので、掘る量に関わらず押された枝の入口から選び直す
     * （掘った深さを枝をまたいで引き継がない / docs/06-ui.md「選択」）。
     */
    const selectedCandidate = selectedCandidateIn(candidates, selected);
    const selectedName = Option.map(
      selectedCandidate,
      (candidate) => candidate.name,
    );
    const outermost = ArrayEx.last(candidates);
    switch (dig) {
      case "no-deeper":
        return Option.or(selectedName, outermost);
      case "one-deeper":
        return Option.isSome(selectedCandidate)
          ? Option.or(
              insideOf(candidates, selectedCandidate.value.index),
              selectedName,
            )
          : outermost;
      case "deepest":
        return ArrayEx.first(candidates);
    }
  },
} as const;
