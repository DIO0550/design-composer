import {
  Component,
  ComponentSet,
  type PublicPropBinding,
} from "@/domains/component";
import { Node } from "@/domains/node";
import {
  PrimitiveSchema,
  type PropDefinition,
} from "@/domains/primitive-schema";
import { Option } from "@/utils/Option";

/**
 * どの部品のどの binding かを指す組。
 * binding は所属する部品と対でしか意味を持たない（同じ prop 名でも部品が違えば
 * 指す先が違う）ため、常に一緒に動く2つを1つの型にまとめる。
 */
export type ComponentBinding = Readonly<{
  componentName: string;
  binding: PublicPropBinding;
}>;

/**
 * ref ノードの連鎖（インターフェースの連鎖）を1段辿った先の binding。
 * 辿れない場合は連鎖がそこで途切れている。
 */
function next(
  components: ComponentSet,
  ref: string,
  prop: string,
): Option<ComponentBinding> {
  const nested = ComponentSet.get(components, ref);
  if (nested === undefined) {
    return Option.none;
  }
  const binding = Component.binding(nested, prop);
  if (!binding.some) {
    return Option.none;
  }
  return Option.some(ComponentBinding.create(ref, binding.value));
}

/**
 * ref ノードの連鎖を辿って prop 定義に行き着く。
 * `visited` は辿った部品名で、循環参照に入ったときに打ち切るために持ち回る。
 */
function resolveThroughRefs(
  components: ComponentSet,
  source: ComponentBinding,
  visited: ReadonlySet<string>,
): Option<PropDefinition> {
  const component = ComponentSet.get(components, source.componentName);
  if (component === undefined) {
    return Option.none;
  }
  const found = Component.findNode(
    component,
    source.componentName,
    source.binding.node,
  );
  if (!found.some) {
    return Option.none;
  }
  const target = found.value;
  if (Node.isPrimitive(target)) {
    if (!PrimitiveSchema.isPrimitiveType(target.type)) {
      return Option.none;
    }
    const schema: PrimitiveSchema = PrimitiveSchema.forType(target.type);
    return Option.fromNullable(schema.props[source.binding.prop]);
  }
  if (visited.has(target.ref)) {
    return Option.none;
  }
  const nested = next(components, target.ref, source.binding.prop);
  if (!nested.some) {
    return Option.none;
  }
  return resolveThroughRefs(
    components,
    nested.value,
    new Set(visited).add(target.ref),
  );
}

export const ComponentBinding = {
  /**
   * binding を、それが属する部品の名前と組にする。
   * `binding` 単体では解決先が決まらないので、解決に渡す値はこの形で作る。
   */
  create(componentName: string, binding: PublicPropBinding): ComponentBinding {
    return { componentName, binding };
  },

  /**
   * binding が最終的に指すプリミティブ prop の定義を解決する。
   * binding 先が ref ノードの場合は参照先部品の publicProps を辿る（インターフェースの連鎖）。
   * 解決できない場合は binding 自体が不整合であり、binding 検証側で報告される。
   *
   * 連鎖の起点なので、循環検出の初期状態（起点の部品名）をここで作る。
   */
  resolvePropDefinition(
    components: ComponentSet,
    source: ComponentBinding,
  ): Option<PropDefinition> {
    return resolveThroughRefs(
      components,
      source,
      new Set([source.componentName]),
    );
  },
} as const;
