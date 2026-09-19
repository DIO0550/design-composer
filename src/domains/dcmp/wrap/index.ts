import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import type { Props } from "@/domains/dcmp/node";
import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * 子が 1 行（列）に収まらないときに折り返すかどうかを名前で指すための対応表
 * （docs/03「Box」）。Figma の `layoutWrap` にあたる。
 *
 * 真偽値（`wrap: true` / `false`）にしない理由は `Visibilities`（`domains/dcmp/visibility`）
 * と同じ。
 *
 * UI 案（docs/Design Composer.html）の Layout 節は direction / gap / padding / align の 4 行
 * しか描いておらず、この prop を足すとパネルにそこへ無い行が 1 本増える。
 */
export const Wraps = {
  NoWrap: "nowrap",
  Wrap: "wrap",
} as const;

/** Box が子を折り返すかどうか。 */
export type Wrap = ValueOf<typeof Wraps>;

export const Wrap = {
  /**
   * 書かれていない Box に効く折り返し。
   * スキーマの `default` もここを引くので、既定の出どころは 1 つ。
   */
  Default: Wraps.NoWrap,

  /**
   * props から折り返しを読む。
   *
   * @param props 読み取り元の props（デフォルト解決済みでなくてよい）
   * @returns 折り返し。未設定・語彙に無い綴りのときは既定（`Default`）（不正な値そのもの
   *   は `DesignDocument.collectErrors` がエラー一覧に出す）
   */
  fromProps(props: Props): Wrap {
    return Option.unwrapOr(
      ArrayEx.findEqual(Object.values(Wraps), props.wrap),
      Wrap.Default,
    );
  },

  /**
   * 折り返しを CSS の宣言にする（docs/03「HTML/CSS へのコンパイル規則」）。
   *
   * 折り返す指定だけが宣言になるのは、CSS の初期値が折り返さない側だから。
   *
   * @param wrap 宣言にする折り返し
   * @returns 折り返すなら `flex-wrap` の 1 件。折り返さないなら空
   */
  declarations(wrap: Wrap): readonly CssDeclaration[] {
    return wrap === Wraps.Wrap
      ? [CssDeclaration.create("flex-wrap", "wrap")]
      : [];
  },
} as const;
