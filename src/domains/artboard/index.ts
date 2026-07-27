import type { Node, Props } from "@/domains/node";
import { ResolvedProps } from "@/domains/resolved-props";

export type Artboard = Readonly<{
  name: string;
  width: number;
  height: number;
  props?: Props;
  children: readonly Node[];
}>;

/**
 * artboard を Box として解決した props。
 * サイズが2軸とも `fixed` で長さが必ず存在することが構造に現れる
 * (artboard では「サイズが決まらない」状態を作れない)。
 */
export type ArtboardBoxProps = ResolvedProps<"Box"> &
  Readonly<{
    widthMode: "fixed";
    width: number;
    heightMode: "fixed";
    height: number;
  }>;

export const Artboard = {
  create(params: {
    name: string;
    width: number;
    height: number;
    props?: Props;
    children?: readonly Node[];
  }): Artboard {
    return {
      name: params.name,
      width: params.width,
      height: params.height,
      props: params.props,
      children: params.children ?? [],
    };
  },

  /**
   * artboard の props を Box の props として解決する
   * (docs/01「artboard は…ルートノード(Box)を兼ねる」/ docs/03「Box スキーマを流用する」)。
   *
   * Box スキーマと違う点は2つで、それぞれ効き方が異なる:
   * - `overflow` の既定が `clip`。**デフォルト**なので artboard 側の指定が勝つ
   * - サイズは `fixed` **固定**で、長さは artboard の `width` / `height`。props では変えられない
   */
  boxProps(artboard: Artboard): ArtboardBoxProps {
    return {
      ...ResolvedProps.resolve("Box", {
        overflow: "clip",
        ...artboard.props,
      }),
      widthMode: "fixed",
      width: artboard.width,
      heightMode: "fixed",
      height: artboard.height,
    };
  },
} as const;
