import {
  Component,
  ComponentSet,
  type PublicPropBinding,
} from "@/domains/dcmp/component";
import { Node, type PrimitiveNode, type RefNode } from "@/domains/dcmp/node";
import {
  PrimitiveSchema,
  type PropDefinition,
} from "@/domains/dcmp/primitive-schema";
import { Option } from "@/utils/Option";
import { RecordEx } from "@/utils/RecordEx";

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
 * binding が指している先の prop が見つからない理由。
 *
 * どれも binding が属する部品の側の不整合で、指し先のノード名・prop 名は binding 自身が
 * 持っている。
 */
export type BindingViolation =
  /** binding の指すノードが部品の中に無い。 */
  | Readonly<{ kind: "missing-node" }>
  /** 指し先のプリミティブのスキーマに、その prop が無い。 */
  | Readonly<{ kind: "missing-prop" }>
  /** 指し先の部品インスタンスの参照先（`ref`）が、その prop を公開していない。 */
  | Readonly<{ kind: "missing-public-prop"; ref: string }>;

/**
 * binding を 1 段辿った結果。`resolvePropDefinition` と `violation` が同じ辿りを使うこと
 * で、「解決できたのに違反がある」「解決できないのに違反が無い」の食い違いを作らない。
 */
type BindingHop =
  /**
   * binding の不整合ではない理由で辿れない。部品が一式に無い、指し先の型が未知、指し先の
   * インスタンスの参照先の部品が無い、のどれか。後の 2 つは指し先のノードの側が
   * unknown-type / dangling-ref として報告する。
   */
  | Readonly<{ kind: "unresolvable" }>
  | BindingViolation
  /** 指し先のプリミティブの prop 定義に着いた。 */
  | Readonly<{ kind: "definition"; definition: PropDefinition }>
  /** 指し先が部品インスタンスで、その部品の binding へ続く。 */
  | Readonly<{ kind: "nested"; next: ComponentBinding }>;

/**
 * 指し先のプリミティブで、binding の prop の定義を引く。
 *
 * @param target binding の指し先のプリミティブ
 * @param prop binding が指す prop 名
 * @returns 定義があれば `definition`、型が未知なら `unresolvable`、スキーマにその prop が
 *   無ければ `missing-prop`
 */
function hopIntoPrimitive(target: PrimitiveNode, prop: string): BindingHop {
  const schema = PrimitiveSchema.forTypeName(target.type);
  if (!Option.isSome(schema)) {
    return { kind: "unresolvable" };
  }
  const definition = RecordEx.get<PropDefinition>(schema.value.props, prop);
  if (!Option.isSome(definition)) {
    return { kind: "missing-prop" };
  }
  return { kind: "definition", definition: definition.value };
}

/**
 * 指し先の部品インスタンスで、参照先の部品が同じ名前で公開している prop へ辿り直す
 * （インターフェースの連鎖）。
 *
 * @param components 引き先の部品一式
 * @param target binding の指し先の参照ノード
 * @param prop binding が指す prop 名。参照先では公開 prop 名として引く
 * @returns 参照先の binding へ続くなら `nested`、参照先の部品が無ければ `unresolvable`、
 *   参照先がその prop を公開していなければ `missing-public-prop`
 */
function hopIntoInstance(
  components: ComponentSet,
  target: RefNode,
  prop: string,
): BindingHop {
  const nested = ComponentSet.get(components, target.ref);
  if (!Option.isSome(nested)) {
    return { kind: "unresolvable" };
  }
  const binding = Component.binding(nested.value, prop);
  if (!Option.isSome(binding)) {
    return { kind: "missing-public-prop", ref: target.ref };
  }
  return {
    kind: "nested",
    next: ComponentBinding.create(target.ref, binding.value),
  };
}

/**
 * binding を 1 段だけ辿る。
 *
 * @param components 引き先の部品一式
 * @param source 辿る部品名と binding
 * @returns 部品が無ければ `unresolvable`、指し先のノードが無ければ `missing-node`。それ以外
 *   は指し先がプリミティブか部品インスタンスかで `hopIntoPrimitive` / `hopIntoInstance` の結果
 */
function hop(components: ComponentSet, source: ComponentBinding): BindingHop {
  const component = ComponentSet.get(components, source.componentName);
  if (!Option.isSome(component)) {
    return { kind: "unresolvable" };
  }
  const found = Component.findNode(
    component.value,
    source.componentName,
    source.binding.node,
  );
  if (!Option.isSome(found)) {
    return { kind: "missing-node" };
  }
  if (Node.isRef(found.value)) {
    return hopIntoInstance(components, found.value, source.binding.prop);
  }
  return hopIntoPrimitive(found.value, source.binding.prop);
}

/**
 * ref ノードの連鎖を辿って prop 定義に行き着く。
 * `visited` は辿った部品名で、循環参照に入ったときに打ち切るために持ち回る。
 *
 * @param components 引き先の部品一式
 * @param source 辿り始める部品名と binding
 * @param visited ここまでに辿った部品名（再訪したら打ち切る）
 * @returns 行き着いた prop 定義。連鎖が途切れた場合と循環に入った場合は `none`
 */
function resolveThroughRefs(
  components: ComponentSet,
  source: ComponentBinding,
  visited: ReadonlySet<string>,
): Option<PropDefinition> {
  const step = hop(components, source);
  switch (step.kind) {
    case "definition":
      return Option.some(step.definition);
    case "nested": {
      const nextName = step.next.componentName;
      if (visited.has(nextName)) {
        return Option.none;
      }
      return resolveThroughRefs(
        components,
        step.next,
        new Set(visited).add(nextName),
      );
    }
    case "unresolvable":
    case "missing-node":
    case "missing-prop":
    case "missing-public-prop":
      return Option.none;
  }
}

export const ComponentBinding = {
  /**
   * binding を、それが属する部品の名前と組にする。
   * `binding` 単体では解決先が決まらないので、解決に渡す値はこの形で作る。
   *
   * @param componentName binding が属する部品の名前（`components` のキー）
   * @param binding その部品の公開 prop の繋ぎ先
   * @returns 部品名と binding の組
   */
  create(componentName: string, binding: PublicPropBinding): ComponentBinding {
    return { componentName, binding };
  },

  /**
   * binding が最終的に指すプリミティブ prop の定義を解決する。
   * binding 先が ref ノードの場合は参照先部品の publicProps を辿る（インターフェースの連鎖）。
   * 解決できない理由のうち binding 自体の不整合は `violation` が返す（検証が報告する）。
   *
   * 連鎖の起点なので、循環検出の初期状態（起点の部品名）をここで作る。
   *
   * @param components 引き先の部品一式
   * @param source 解決を始める部品名と binding
   * @returns 行き着いたプリミティブ prop の定義。部品・binding 先のノードが無いとき、
   *   binding 先のノードの型が未知かその prop がスキーマに無いとき、連鎖の途中の部品が
   *   無いかその prop を公開していないとき、連鎖が循環したときは `none`
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

  /**
   * binding の指し先に、binding が指す prop があるか。見るのは 1 段だけで、指し先が部品
   * インスタンスなら、参照先の部品がその prop を公開しているかまでを見る（その先の binding
   * は参照先の部品の検査が見る）。
   *
   * @param components 引き先の部品一式
   * @param source 検査する部品名と binding
   * @returns 指し先の prop が見つからなければその理由。見つかったときと、binding の不整合では
   *   ない理由で辿れないとき（部品が一式に無い・指し先の型が未知・指し先のインスタンスの参照先
   *   の部品が無い）は `none`
   */
  violation(
    components: ComponentSet,
    source: ComponentBinding,
  ): Option<BindingViolation> {
    const step = hop(components, source);
    switch (step.kind) {
      case "missing-node":
      case "missing-prop":
      case "missing-public-prop":
        return Option.some(step);
      case "unresolvable":
      case "definition":
      case "nested":
        return Option.none;
    }
  },
} as const;
