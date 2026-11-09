import {
  Component,
  ComponentSet,
  type PublicPropBinding,
} from "@/domains/dcmp/component";
import {
  Node,
  type PrimitiveNode,
  type Props,
  type PropValue,
  type RefNode,
} from "@/domains/dcmp/node";
import {
  PrimitiveSchema,
  type PropDefinition,
} from "@/domains/dcmp/primitive-schema";
import { ArrayEx } from "@/utils/ArrayEx";
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
 * インスタンスの公開 prop 1 つを辿って着いた先。
 *
 * `name` は公開名、`target.declared` はインスタンスの上書きを当てる前の値、`node` は
 * インスタンスの上書きまで当てた binding 先のプリミティブ。`path` は各段の binding 先の
 * ノード名を外側から並べたもの、`prop` は着いたノードの prop 名。
 */
export type InstancePropTarget = Readonly<{
  name: string;
  target: PublicPropTarget;
  node: PrimitiveNode;
  path: readonly string[];
  prop: string;
}>;

/** binding を最後まで辿って着いた先。どの公開 prop から辿ったかは持たない。 */
type ReachedProp = Omit<InstancePropTarget, "name">;

/**
 * 1 段の部品へ当てる上書き。`declared` は部品定義と途中の参照ノードの上書きだけ、`applied`
 * はそれにインスタンスの上書きを足したもの。
 */
type HopOverrides = Readonly<{ declared: Props; applied: Props }>;

/**
 * 1 段で binding 先に見つけたノード。`node` は `HopOverrides.applied` を当てた部品のノード、
 * `declared` は `HopOverrides.declared` を当てた部品で同じ名前のノードに書かれている値。
 */
type HopNode<N extends Node> = Readonly<{ node: N; declared: Props }>;

/**
 * binding が指し先の prop に繋がらない理由（指し先の prop が見つからない、または繋げない prop を
 * 指している）。
 *
 * どれも binding が属する部品の側の不整合で、指し先のノード名・prop 名は binding 自身が
 * 持っている。
 */
export type BindingViolation =
  /** binding の指すノードが部品の中に無い。 */
  | Readonly<{ kind: "missing-node" }>
  /** 指し先のプリミティブのスキーマに、その prop が無い。 */
  | Readonly<{ kind: "missing-prop" }>
  /** 指し先のプリミティブの prop が、公開 prop の繋ぎ先にできないもの（`locking`）。 */
  | Readonly<{ kind: "unbindable-prop" }>
  /** 指し先の部品インスタンスの参照先（`ref`）が、その prop を公開していない。 */
  | Readonly<{ kind: "missing-public-prop"; ref: string }>;

/**
 * binding を 1 段辿った結果。`resolvePropTarget`・`resolveInstancePropTargets` と `violation` が
 * 同じ辿りを使うことで、1 段目の判定（指し先のノード・型・prop・繋げる prop か・公開の有無）を
 * 関数どうしで食い違わせない。
 */
type BindingHop =
  /**
   * binding の不整合ではない理由で辿れない。部品が一式に無い、指し先の型が未知、指し先の
   * インスタンスの参照先の部品が無い、のどれか。後の 2 つは指し先のノードの側が
   * unknown-type / dangling-ref として報告する。
   */
  | Readonly<{ kind: "unresolvable" }>
  | BindingViolation
  /**
   * 指し先のプリミティブの prop 定義と、そのプリミティブに設定されている値に着いた。`node` は
   * 上書きを `applied` まで当てた指し先のプリミティブ。
   */
  | Readonly<{
      kind: "definition";
      target: PublicPropTarget;
      node: PrimitiveNode;
    }>
  /**
   * 指し先が部品インスタンスで、その部品の binding へ続く。`overrides` は次の段の部品へ当てる
   * 上書きで、指し先のインスタンスの overrides を 2 系統それぞれで読んだもの。
   */
  | Readonly<{
      kind: "nested";
      next: ComponentBinding;
      overrides: HopOverrides;
    }>;

/**
 * 公開 prop の繋ぎ先にできないプリミティブの prop（繋げない理由は docs/03「ロック」）。
 *
 * `RefOwnPropNames` からは導出しない（あちらは「インスタンス自身の値」として集めた別の一覧）。
 */
const UnbindablePropNames: readonly string[] = ["locking"];

/** 上書きを何も当てない辿り。 */
const NoOverrides: HopOverrides = { declared: {}, applied: {} };

/**
 * 公開 prop の上書きが書き込まれる先の値（`Node.applyPropEdit` と同じ振り分け）。
 *
 * @param node 見るノード
 * @returns 参照ノードなら `overrides`、プリミティブなら `props`。無ければ空
 */
function writtenValuesOf(node: Node): Props {
  return Node.isRef(node) ? (node.overrides ?? {}) : (node.props ?? {});
}

/**
 * 指し先のプリミティブで、binding の prop の定義と設定値を引く。
 *
 * @param primitive binding の指し先のプリミティブ
 * @param prop binding が指す prop 名
 * @returns 定義があり繋げる prop なら `definition`（設定値は `primitive.declared` のその
 *   prop）、型が未知なら `unresolvable`、スキーマにその prop が無ければ `missing-prop`、
 *   繋げない prop（`UnbindablePropNames`）なら `unbindable-prop`
 */
function hopIntoPrimitive(
  primitive: HopNode<PrimitiveNode>,
  prop: string,
): BindingHop {
  if (!PrimitiveSchema.isPrimitiveType(primitive.node.type)) {
    return { kind: "unresolvable" };
  }

  const definition = PrimitiveSchema.propDefinition(primitive.node.type, prop);
  if (!Option.isSome(definition)) {
    return { kind: "missing-prop" };
  }

  if (UnbindablePropNames.includes(prop)) {
    return { kind: "unbindable-prop" };
  }

  return {
    kind: "definition",
    target: {
      definition: definition.value,
      declared: RecordEx.get(primitive.declared, prop),
    },
    node: primitive.node,
  };
}

/**
 * 指し先の部品インスタンスで、参照先の部品が同じ名前で公開している prop へ辿り直す
 * （インターフェースの連鎖）。
 *
 * @param components 引き先の部品一式
 * @param instance binding の指し先の参照ノード
 * @param prop binding が指す prop 名。参照先では公開 prop 名として引く
 * @returns 参照先の binding へ続くなら `nested`（次の段へ当てる上書きは、`declared` 側が
 *   `instance.declared`、`applied` 側が `instance.node` の overrides）、
 *   参照先の部品が無ければ `unresolvable`、
 *   参照先がその prop を公開していなければ `missing-public-prop`
 */
function hopIntoInstance(
  components: ComponentSet,
  instance: HopNode<RefNode>,
  prop: string,
): BindingHop {
  const ref = instance.node.ref;
  const nested = ComponentSet.get(components, ref);
  if (!Option.isSome(nested)) {
    return { kind: "unresolvable" };
  }
  const binding = Component.binding(nested.value, prop);
  if (!Option.isSome(binding)) {
    return { kind: "missing-public-prop", ref };
  }
  return {
    kind: "nested",
    next: ComponentBinding.create(ref, binding.value),
    overrides: {
      declared: instance.declared,
      applied: instance.node.overrides ?? {},
    },
  };
}

/**
 * binding を 1 段だけ辿る。部品へ上書きを `Component.applyOverrides` で当ててから指し先の
 * ノードを引くので、描画と同じ値を読む。
 *
 * @param components 引き先の部品一式
 * @param source 辿る部品名と binding
 * @param overrides この段の部品へ当てる上書き
 * @returns 部品が無ければ `unresolvable`、指し先のノードが無ければ `missing-node`。それ以外
 *   は指し先がプリミティブか部品インスタンスかで `hopIntoPrimitive` / `hopIntoInstance` の結果
 */
function hop(
  components: ComponentSet,
  source: ComponentBinding,
  overrides: HopOverrides,
): BindingHop {
  const component = ComponentSet.get(components, source.componentName);
  if (!Option.isSome(component)) {
    return { kind: "unresolvable" };
  }
  const findIn = (applying: Props): Option<Node> =>
    Component.findNode(
      Component.applyOverrides(component.value, source.componentName, applying),
      source.componentName,
      source.binding.node,
    );
  const found = findIn(overrides.applied);
  const declared = findIn(overrides.declared);
  if (!Option.isSome(found) || !Option.isSome(declared)) {
    return { kind: "missing-node" };
  }
  const node = found.value;
  const declaredValues = writtenValuesOf(declared.value);
  if (Node.isRef(node)) {
    return hopIntoInstance(
      components,
      { node, declared: declaredValues },
      source.binding.prop,
    );
  }
  return hopIntoPrimitive(
    { node, declared: declaredValues },
    source.binding.prop,
  );
}

/**
 * `resolvePropTarget` と `resolveInstancePropTargets` の本体。各段で当てる上書きと、循環参照に
 * 入ったときに打ち切るための辿った部品名を持ち回る。
 *
 * @param components 引き先の部品一式
 * @param source 辿り始める部品名と binding
 * @param state `overrides` は `source` の部品へ当てる上書き、`visited` はここまでに辿った
 *   部品名（再訪したら打ち切る）
 * @returns 行き着いた prop 定義と設定値、上書きを当てた binding 先のプリミティブ、そこまでの
 *   ノード名の並びと prop 名。連鎖が途切れた場合と循環に入った場合は `none`
 */
function resolveThroughRefs(
  components: ComponentSet,
  source: ComponentBinding,
  state: Readonly<{ overrides: HopOverrides; visited: ReadonlySet<string> }>,
): Option<ReachedProp> {
  const step = hop(components, source, state.overrides);
  switch (step.kind) {
    case "definition":
      return Option.some({
        target: step.target,
        node: step.node,
        path: [source.binding.node],
        prop: source.binding.prop,
      });
    case "nested": {
      const nextName = step.next.componentName;
      if (state.visited.has(nextName)) {
        return Option.none;
      }
      const inner = resolveThroughRefs(components, step.next, {
        overrides: step.overrides,
        visited: new Set(state.visited).add(nextName),
      });
      return Option.map(inner, (reached) => ({
        ...reached,
        path: [source.binding.node, ...reached.path],
      }));
    }
    case "unresolvable":
    case "missing-node":
    case "missing-prop":
    case "unbindable-prop":
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
   * 途中の参照ノードの上書きは、各段の部品へ描画と同じ `Component.applyOverrides` で当てて
   * から次の段を引くので、いちばん外側が勝ち、パネルの既定値と描画が食い違わない。
   *
   * @param components 引き先の部品一式
   * @param source 解決を始める部品名と binding
   * @returns 行き着いたプリミティブ prop の定義と、部品定義がそこに設定している値（途中の
   *   参照ノードの上書きを当てた後の値）。部品・binding 先のノードが無いとき、
   *   binding 先のノードの型が未知か、その prop がスキーマに無いか繋げない prop（`locking`）
   *   のとき、連鎖の途中の部品が無いかその prop を公開していないとき、連鎖が辿った部品へ
   *   戻ったときは `none`
   */
  resolvePropTarget(
    components: ComponentSet,
    source: ComponentBinding,
  ): Option<PublicPropTarget> {
    return Option.map(
      resolveThroughRefs(components, source, {
        overrides: NoOverrides,
        visited: new Set([source.componentName]),
      }),
      (reached) => reached.target,
    );
  },

  /**
   * インスタンスの公開 prop を、インスタンスの上書きを当てながら binding 先まで辿る。辿り方と
   * 辿れなくなる条件は `resolvePropTarget` と同じ。
   *
   * @param components 引き先の部品一式
   * @param instance 公開 prop を辿りたい部品インスタンス
   * @returns 辿れた公開 prop ごとの着いた先。並びは部品の公開 prop の宣言順。辿れない公開 prop
   *   は含めず、参照先の部品が無ければ空
   */
  resolveInstancePropTargets(
    components: ComponentSet,
    instance: RefNode,
  ): readonly InstancePropTarget[] {
    const component = ComponentSet.get(components, instance.ref);
    if (!Option.isSome(component)) {
      return [];
    }
    const overrides: HopOverrides = {
      declared: {},
      applied: instance.overrides ?? {},
    };
    return ArrayEx.filterMap(
      Component.publicPropNames(component.value),
      (name) =>
        Option.map(
          Option.flatMap(Component.binding(component.value, name), (binding) =>
            resolveThroughRefs(
              components,
              ComponentBinding.create(instance.ref, binding),
              { overrides, visited: new Set([instance.ref]) },
            ),
          ),
          (reached) => ({ name, ...reached }),
        ),
    );
  },

  /**
   * 公開 prop の欄が出る条件（`enabledWhen`）を出している prop を、同じインスタンスの公開 prop
   * から探す。見るのは同じノードの prop だけ（docs/03-schema.md）。
   *
   * @param targets 同じインスタンスの公開 prop の着いた先（`resolveInstancePropTargets` の結果）
   * @param target 条件を知りたい公開 prop の着いた先
   * @returns `target` と同じノードの、条件の prop へ繋がる公開 prop の名前。`target` に条件が
   *   無いか、条件の prop を公開していなければ `none`
   */
  conditionPublicName(
    targets: readonly InstancePropTarget[],
    target: InstancePropTarget,
  ): Option<string> {
    const isSameNode = (candidate: InstancePropTarget): boolean =>
      candidate.path.length === target.path.length &&
      candidate.path.every((name, index) => name === target.path[index]);
    return Option.flatMap(
      Option.fromNullable(target.target.definition.enabledWhen),
      (condition) =>
        Option.map(
          Option.fromNullable(
            targets.find(
              (candidate) =>
                candidate.prop === condition.prop && isSameNode(candidate),
            ),
          ),
          (found) => found.name,
        ),
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
   * binding の指し先に、binding が指す prop があり、公開 prop の繋ぎ先にできるか。見るのは
   * 1 段だけで、指し先が部品インスタンスなら、参照先の部品がその prop を公開しているかまでを
   * 見る（その先の binding は参照先の部品の検査が見る）。
   *
   * @param components 引き先の部品一式
   * @param source 検査する部品名と binding
   * @returns 指し先の prop が見つからないか繋げない prop なら、その理由。繋げる prop が
   *   見つかったときと、binding の不整合ではない理由で辿れないとき（部品が一式に無い・指し先の
   *   型が未知・指し先のインスタンスの参照先の部品が無い）は `none`
   */
  violation(
    components: ComponentSet,
    source: ComponentBinding,
  ): Option<BindingViolation> {
    const step = hop(components, source, NoOverrides);
    switch (step.kind) {
      case "missing-node":
      case "missing-prop":
      case "unbindable-prop":
      case "missing-public-prop":
        return Option.some(step);
      case "unresolvable":
      case "definition":
      case "nested":
        return Option.none;
    }
  },
} as const;
