import type { Node, Props } from "@/domains/node";

export type Artboard = Readonly<{
  name: string;
  width: number;
  height: number;
  props?: Props;
  children: readonly Node[];
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
} as const;
