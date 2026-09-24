import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import { Css } from "@/utils/Css";
import { Option } from "@/utils/Option";

/**
 * キャンバスに描かれた要素を DOM から引く境界。
 *
 * キャンバスの中身はコンパイル結果の HTML を流し込んでおり React の管理下に無いため、
 * ref では掴めず名前の属性を選択子にして引くしかない。引き方はどこでも同じなので、
 * DOM を触るところをここへ閉じ込める（実測の入口は `DrawnBounds`）。
 */
export const CanvasDom = {
  /**
   * その名前で描かれている要素を引く。
   *
   * 名前はドキュメント上で一意（docs/01-file-format.md「ノードの識別（name）」）でも、部品の中の
   * ノードは展開で名前を付け替えないので、インスタンスの数だけ同じ名前で描かれる。
   *
   * @param name 引きたい artboard / ノードの名前
   * @returns 描かれていればその要素。同じ名前が複数描かれていれば DOM の並びで最初のもの。
   *   描かれていなければ `none`
   */
  elementOf(name: string): Option<Element> {
    return Option.fromNullable(
      globalThis.document.querySelector(
        `[${ElementNameAttribute}="${Css.escapeQuotedString(name)}"]`,
      ),
    );
  },
} as const;
