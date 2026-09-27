import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import { type CssDirection, CssDirections } from "@/domains/dcmp/css-direction";
import type { Props } from "@/domains/dcmp/node";
import { Size } from "@/domains/dcmp/size";
import { Axes, type Axis } from "@/domains/unit/axis";
import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * Box が子をどう置くかを名前で指すための対応表（docs/03「Box」）。
 * Figma の `layoutMode`（`NONE` / `HORIZONTAL` / `VERTICAL`）にあたる。
 *
 * UI 案（docs/Design Composer.html）が描く 2 択の並びを保ったまま右端に 1 つ増える。
 */
export const Layouts = {
  ...CssDirections,
  Free: "free",
} as const;

/** Box の配置モード。子を並べる向きを持つか、持たない（`free`）かのどれか。 */
export type Layout = ValueOf<typeof Layouts>;

export const Layout = {
  /**
   * 書かれていない Box に効く配置モード。
   * スキーマの `default` もここを引くので、既定の出どころは 1 つ。
   */
  Default: Layouts.Column,

  /**
   * props から配置モードを読む。`layout` prop の綴りを知っているのはここだけで、消費側
   * は prop 名を持たない。
   *
   * 代償として、`layout` の綴りが不正な親の下では**子の `fill` も既定の親の下にある**もの
   * として検証される（親の `enum-violation` を直せばやり直される）。
   *
   * @param props 読み取り元の props（デフォルト解決済みでなくてよい）
   * @returns 配置モード。未設定・語彙に無い綴りのときは既定（`Default`）（不
   *   正な値そのものは `DesignDocument.collectErrors` がエラー一覧に出す）
   */
  fromProps(props: Props): Layout {
    return Option.unwrapOr(
      ArrayEx.findEqual(Object.values(Layouts), props.layout),
      Layout.Default,
    );
  },

  /**
   * その配置モードが子を並べる向き。
   *
   * @param layout 向きを知りたい配置モード
   * @returns 子が並ぶ向き。`free` は子を並べないので `none`
   */
  direction(layout: Layout): Option<CssDirection> {
    return layout === Layouts.Free ? Option.none : Option.some(layout);
  },

  /**
   * 子を並べない親の下で `fill` になっている軸（docs/03「サイズ指定の原則」。Figma と同じく
   * `fill` は子を並べる親の下でだけ意味を持つ）。
   *
   * スキーマの `enabledWhen` で閉じられないのは、条件が**親の** prop だから（docs/03
   * 「`enabledWhen` は単純な等値・不等値のみ」）。
   *
   * @param parentLayout その props を持つノードの親の配置モード
   * @param props 見るノードの props（デフォルト解決済みでなくてよい）
   * @returns `fill` になっている軸を width・height の順で。親が子を並べるときは空
   */
  collectFillAxesInFreeParent(
    parentLayout: Layout,
    props: Props,
  ): readonly Axis[] {
    if (Option.isSome(Layout.direction(parentLayout))) {
      return [];
    }
    return Object.values(Axes).filter(
      (axis) => Size.fromProps(props, axis)?.mode === "fill",
    );
  },

  /**
   * 配置モードを CSS の宣言にする（docs/03「HTML/CSS へのコンパイル規則」）。
   *
   * 絶対配置の子の基準になる `position: relative` は `free` でも要るが、それは Box 自身の性
   * 質なので `BoxElement` が出す。
   *
   * @param layout 宣言にする配置モード
   * @returns `display: flex` と `flex-direction` の 2 件。`free` なら空
   */
  declarations(layout: Layout): readonly CssDeclaration[] {
    const direction = Layout.direction(layout);
    if (!Option.isSome(direction)) {
      return [];
    }
    return [
      CssDeclaration.create("display", "flex"),
      CssDeclaration.create("flex-direction", direction.value),
    ];
  },
} as const;
