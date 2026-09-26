import {
  Node,
  type PrimitiveNode,
  PropEdit,
  Props,
  type PropValue,
  type RefNode,
} from "@/domains/dcmp/node";
import {
  PrimitiveSchema,
  type PropDefinition,
} from "@/domains/dcmp/primitive-schema";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import { Option } from "@/utils/Option";
import { RecordEx } from "@/utils/RecordEx";
import { Result } from "@/utils/Result";

/** 公開 prop が、部品の内側のどのノードのどの prop に繋がっているか。 */
export type PublicPropBinding = Readonly<{
  node: string;
  prop: string;
}>;

const BindingFields = ["node", "prop"] as const;

/** 部品が JSON 上で持ちうるフィールド(docs/04-tokens.md「初期部品セット」の並び)。 */
const ComponentFields = ["publicProps", "type", "props", "children"] as const;

/** binding の JSON 表現との相互変換。 */
export const PublicPropBinding = {
  /**
   * JSON 上の binding を読む。
   *
   * @param cursor 読む値と、その位置
   * @returns 読めたら binding。オブジェクトでなければ `invalid-type`、`node` / `prop` が無ければ
   *   `missing-field`、文字列でなければ `invalid-type`、ほかのフィールドがあれば
   *   `unknown-field` の `err`（フィールドの失敗は 1 件で打ち切らずすべて集める）
   */
  fromJson(cursor: JsonCursor): JsonDecoded<PublicPropBinding> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine2(
          Json.required(record, "node", Json.string),
          Json.required(record, "prop", Json.string),
          (node, prop) => ({ node, prop }),
        ),
        record,
        BindingFields,
      ),
    );
  },

  /**
   * binding を JSON の値にする。
   *
   * @param binding 書き出す binding
   * @returns `node` と `prop` をこの順に持つオブジェクト
   */
  toJson(binding: PublicPropBinding): JsonObject {
    return { node: binding.node, prop: binding.prop };
  },
} as const;

/** 部品が外へ公開する prop 名と、その繋ぎ先。 */
export type PublicProps = Readonly<Record<string, PublicPropBinding>>;

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

/** 部品定義。インスタンスから参照され、展開されてキャンバスに描かれる。 */
export type Component = Readonly<{
  type: string;
  props?: Props;
  children?: readonly Node[];
  publicProps?: PublicProps;
}>;

/** ドキュメントが持つ部品定義の一覧。キーが部品名。 */
export type ComponentSet = Readonly<Record<string, Component>>;

/**
 * パレットに 1 件として並ぶ部品（UI 案 docs/Design Composer.html の `Assets`。ここでの
 * `Assets` はバイナリ資産ではなく**部品のパレット**を指す）。
 *
 * 1 件が答えるのは「どの部品を・何を差し替えられて・どれだけ使われているか」。
 * 名前だけでも、公開 prop だけでも、回数だけでも答えにならないため 3 つで 1 つの値にする。
 */
export type ComponentAsset = Readonly<{
  name: string;
  publicPropNames: readonly string[];
  refCount: number;
}>;

export const ComponentAsset = {
  /**
   * どこからも参照されていない部品か。
   *
   * @param asset パレットの 1 件
   * @returns 参照回数が 0 なら `true`（数え方は `ComponentSet.assets`）
   */
  isUnused(asset: ComponentAsset): boolean {
    return asset.refCount === 0;
  },
} as const;

/**
 * 名前の一致する 1 ノードだけを差し替えた木を返す。見つからなければそのまま。
 *
 * @param nodes 走査する木の根の並び
 * @param name 差し替える対象のノード名
 * @param update 見つかったノードを差し替える手続き
 * @returns 対象だけが差し替わった新しい木。見つからなければ元と同じ内容
 */
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

type ResolvedOverride = readonly [PublicPropBinding, PropValue];

/**
 * 上書きを binding と値の対に読み替える。公開されていない prop の上書きは捨てる。
 *
 * @param publicProps 参照先の部品が公開している prop の宣言
 * @param overrides インスタンスが設定している上書き
 * @returns 公開されている prop の分だけの、binding と値の対の並び
 */
function resolveOverrides(
  publicProps: PublicProps,
  overrides: Props,
): readonly ResolvedOverride[] {
  return Object.entries(overrides).flatMap(([propName, value]) => {
    const binding = RecordEx.get(publicProps, propName);
    return Option.isSome(binding)
      ? [[binding.value, value] as ResolvedOverride]
      : [];
  });
}

/** 部品定義の判定・展開・binding の解決と、JSON 表現との相互変換。 */
export const Component = {
  /**
   * その名前の prop を部品が外へ公開しているか。
   *
   * @param component 見る部品定義
   * @param name インスタンスから見た公開 prop 名
   * @returns `publicProps` にその名前が宣言されていれば `true`
   */
  isPublicProp(component: Component, name: string): boolean {
    return RecordEx.has(component.publicProps ?? {}, name);
  },

  /**
   * 部品が外へ公開している prop 名の一覧。
   *
   * @param component 見る部品定義
   * @returns `publicProps` の `Object.keys` の列挙順の並び。`publicProps` が無ければ空
   */
  publicPropNames(component: Component): readonly string[] {
    return Object.keys(component.publicProps ?? {});
  },

  /**
   * 公開 prop の繋ぎ先を引く。
   *
   * @param component 見る部品定義
   * @param name インスタンスから見た公開 prop 名
   * @returns その名前の binding。`publicProps` に宣言されていなければ `none`
   */
  binding(component: Component, name: string): Option<PublicPropBinding> {
    return RecordEx.get(component.publicProps ?? {}, name);
  },

  /**
   * 定義の中に直接置かれている参照ノードの参照先。
   * `Node.collectRefs` は参照ノードで止まるため、参照先の定義までは辿らない。
   *
   * @param component 見る部品定義
   * @returns 定義の中の参照ノードが指す部品名を、木の出現順に並べたもの。同じ部品を何度指して
   *   いればその回数だけ並ぶ。参照ノードが無ければ空
   */
  collectRefs(component: Component): readonly string[] {
    return (component.children ?? []).flatMap(Node.collectRefs);
  },

  /**
   * 部品のルートをノードとして表現する。
   * ルートの `name` は components の辞書キーが兼ねるため、外から名前を受け取る。
   *
   * @param component ノードにする部品定義
   * @param name その部品の名前（`components` のキー）。ルートノードの名前になる
   * @returns `name` を持ち、部品の `type` / `props` / `children` をそのまま持つプリミティブノード
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

  /**
   * ノードを部品の中身にする（`toNode` の逆向き）。
   * 参照ノードは自身の実体を持たない（既に他の部品を指している）ので部品にできず `none`。
   *
   * @param node 部品の中身にするノード
   * @returns ノードの `type` / `props` / `children` を持つ部品定義（ノードの名前は捨てる）。
   *   参照ノードなら `none`
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

  /**
   * ルートを含む部品内部のノードを名前で探す。
   *
   * @param component 探す先の部品定義
   * @param componentName その部品の名前（`components` のキー）。ルートの名前として扱う
   * @param nodeName 探すノードの名前
   * @returns `nodeName` が `componentName` と同じならルート、それ以外は深さ優先の行きがけ順で
   *   最初に見つかった内部ノード（名前が重複した不正なドキュメントでも先に見つかった方）。
   *   見つからなければ `none`
   */
  findNode(
    component: Component,
    componentName: string,
    nodeName: string,
  ): Option<Node> {
    return Node.find(Component.toNode(component, componentName), nodeName);
  },

  /**
   * publicProps の binding に従って overrides を部品へ適用する。binding 先は部品のルート
   * （`name`）と内部ノードの両方を取り得る。
   *
   * 宣言されていない overrides のキーは無視する（検証側で報告される）。
   *
   * @param component 上書きを適用する部品定義
   * @param name その部品の名前（`components` のキー）。binding の `node` がこれならルートを指す
   * @param overrides インスタンスが設定している上書き。キーは公開 prop 名
   * @returns binding 先の prop を上書きの値に差し替えた部品定義。binding 先が参照ノードなら
   *   その `overrides` に書き込む。binding 先のノードが無ければその上書きは捨て、名前が重複した
   *   不正なドキュメントでは同名のノードすべてに書き込む（書き込んだノードの子孫は除く）。
   *   `publicProps` が無ければ `component` そのもの
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
                  Node.applyPropEdit(
                    target,
                    PropEdit.set([binding.prop], value),
                  ),
                ),
              component.children ?? [],
            ),
    };
  },

  /**
   * JSON 上の部品定義を読む。
   *
   * ルートの `name` は辞書キーが兼ねるため、値側は `name` を持たない(docs/01-file-format.md)。
   *
   * @param cursor 読む値と、その位置
   * @returns 読めたら部品定義。オブジェクトでなければ `invalid-type`、`type` が無ければ
   *   `missing-field`、フィールドの型が違えば `invalid-type`、`name` を含むほかのフィールドが
   *   あれば `unknown-field` の `err`（1 件で打ち切らずすべて集める）
   */
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
            ...(Option.isSome(props) ? { props: props.value } : {}),
            ...(Option.isSome(children) ? { children: children.value } : {}),
            ...(Option.isSome(publicProps)
              ? { publicProps: publicProps.value }
              : {}),
          }),
        ),
        record,
        ComponentFields,
      ),
    );
  },

  /**
   * 部品定義を JSON の値にする。
   *
   * 公開インターフェース(publicProps)を先に書く(docs/04-tokens.md の並び)。
   *
   * @param component 書き出す部品定義
   * @returns `publicProps`（`Json.sortedMap` の並び）・`type`・`props`・`children` の順に持つ
   *   オブジェクト。未設定か空の `publicProps` / `props` / `children` は書き出さない
   */
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
} as const;

/**
 * 名前で引いた部品が直接持っている参照先。
 * 定義の無い名前（dangling）を辿ることがあるので、ここは不在がありうる
 * （不正な参照は検証エラーとして別に出る / docs/03「不正ファイル時の挙動」）。
 *
 * @param components 引き先の部品一式
 * @param name 参照先を知りたい部品名
 * @returns その部品が直接参照している部品名の並び。定義が無ければ空
 */
function directRefs(components: ComponentSet, name: string): readonly string[] {
  const component = RecordEx.get(components, name);
  return Option.isSome(component) ? Component.collectRefs(component.value) : [];
}

/**
 * その部品から参照をたどって到達できる部品名すべて（循環参照の判定に使う）。
 *
 * @param components 引き先の部品一式
 * @param start たどり始める部品名
 * @returns 到達できる部品名の集合（`start` 自身は輪になっているときだけ含む）
 */
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

/**
 * プリミティブノードが持つ prop の定義と、そのノードに設定されている値。
 *
 * @param node 引き先のプリミティブノード
 * @param prop 知りたい prop 名
 * @returns 宣言と設定値の対。型が未知、またはスキーマに無い prop なら `none`
 */
function targetInPrimitive(
  node: PrimitiveNode,
  prop: string,
): Option<PublicPropTarget> {
  if (!PrimitiveSchema.isPrimitiveType(node.type)) {
    return Option.none;
  }
  const schema: PrimitiveSchema = PrimitiveSchema.forType(node.type);
  const definition = RecordEx.get<PropDefinition>(schema.props, prop);
  if (!Option.isSome(definition)) {
    return Option.none;
  }
  return Option.some({
    definition: definition.value,
    declared: RecordEx.get(node.props ?? {}, prop),
  });
}

/**
 * binding 先が参照ノードのとき、相手の部品の公開 prop としてたどり直す。
 * 途中の参照ノードが値を上書きしていれば、そちらが既定として見える。
 *
 * @param components 引き先の部品一式
 * @param node binding 先になっている参照ノード
 * @param prop 知りたい prop 名
 * @param remainingHops あと何段たどれるか
 * @returns 宣言と設定値の対。たどり切れなければ `none`
 */
function targetThroughRef(
  components: ComponentSet,
  node: RefNode,
  prop: string,
  remainingHops: number,
): Option<PublicPropTarget> {
  const inner = publicPropTargetWithin(
    components,
    { component: node.ref, prop },
    remainingHops,
  );
  return Option.map(inner, (target) => {
    const override = RecordEx.get(node.overrides ?? {}, prop);
    return Option.isSome(override) ? { ...target, declared: override } : target;
  });
}

/**
 * 公開 prop の繋ぎ先を、入れ子の部品を越えてたどる。`remainingHops` が尽きたら `none`
 * （循環参照でも止まらなくなるのを防ぐため）。
 *
 * @param components 引き先の部品一式
 * @param ref たどり始める部品名と公開 prop 名
 * @param remainingHops あと何段たどれるか
 * @returns 宣言と設定値の対。部品・binding・指し先が無い場合と、
 *   段数が尽きた場合は `none`
 */
function publicPropTargetWithin(
  components: ComponentSet,
  ref: PublicPropRef,
  remainingHops: number,
): Option<PublicPropTarget> {
  if (remainingHops <= 0) {
    return Option.none;
  }
  const component = RecordEx.get(components, ref.component);
  if (!Option.isSome(component)) {
    return Option.none;
  }
  const binding = Component.binding(component.value, ref.prop);
  if (!Option.isSome(binding)) {
    return Option.none;
  }
  const target = Component.findNode(
    component.value,
    ref.component,
    binding.value.node,
  );
  if (!Option.isSome(target)) {
    return Option.none;
  }
  return Node.isRef(target.value)
    ? targetThroughRef(
        components,
        target.value,
        binding.value.prop,
        remainingHops - 1,
      )
    : targetInPrimitive(target.value, binding.value.prop);
}

/** 部品定義の一覧に対する引き当て・部品をまたぐ解決と、JSON 表現との相互変換。 */
export const ComponentSet = {
  /**
   * 定義されている部品名の一覧。
   *
   * @param components 見る部品一式
   * @returns 部品名を `Object.keys` の列挙順で並べたもの。部品名が
   *   `DocumentNames.isValidIdentifier` を満たす限り定義順になる(数字だけの名前は列挙で
   *   先頭へ並び替わる)
   */
  names(components: ComponentSet): readonly string[] {
    return Object.keys(components);
  },

  /**
   * 部品定義を名前で引く。
   *
   * @param components 引き先の部品一式
   * @param name 部品名（`components` のキー）
   * @returns その名前の部品定義。`components` 自身がその名前を持たなければ `none`
   *   （`constructor` のような `Object.prototype` 上の名前も `none`）
   */
  get(components: ComponentSet, name: string): Option<Component> {
    return RecordEx.get(components, name);
  },

  /**
   * その名前の部品が定義されているか。
   *
   * @param components 見る部品一式
   * @param name 部品名（`components` のキー）
   * @returns 定義されていれば `true`
   */
  has(components: ComponentSet, name: string): boolean {
    return RecordEx.has(components, name);
  },

  /**
   * 公開 prop が binding でどの prop に繋がっているかを解く。
   * 公開 prop の名前だけからは値の語彙が決まらない（enum なのかトークン参照なのかは
   * binding 先の宣言が持つ）ため、prop 定義まで辿って返す。
   *
   * binding 先が参照ノードなら相手の部品へ辿り直す。循環参照は検証エラーとして
   * 検出されるが、不正なドキュメントも画面には残る（docs/03「不正ファイル時の挙動」）
   * ため、部品数をホップ上限にして必ず停止させる。
   *
   * @param components 引き先の部品一式
   * @param ref たどり始める部品名と公開 prop 名
   * @returns binding 先の prop 定義と、部品定義がそこに設定している値（途中の参照ノードが上書き
   *   していればその値）。部品・binding・binding 先のノードが無いとき、binding 先のノードの型が
   *   未知かその prop がスキーマに無いとき、循環してホップ上限に達したときは `none`
   */
  publicPropTarget(
    components: ComponentSet,
    ref: PublicPropRef,
  ): Option<PublicPropTarget> {
    return publicPropTargetWithin(
      components,
      ref,
      ComponentSet.names(components).length,
    );
  },

  /**
   * パレットに並べる部品の一覧。並びは部品の定義順で、使われていない部品も必ず含む。
   *
   * 数えるのは `outsideNodes`（部品の外側にある木）にある参照ノードと、**部品定義の中に
   * ある参照ノードの両方**。部品 A が部品 B を含んでいれば B は使われているので、外側だ
   * けを見ると「どこからも使われていない」と読める部品が出てしまう。
   *
   * `Node.collectRefs` は参照ノードで止まるため、部品同士が循環していても各定義を 1 回ず
   * つ見るだけで終わる（定義の無い名前への参照はどの部品の数にも入らない）。
   *
   * @param components パレットに並べる部品一式
   * @param outsideNodes 部品の外側にある木の根の並び
   * @returns 部品 1 つにつき 1 件。参照回数には自分自身の定義の中の参照も入る
   */
  assets(
    components: ComponentSet,
    outsideNodes: readonly Node[],
  ): readonly ComponentAsset[] {
    const entries = Object.entries(components);
    const refsInComponents = entries.flatMap(([, component]) =>
      Component.collectRefs(component),
    );
    const refsOutside = outsideNodes.flatMap(Node.collectRefs);
    const refs = [...refsInComponents, ...refsOutside];

    return entries.map(([name, component]) => ({
      name,
      publicPropNames: Component.publicPropNames(component),
      refCount: refs.filter((ref) => ref === name).length,
    }));
  },

  /**
   * ref の展開が自分自身に到達する部品の名前を返す（自己参照・相互参照を含む）。
   *
   * @param components 見る部品一式
   * @returns 循環の輪に入っている部品名を `names` の順に並べたもの。輪を指しているだけで自分は
   *   輪に入っていない部品は含まない。循環が無ければ空
   */
  circularNames(components: ComponentSet): readonly string[] {
    return ComponentSet.names(components).filter((name) =>
      reachableRefs(components, name).has(name),
    );
  },

  /**
   * JSON 上の部品一式を読む。部品名をキー、ノードを値とする辞書(docs/01-file-format.md
   * 「components」)。
   *
   * @param cursor 読む値と、その位置
   * @returns 読めたら部品一式。オブジェクトでなければ `invalid-type` の `err`、部品ごとの失敗は
   *   `Component.fromJson` の条件で、1 件で打ち切らずすべて集めた `err`
   */
  fromJson(cursor: JsonCursor): JsonDecoded<ComponentSet> {
    return Json.mapOf(cursor, Component.fromJson);
  },

  /**
   * 部品一式を JSON の値にする。
   *
   * @param components 書き出す部品一式
   * @returns `Json.sortedMap` の並びで、値を `Component.toJson` で書き出したオブジェクト
   */
  toJson(components: ComponentSet): JsonObject {
    return Json.sortedMap(components, Component.toJson);
  },
} as const;
