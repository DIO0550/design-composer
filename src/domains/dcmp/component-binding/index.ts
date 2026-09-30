import {
  Component,
  ComponentSet,
  type PublicPropBinding,
} from "@/domains/dcmp/component";
import {
  Node,
  type PrimitiveNode,
  type PropValue,
  type RefNode,
} from "@/domains/dcmp/node";
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
 * 公開 prop 1つを指す参照。部品名だけでも prop 名だけでも binding は引けないため対で持つ。
 */
export type PublicPropRef = Readonly<{
  component: string;
  prop: string;
}>;

/**
 * binding をたどった先にある prop。
 * `declared` は部品定義がそこに設定している値で、インスタンスが何も上書きしなければ
 * これが効く(スキーマのデフォルトではなく、この値が既定として見える)。
 */
export type PublicPropTarget = Readonly<{
  definition: PropDefinition;
  declared: Option<PropValue>;
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
 * binding を 1 段辿った結果。`resolvePropTarget` と `violation` が同じ辿りを使うこと
 * で、1 段目の判定（指し先のノード・型・prop・公開の有無）を 2 つの関数で食い違わせない。
 */
type BindingHop =
  /**
   * binding の不整合ではない理由で辿れない。部品が一式に無い、指し先の型が未知、指し先の
   * インスタンスの参照先の部品が無い、のどれか。後の 2 つは指し先のノードの側が
   * unknown-type / dangling-ref として報告する。
   */
  | Readonly<{ kind: "unresolvable" }>
  | BindingViolation
  /** 指し先のプリミティブの prop 定義と、そのプリミティブに設定されている値に着いた。 */
  | Readonly<{ kind: "definition"; target: PublicPropTarget }>
  /**
   * 指し先が部品インスタンスで、その部品の binding へ続く。`override` はそのインスタンスが
   * 公開 prop に書いている上書き。
   */
  | Readonly<{
      kind: "nested";
      next: ComponentBinding;
      override: Option<PropValue>;
    }>;

/**
 * 指し先のプリミティブで、binding の prop の定義と設定値を引く。
 *
 * @param primitive binding の指し先のプリミティブ
 * @param prop binding が指す prop 名
 * @returns 定義があれば `definition`（設定値はプリミティブの props のその prop）、型が未知
 *   なら `unresolvable`、スキーマにその prop が無ければ `missing-prop`
 */
function hopIntoPrimitive(primitive: PrimitiveNode, prop: string): BindingHop {
  if (!PrimitiveSchema.isPrimitiveType(primitive.type)) {
    return { kind: "unresolvable" };
  }
  const definition = PrimitiveSchema.propDefinition(primitive.type, prop);
  if (!Option.isSome(definition)) {
    return { kind: "missing-prop" };
  }
  return {
    kind: "definition",
    target: {
      definition: definition.value,
      declared: RecordEx.get(primitive.props ?? {}, prop),
    },
  };
}

/**
 * 指し先の部品インスタンスで、参照先の部品が同じ名前で公開している prop へ辿り直す
 * （インターフェースの連鎖）。
 *
 * @param components 引き先の部品一式
 * @param instance binding の指し先の参照ノード
 * @param prop binding が指す prop 名。参照先では公開 prop 名として引く
 * @returns 参照先の binding へ続くなら `nested`（上書きは `instance` の overrides のその prop）、
 *   参照先の部品が無ければ `unresolvable`、
 *   参照先がその prop を公開していなければ `missing-public-prop`
 */
function hopIntoInstance(
  components: ComponentSet,
  instance: RefNode,
  prop: string,
): BindingHop {
  const nested = ComponentSet.get(components, instance.ref);
  if (!Option.isSome(nested)) {
    return { kind: "unresolvable" };
  }
  const binding = Component.binding(nested.value, prop);
  if (!Option.isSome(binding)) {
    return { kind: "missing-public-prop", ref: instance.ref };
  }
  return {
    kind: "nested",
    next: ComponentBinding.create(instance.ref, binding.value),
    override: RecordEx.get(instance.overrides ?? {}, prop),
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
 * `resolvePropTarget` の本体。`visited` は辿った部品名で、循環参照に入ったときに打ち切る
 * ために持ち回る。
 *
 * @param components 引き先の部品一式
 * @param source 辿り始める部品名と binding
 * @param visited ここまでに辿った部品名（再訪したら打ち切る）
 * @returns 行き着いた prop 定義と設定値。連鎖が途切れた場合と循環に入った場合は `none`
 */
function resolveThroughRefs(
  components: ComponentSet,
  source: ComponentBinding,
  visited: ReadonlySet<string>,
): Option<PublicPropTarget> {
  const step = hop(components, source);
  switch (step.kind) {
    case "definition":
      return Option.some(step.target);
    case "nested": {
      const nextName = step.next.componentName;
      if (visited.has(nextName)) {
        return Option.none;
      }
      const inner = resolveThroughRefs(
        components,
        step.next,
        new Set(visited).add(nextName),
      );
      return Option.map(inner, (target) => ({
        ...target,
        declared: Option.or(step.override, target.declared),
      }));
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
   * binding が最終的に指すプリミティブ prop の定義と、そこに設定されている値を解決する。
   * binding 先が ref ノードの場合は参照先部品の publicProps を辿る（インターフェースの連鎖）。
   * 解決できない理由のうち binding 自体の不整合は `violation` が返す（検証が報告する）。
   *
   * 循環参照は検証エラーとして検出されるが、不正なドキュメントも画面には残る（docs/03
   * 「不正ファイル時の挙動」）ため、辿った部品へ戻った時点で打ち切って必ず停止させる。
   *
   * 上書きは内側から戻る結果に外側ほど後に被せるので、いちばん外側が勝つ。描画側の
   * `Component.applyOverrides` と同じ向きで、逆にするとパネルの既定値と描画が食い違う。
   *
   * @param components 引き先の部品一式
   * @param source 解決を始める部品名と binding
   * @returns 行き着いたプリミティブ prop の定義と、部品定義がそこに設定している値（途中の
   *   参照ノードが上書きしていれば、いちばん外側の上書き）。部品・binding 先のノードが無いとき、
   *   binding 先のノードの型が未知かその prop がスキーマに無いとき、連鎖の途中の部品が
   *   無いかその prop を公開していないとき、連鎖が辿った部品へ戻ったときは `none`
   */
  resolvePropTarget(
    components: ComponentSet,
    source: ComponentBinding,
  ): Option<PublicPropTarget> {
    return resolveThroughRefs(
      components,
      source,
      new Set([source.componentName]),
    );
  },

  /**
   * 公開 prop の binding を辿った先の prop 定義と設定値を解決する。辿り方と `none` になる
   * 条件は `resolvePropTarget` と同じ。
   *
   * @param components 引き先の部品一式
   * @param publicProp 解決を始める部品名と公開 prop 名
   * @returns `resolvePropTarget` の結果。部品が一式に無いか、その prop を公開していなければ
   *   `none`
   */
  resolvePublicPropTarget(
    components: ComponentSet,
    publicProp: PublicPropRef,
  ): Option<PublicPropTarget> {
    const component = ComponentSet.get(components, publicProp.component);
    if (!Option.isSome(component)) {
      return Option.none;
    }
    return Option.flatMap(
      Component.binding(component.value, publicProp.prop),
      (binding) =>
        ComponentBinding.resolvePropTarget(
          components,
          ComponentBinding.create(publicProp.component, binding),
        ),
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
