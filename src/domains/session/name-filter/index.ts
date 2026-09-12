import { Option } from "@/utils/Option";
import { StringEx } from "@/utils/StringEx";

/**
 * 名前で中身を絞り込む条件（docs/06-ui.md「絞り込み」）。
 *
 * 空の語は持たない。空は「絞っていない」であって「すべてに一致する条件」ではなく、
 * 値として通すと「全部に一致して全部残った」と「絞っていない」が同じ結果になり、
 * 1 つも残らなかったことを知らせるかどうかの分岐が作れなくなる。
 */
export type NameFilter = Readonly<{
  text: string;
}>;

/** 絞り込みの生成と判定。 */
export const NameFilter = {
  /**
   * 打たれた語から絞り込みを作る。
   *
   * @param text 検索欄に打たれた語
   * @returns 1 文字でもあればその絞り込み。空なら不在（絞っていない）
   */
  create(text: string): Option<NameFilter> {
    return text === "" ? Option.none : Option.some({ text });
  },

  /**
   * その名前が絞り込みに残るか。
   *
   * @param filter 当てる絞り込み
   * @param name 判定する名前
   * @returns 大文字小文字を区別せず、語を途中に含んでいれば true
   */
  isMatch(filter: NameFilter, name: string): boolean {
    return StringEx.includesIgnoreCase(name, filter.text);
  },
} as const;
