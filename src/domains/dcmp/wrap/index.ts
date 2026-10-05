import { CssDeclaration } from "@/domains/dcmp/css-declaration";
import type { Props } from "@/domains/dcmp/node";
import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * Box が子を折り返すかを名前で指すための対応表（docs/03「Box」）。
 *
 * 値は CSS の `flex-wrap` の綴りをそのまま採る。パネルは enum の値をそのままセグメント
 * へ出すので、別の語彙にすると CSS への対応表が要る。
 */
export const Wraps = {
  NoWrap: "nowrap",
  Wrap: "wrap",
} as const;

/** Box が子を折り返すか。 */
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
   * @returns 折り返し。未設定・語彙に無い綴りのときは既定（`Default`）
   *   （不正な値そのものは `DesignDocument.collectErrors` がエラー一覧に出す）
   */
  fromProps(props: Props): Wrap {
    return Option.unwrapOr(
      ArrayEx.findEqual(Object.values(Wraps), props.wrap),
      Wrap.Default,
    );
  },

  /**
   * 子を折り返す側の値か。
   *
   * @param wrap 判定する折り返し
   * @returns 折り返すなら `true`。折り返さないなら `false`
   */
  isWrapping(wrap: Wrap): boolean {
    return wrap === Wraps.Wrap;
  },

  /**
   * 折り返しを CSS の宣言にする（docs/03「HTML/CSS へのコンパイル規則」）。
   * 初期値と同じ `nowrap` は宣言を出力しない（docs/03 の表は `wrap: wrap` の行だけを規定）。
   *
   * @param wrap 宣言にする折り返し
   * @returns 折り返すなら `flex-wrap: wrap` の 1 件。折り返さないなら空
   */
  declarations(wrap: Wrap): readonly CssDeclaration[] {
    return Wrap.isWrapping(wrap)
      ? [CssDeclaration.create("flex-wrap", wrap)]
      : [];
  },
} as const;
