import { ElementNameAttribute } from "@/domains/compiled/compiled-element";
import { Css } from "@/utils/Css";
import { Option } from "@/utils/Option";

/**
 * キャンバスに描かれた要素を DOM から引く境界。
 *
 * キャンバスの中身はコンパイル結果の HTML を流し込んでおり React の管理下に無いため、
 * ref では掴めず名前の属性を選択子にして引くしかない。引き方はどこでも同じなので、
 * 名前で要素を引く選択子の綴りと、DOM を触るところをここへ閉じ込める（実測の入口は
 * `DrawnBounds`、規則の差し込みは `NameStyleRule`）。
 *
 * 名前で引いて 1 つに定まるのは artboard とその配下のノードだけ。名前はドキュメント上で
 * 一意（docs/01-file-format.md「ノードの識別（name）」）でも、部品の中のノードは展開で
 * 名前を付け替えないので、インスタンスの数だけ同じ名前で描かれる。呼び出し側が渡すのは
 * 選択・掴み・落とし先などドキュメントの木で絞った名前で、部品の中のノードの名前は届かない。
 */
export const CanvasDom = {
  /**
   * その名前で描かれている要素すべてに当たる選択子。
   *
   * @param name 指したい artboard / ノードの名前
   * @returns 名前の属性に当たる属性選択子
   */
  selectorOf(name: string): string {
    return Css.attributeSelector(ElementNameAttribute, name);
  },

  /**
   * その名前で描かれている要素を引く。
   *
   * @param name 引きたい artboard / ノードの名前
   * @returns 描かれていればその要素。同じ名前が複数描かれていれば DOM の並びで最初のもの。
   *   描かれていなければ `none`
   */
  elementOf(name: string): Option<Element> {
    return Option.fromNullable(
      globalThis.document.querySelector(CanvasDom.selectorOf(name)),
    );
  },
} as const;
