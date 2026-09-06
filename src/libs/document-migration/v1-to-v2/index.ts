import { Json, type JsonRecord } from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/** major 1 で Box の並ぶ向きを持っていた prop 名。 */
const OldProp = "direction";

/** major 2 でその向きを吸収した prop 名 (docs/03「Box」)。 */
const NewProp = "layout";

/**
 * `direction` を `layout` へ移した props。
 *
 * 既に `layout` があるときも `direction` の値を採るのは、major 1 に `layout` prop が
 * 無く、あれば未知の prop（読めば `unknown-prop` になっていた値）だったため。
 *
 * @param props 移し替える元の props
 * @returns `direction` を `layout` に置き換えた props。`direction` が無ければそのまま
 */
function propsWithLayout(props: JsonRecord): JsonRecord {
  if (!(OldProp in props)) {
    return props;
  }
  const { [OldProp]: direction, ...rest } = props;
  return { ...rest, [NewProp]: direction };
}

/**
 * ノード 1 つとその子孫の props を移し替える。
 * 部品インスタンス（`ref`）は `props` を持たないのでそのまま通る。
 *
 * @param node 移し替える元のノード
 * @returns props と子孫を移し替えたノード
 */
function nodeWithLayout(node: JsonRecord): JsonRecord {
  const props = Json.asRecord(node.props);
  const migratedProps = props.some
    ? { props: propsWithLayout(props.value) }
    : {};
  const children = Array.isArray(node.children)
    ? { children: node.children.map(valueWithLayout) }
    : {};
  return { ...node, ...migratedProps, ...children };
}

/**
 * オブジェクトならノードとして移し替え、それ以外は素通しする。
 * 形の検証はデコード側の担当なので、ここでは読めないものを落とさない。
 *
 * @param value 子として並んでいた値
 * @returns 移し替えた値。オブジェクトでなければそのまま
 */
function valueWithLayout(value: unknown): unknown {
  const node = Json.asRecord(value);
  return node.some ? nodeWithLayout(node.value) : value;
}

/**
 * 部品の中から名前でノードを引く。ルートは辞書のキーが名前を兼ねる
 * (docs/01-file-format.md「ノードの識別」)。
 *
 * @param component 探す先の部品（ルートノード）
 * @param componentName ルートノードの名前にあたる辞書のキー
 * @param name 探したいノードの名前
 * @returns 見つかったノード。無ければ `none`
 */
function findNode(
  component: JsonRecord,
  componentName: string,
  name: string,
): Option<JsonRecord> {
  if (componentName === name) {
    return Option.some(component);
  }
  const children = Array.isArray(component.children) ? component.children : [];
  for (const child of children) {
    const node = Json.asRecord(child);
    if (!node.some) {
      continue;
    }
    const found = findNode(node.value, String(node.value.name), name);
    if (found.some) {
      return found;
    }
  }
  return Option.none;
}

/**
 * 公開 prop の binding 1 件を移し替える。
 *
 * 指し先がプリミティブのときだけ移すのは、**`prop` が何の名前かが指し先で変わる**ため。
 * 参照ノードを指す binding の `prop` は入れ子の部品の公開 prop 名なので、作者が
 * `direction` と名付けただけの別物になる（`collectBindingTargetErrors` が同じ 2 通りで
 * 分岐している）。
 *
 * 判別子の綴り（`type` を持つ側がプリミティブ）はドメインの `Node.isPrimitive` と
 * 同じ事実をここでも書いている。デコード前の `JsonRecord` を扱うのでドメインの型は
 * 使えず、二重管理になる（片方を直したらもう片方も直す）。`ref` 側ではなく `type` 側で
 * 判定するので、どちらも持たない壊れたノードの binding は移さず `direction` のまま残り、
 * デコード後に `unknown-prop` として報告される。
 *
 * @param component binding を持つ部品
 * @param componentName ルートノードの名前にあたる辞書のキー
 * @param binding 移し替える元の binding
 * @returns 指し先がプリミティブで `direction` を指していれば `layout` へ移した binding。
 *   それ以外はそのまま
 */
function bindingWithLayout(
  component: JsonRecord,
  componentName: string,
  binding: JsonRecord,
): JsonRecord {
  if (binding.prop !== OldProp) {
    return binding;
  }
  const target = findNode(component, componentName, String(binding.node));
  const pointsAtPrimitive = target.some && "type" in target.value;
  return pointsAtPrimitive ? { ...binding, prop: NewProp } : binding;
}

/**
 * 部品の公開 prop の宣言をまとめて移し替える。
 *
 * @param component binding を持つ部品
 * @param componentName ルートノードの名前にあたる辞書のキー
 * @returns 移し替えた `publicProps`。持たない部品なら空
 */
function publicPropsWithLayout(
  component: JsonRecord,
  componentName: string,
): JsonRecord {
  const publicProps = Json.asRecord(component.publicProps);
  if (!publicProps.some) {
    return {};
  }
  const migrated = Object.entries(publicProps.value).map(([name, value]) => {
    const binding = Json.asRecord(value);
    return [
      name,
      binding.some
        ? bindingWithLayout(component, componentName, binding.value)
        : value,
    ] as const;
  });
  return { publicProps: Object.fromEntries(migrated) };
}

/**
 * 部品 1 件を移し替える。overrides のキーは触らない
 * （参照先が公開している prop 名であって、プリミティブの prop 名ではない）。
 *
 * @param componentName 辞書のキー（ルートノードの名前を兼ねる）
 * @param value 移し替える元の部品
 * @returns props・子孫・公開 prop の宣言を移し替えた部品。
 *   オブジェクトとして読めなければそのまま
 */
function componentWithLayout(componentName: string, value: unknown): unknown {
  const component = Json.asRecord(value);
  if (!component.some) {
    return value;
  }
  return {
    ...nodeWithLayout(component.value),
    ...publicPropsWithLayout(component.value, componentName),
  };
}

/**
 * major 1 のドキュメントを major 2 の形へ移す
 * (docs/01-file-format.md の版の表。`direction` が `layout` に吸収された)。
 *
 * 失敗を返さないのは、移すのがキーの綴りだけで、値が何であっても移し替えられるため。
 * 形の不備はこのあとのデコード（`DesignDocumentV2.fromJson`）が報告する。
 *
 * @param document 移す元の JSON のデータモデル
 * @returns `direction` を `layout` へ移したドキュメント
 */
export function migrateV1ToV2(
  document: JsonRecord,
): Result<JsonRecord, string> {
  const artboards = Array.isArray(document.artboards)
    ? { artboards: document.artboards.map(valueWithLayout) }
    : {};
  const components = Json.asRecord(document.components);
  const migratedComponents = components.some
    ? {
        components: Object.fromEntries(
          Object.entries(components.value).map(([name, value]) => [
            name,
            componentWithLayout(name, value),
          ]),
        ),
      }
    : {};
  return Result.ok({ ...document, ...artboards, ...migratedComponents });
}
