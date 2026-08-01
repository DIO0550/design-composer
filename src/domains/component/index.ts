import { Node, Props, type PropValue } from "@/domains/node";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

export type PublicPropBinding = Readonly<{
  node: string;
  prop: string;
}>;

const BINDING_FIELDS = ["node", "prop"] as const;

/** 部品が JSON 上で持ちうるフィールド(docs/04-tokens.md「初期部品セット」の並び)。 */
const COMPONENT_FIELDS = ["publicProps", "type", "props", "children"] as const;

export const PublicPropBinding = {
  fromJson(cursor: JsonCursor): JsonDecoded<PublicPropBinding> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine2(
          Json.required(record, "node", Json.string),
          Json.required(record, "prop", Json.string),
          (node, prop) => ({ node, prop }),
        ),
        record,
        BINDING_FIELDS,
      ),
    );
  },

  toJson(binding: PublicPropBinding): JsonObject {
    return { node: binding.node, prop: binding.prop };
  },
} as const;

export type PublicProps = Readonly<Record<string, PublicPropBinding>>;

export type Component = Readonly<{
  type: string;
  props?: Props;
  children?: readonly Node[];
  publicProps?: PublicProps;
}>;

export type ComponentSet = Readonly<Record<string, Component>>;

function updateNodeByName(
  nodes: readonly Node[],
  name: string,
  update: (node: Node) => Node,
): readonly Node[] {
  return nodes.map((node) => {
    if (node.name === name) {
      return update(node);
    }
    const children = Node.children(node);
    if (children.length === 0) {
      return node;
    }
    return { ...node, children: updateNodeByName(children, name, update) };
  });
}

function applyBindingValue(node: Node, prop: string, value: PropValue): Node {
  if (Node.isRef(node)) {
    return { ...node, overrides: { ...node.overrides, [prop]: value } };
  }
  return { ...node, props: { ...node.props, [prop]: value } };
}

type ResolvedOverride = readonly [PublicPropBinding, PropValue];

function resolveOverrides(
  publicProps: PublicProps,
  overrides: Props,
): readonly ResolvedOverride[] {
  return Object.entries(overrides).flatMap(([propName, value]) => {
    const binding = publicProps[propName];
    return binding === undefined ? [] : [[binding, value] as ResolvedOverride];
  });
}

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
  /**
   * ノードを部品の中身にする（`toNode` の逆向き）。
   * 参照ノードは自身の実体を持たない（既に他の部品を指している）ので部品にできず `none`。
   */
  fromNode(node: Node): Option<Component> {
    if (!Node.isPrimitive(node)) {
      return Option.none;
    }
    return Option.some({
      type: node.type,
      ...(node.props !== undefined ? { props: node.props } : {}),
      ...(node.children !== undefined ? { children: node.children } : {}),
    });
  },

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

  /**
   * publicProps の binding に従って overrides を部品へ適用する。
   * binding 先は部品のルート（`name`）と内部ノードの両方を取り得る。
   * 宣言されていない overrides のキーは無視する（検証側で報告される）。
   */
  applyOverrides(
    component: Component,
    name: string,
    overrides: Props,
  ): Component {
    if (component.publicProps === undefined) {
      return component;
    }
    const resolved = resolveOverrides(component.publicProps, overrides);
    const toRoot = resolved.filter(([binding]) => binding.node === name);
    const toChildren = resolved.filter(([binding]) => binding.node !== name);
    return {
      ...component,
      props:
        toRoot.length === 0
          ? component.props
          : {
              ...component.props,
              ...Object.fromEntries(
                toRoot.map(([binding, value]) => [binding.prop, value]),
              ),
            },
      children:
        toChildren.length === 0
          ? component.children
          : toChildren.reduce(
              (children, [binding, value]) =>
                updateNodeByName(children, binding.node, (target) =>
                  applyBindingValue(target, binding.prop, value),
                ),
              component.children ?? [],
            ),
    };
  },

  /** ルートの `name` は辞書キーが兼ねるため、値側は `name` を持たない(docs/01-file-format.md)。 */
  fromJson(cursor: JsonCursor): JsonDecoded<Component> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine4(
          Json.optional(record, "publicProps", (publicProps) =>
            Json.mapOf(publicProps, PublicPropBinding.fromJson),
          ),
          Json.required(record, "type", Json.string),
          Json.optional(record, "props", Props.fromJson),
          Json.optional(record, "children", Node.fromJsonArray),
          (publicProps, type, props, children) => ({
            type,
            ...(props !== undefined ? { props } : {}),
            ...(children !== undefined ? { children } : {}),
            ...(publicProps !== undefined ? { publicProps } : {}),
          }),
        ),
        record,
        COMPONENT_FIELDS,
      ),
    );
  },

  /** 公開インターフェース(publicProps)を先に書く(docs/04-tokens.md の並び)。 */
  toJson(component: Component): JsonObject {
    return {
      ...Json.nonEmptyField(
        "publicProps",
        component.publicProps === undefined
          ? undefined
          : Json.sortedMap(component.publicProps, PublicPropBinding.toJson),
      ),
      type: component.type,
      ...Json.nonEmptyField(
        "props",
        component.props === undefined
          ? undefined
          : Props.toJson(component.props),
      ),
      ...Json.nonEmptyField("children", component.children?.map(Node.toJson)),
    };
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

  /** 部品名をキー、ノードを値とする辞書(docs/01-file-format.md「components」)。 */
  fromJson(cursor: JsonCursor): JsonDecoded<ComponentSet> {
    return Json.mapOf(cursor, Component.fromJson);
  },

  toJson(components: ComponentSet): JsonObject {
    return Json.sortedMap(components, Component.toJson);
  },
} as const;
