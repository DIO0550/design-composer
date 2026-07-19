import type { Node, Props } from "@/domains/node";

export type PublicPropBinding = Readonly<{
  node: string;
  prop: string;
}>;

export type PublicProps = Readonly<Record<string, PublicPropBinding>>;

export type Component = Readonly<{
  type: string;
  props?: Props;
  children?: readonly Node[];
  publicProps?: PublicProps;
}>;

export type ComponentSet = Readonly<Record<string, Component>>;

export const Component = {
  isPublicProp(component: Component, name: string): boolean {
    return component.publicProps !== undefined && name in component.publicProps;
  },

  renameBindings(
    publicProps: PublicProps,
    renameMap: Readonly<Record<string, string>>,
  ): PublicProps {
    return Object.fromEntries(
      Object.entries(publicProps).map(([propName, binding]) => {
        const newNode = renameMap[binding.node];
        return [
          propName,
          newNode === undefined ? binding : { ...binding, node: newNode },
        ];
      }),
    );
  },
} as const;

export const ComponentSet = {
  names(components: ComponentSet): readonly string[] {
    return Object.keys(components);
  },

  get(components: ComponentSet, name: string): Component | undefined {
    return components[name];
  },
} as const;
