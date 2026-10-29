import { PropEdit, type Props } from "@/domains/dcmp/node";
import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * Box が交差軸のどこへ子を揃えるかを名前で指すための対応表（docs/03「Box」の `align`）。
 *
 * Text の `align` は同じ prop 名で別の語彙（文字の揃え）を持つので、名前に `Box` を付ける。
 */
export const BoxAligns = {
  Start: "start",
  Center: "center",
  End: "end",
  Stretch: "stretch",
} as const;

/** Box が交差軸のどこへ子を揃えるか。 */
export type BoxAlign = ValueOf<typeof BoxAligns>;

export const BoxAlign = {
  /**
   * 書かれていない Box に効く揃え。
   * スキーマの `default` もここを引くので、既定の出どころは 1 つ。
   */
  Default: BoxAligns.Stretch,

  /**
   * props から揃えを読む。
   *
   * @param props 読み取り元の props（デフォルト解決済みでなくてよい）
   * @returns 揃え。未設定・語彙に無い綴りのときは既定（`Default`）
   *   （不正な値そのものは `DesignDocument.collectErrors` がエラー一覧に出す）
   */
  fromProps(props: Props): BoxAlign {
    return Option.unwrapOr(
      ArrayEx.findEqual(Object.values(BoxAligns), props.align),
      BoxAlign.Default,
    );
  },

  /**
   * 揃えの指定が書かれていれば、別のノードへ同じ値で書く編集（複数のノードをまとめて包む
   * ときに、親の揃えを Box へ写す）。
   *
   * @param props 写し元の props（デフォルト解決済みでないもの）
   * @returns `align` が書かれていれば同じ値で設定する編集 1 件。書かれていなければ空
   */
  collectWrittenPropEdits(props: Props): readonly PropEdit[] {
    return PropEdit.collectWritten(props, ["align"]);
  },

  /**
   * 交差軸の長さを決めた子を、交差軸の始点に置く揃えか（docs/06-ui.md「リサイズハンドル」の
   * 辺のスナップ）。
   *
   * @param align 判定する揃え
   * @returns start / stretch なら `true`。center / end なら `false`
   */
  isStartForFixedChild(align: BoxAlign): boolean {
    return align === BoxAligns.Start || align === BoxAligns.Stretch;
  },
} as const;
