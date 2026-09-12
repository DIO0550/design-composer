import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import type { Props } from "@/domains/dcmp/node";
import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * ノードを描くかどうかを名前で指すための対応表（docs/03「表示 / 非表示」）。
 * Figma のレイヤーごとの表示 / 非表示にあたる。
 *
 * CSS にも同じ綴りのプロパティがあるが、こちらは場所を残さない（docs/03「表示 / 非表示」）。
 * それでもこの語彙を採るのは、`visible` / `hidden` がこの値を表す最も素直な 2 語だから。
 * 真偽値（`visible: true` / `false`）にはしない。パネルが全 prop で区別している「未設定
 * （既定が効く）」と「明示的に設定した値」を、チェックボックスでは表せない。
 */
export const Visibilities = {
  Visible: "visible",
  Hidden: "hidden",
} as const;

/** ノードを描くかどうか。 */
export type Visibility = ValueOf<typeof Visibilities>;

export const Visibility = {
  /**
   * 書かれていないノードに効く表示 / 非表示。
   * スキーマの `default` もここを引くので、既定の出どころは 1 つ。
   */
  Default: Visibilities.Visible,

  /**
   * props から表示 / 非表示を読む。
   *
   * @param props 読み取り元の props（デフォルト解決済みでなくてよい）
   * @returns 表示 / 非表示。未設定・語彙に無い綴りのときは既定（`Default`）
   *   （不正な値そのものは `DesignDocument.collectErrors` がエラー一覧に出す）
   */
  fromProps(props: Props): Visibility {
    return Option.unwrapOr(
      ArrayEx.findEqual(Object.values(Visibilities), props.visibility),
      Visibility.Default,
    );
  },

  /**
   * 表示 / 非表示を CSS の宣言にする（docs/03「HTML/CSS へのコンパイル規則」）。
   *
   * @param visibility 宣言にする表示 / 非表示
   * @returns 非表示なら `display: none` の 1 件。表示なら空
   */
  declarations(visibility: Visibility): readonly CssDeclaration[] {
    return visibility === Visibilities.Hidden
      ? [CssDeclaration.create("display", "none")]
      : [];
  },
} as const;
