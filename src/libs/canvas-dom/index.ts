import { ElementNameAttribute } from "@/domains/compiled-element";
import { Css } from "@/utils/Css";
import { Option } from "@/utils/Option";

/**
 * キャンバスに描かれた要素を DOM から引く境界。
 *
 * キャンバスの中身はコンパイル結果の HTML を流し込んでおり React の管理下に無いため、
 * ref では掴めず名前の属性を選択子にして引くしかない。ドラッグ（移動）とリサイズの
 * 両方が同じ引き方をするので、DOM を触るところをここへ閉じ込める。
 */
export const CanvasDom = {
  /**
   * 名前で描かれている要素。名前はドキュメント全体で一意なので 1 つに決まる
   * （部品インスタンスの中身も展開時に自動リネームされる / docs/06-ui.md「解除」）。
   */
  elementOf(name: string): Option<Element> {
    return Option.fromNullable(
      globalThis.document.querySelector(
        `[${ElementNameAttribute}="${Css.escapeQuotedString(name)}"]`,
      ),
    );
  },
} as const;
