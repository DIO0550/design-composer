import { Node, type Props } from "@/domains/node";
import { Option } from "@/utils/Option";

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

  publicPropNames(component: Component): readonly string[] {
    return Object.keys(component.publicProps ?? {});
  },

  binding(component: Component, name: string): Option<PublicPropBinding> {
    return Option.fromNullable(component.publicProps?.[name]);
  },

  /**
   * 部品のルートをノードとして表現する。
   * ルートの `name` は components の辞書キーが兼ねるため、外から名前を受け取る。
   */
  toNode(component: Component, name: string): Node {
    return {
      name,
      type: component.type,
      ...(component.props !== undefined ? { props: component.props } : {}),
      ...(component.children !== undefined
        ? { children: component.children }
        : {}),
    };
  },

  /** ルートを含む部品内部のノードを名前で探す。 */
  findNode(
    component: Component,
    componentName: string,
    nodeName: string,
  ): Option<Node> {
    return Node.find(Component.toNode(component, componentName), nodeName);
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

function directRefs(components: ComponentSet, name: string): readonly string[] {
  const component = components[name];
  if (component === undefined) {
    return [];
  }
  return (component.children ?? []).flatMap(Node.collectRefs);
}

function reachableRefs(
  components: ComponentSet,
  start: string,
): ReadonlySet<string> {
  const reached = new Set<string>();
  const pending = [...directRefs(components, start)];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current !== undefined && !reached.has(current)) {
      reached.add(current);
      pending.push(...directRefs(components, current));
    }
  }
  return reached;
}

export const ComponentSet = {
  names(components: ComponentSet): readonly string[] {
    return Object.keys(components);
  },

  get(components: ComponentSet, name: string): Component | undefined {
    return components[name];
  },

  has(components: ComponentSet, name: string): boolean {
    return name in components;
  },

  /**
   * ref の展開が自分自身に到達する部品の名前を返す（自己参照・相互参照を含む）。
   */
  circularNames(components: ComponentSet): readonly string[] {
    return ComponentSet.names(components).filter((name) =>
      reachableRefs(components, name).has(name),
    );
  },
} as const;
