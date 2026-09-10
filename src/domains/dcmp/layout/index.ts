import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import { type CssDirection, CssDirections } from "@/domains/dcmp/css-direction";
import type { Props } from "@/domains/dcmp/node";
import type { ValueOf } from "@/types/ValueOf";
import { Option } from "@/utils/Option";

/**
 * Box が子をどう置くかを名前で指すための対応表（docs/03「Box」）。
 * Figma の `layoutMode`（`NONE` / `HORIZONTAL` / `VERTICAL`）にあたる。
 *
 * 並びが `row` / `column` / `free` なのは、パネルのセグメントがこの順で出るため。
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
   * 語彙に無い綴りを `Option` の不在にしない（`Placement.fromProps` / `Size.create` は
   * 不在にする）のは、それらが**書いた値が使えない**ときに描画から落ちるのに対し、配置
   * モードは落ちると箱の中身が並ばなくなるため。代償として、`layout` の綴りが不正な親の
   * 下では**子の `fill` も既定の親の下にある**ものとして検証される（親の
   * `enum-violation` を直せばやり直される）。
   *
   * @param props 読み取り元の props（デフォルト解決済みでなくてよい）
   * @returns 配置モード。未設定・語彙に無い綴りのときは既定（`Default`）（不
   *   正な値そのものは `DesignDocument.collectErrors` がエラー一覧に出す）
   */
  fromProps(props: Props): Layout {
    const value = props.layout;
    return (
      Object.values(Layouts).find((layout): boolean => layout === value) ??
      Layout.Default
    );
  },

  /**
   * その配置モードが子を並べる向き。
   *
   * コンパイル（`fill` と間隔・揃えの出し分け）とバリデーション（`free` の親の子は
   * `fill` を書けない）はどちらもここを引く。**スキーマの `enabledWhen` だけは
   * 別に綴っている**（`BoxSchema` の `FlexOnly`）ので、両者が一致することは
   * `__tests__/layout.schema.test.ts` が固定する。
   *
   * @param layout 向きを知りたい配置モード
   * @returns 子が並ぶ向き。`free` は子を並べないので `none`
   */
  direction(layout: Layout): Option<CssDirection> {
    return layout === Layouts.Free ? Option.none : Option.some(layout);
  },

  /**
   * 配置モードを CSS の宣言にする（docs/03「HTML/CSS へのコンパイル規則」）。
   *
   * `free` が空なのは、flex コンテナにしないため。絶対配置の子の基準になる
   * `position: relative` は `free` でも要るが、それは Box 自身の性質なので
   * `BoxElement` が出す。
   *
   * @param layout 宣言にする配置モード
   * @returns `display: flex` と `flex-direction` の 2 件。`free` なら空
   */
  declarations(layout: Layout): readonly CssDeclaration[] {
    const direction = Layout.direction(layout);
    if (!direction.some) {
      return [];
    }
    return [
      CssDeclaration.create("display", "flex"),
      CssDeclaration.create("flex-direction", direction.value),
    ];
  },
} as const;
