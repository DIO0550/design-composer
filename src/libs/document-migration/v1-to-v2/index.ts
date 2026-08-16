import type { JsonRecord } from "@/utils/Json";
import { Result } from "@/utils/Result";

/*
 * major 1 の 2 軸 padding から、major 2 の 4 方向 padding への読み替え
 * (docs/01-file-format.md「major の履歴」)。
 *
 * この変換はデコードより前、`DesignDocument.fromJson` が形を検証する前に走る。
 * したがって受け取る JSON は壊れていることがあり、形を仮定して走査すると例外になる。
 * 触れる形のところだけを写し、そうでない値はそのまま通す
 * （形の不備はデコード側が報告する。ここで二重に報告しない）。
 */

/** 1 軸の prop 名 → その軸が広がる 2 辺の prop 名。キーは 1.x のファイルにある綴り。 */
const AxisSides = {
  paddingX: ["paddingLeft", "paddingRight"],
  paddingY: ["paddingTop", "paddingBottom"],
} as const satisfies Readonly<Record<string, readonly [string, string]>>;

const AxisEntries = Object.entries(AxisSides);

/**
 * オブジェクトとして読めるか。配列と `null` は含めない。
 *
 * @param value 読み込んだ値
 * @returns オブジェクトとして扱えるなら true
 */
function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * props 1 つ分の読み替え。軸の prop を 2 辺へ複製し、軸の prop 自身は落とす。
 *
 * 既に 4 方向の prop が書かれている辺は上書きしない。1.x のファイルに 4 方向の prop は
 * 無いが、手で書き足したファイルの値を軸側で潰さないため。
 *
 * @param props 読み替える前の props
 * @returns 軸の prop が 2 辺へ展開された props
 */
function withSidePadding(props: JsonRecord): JsonRecord {
  return AxisEntries.reduce<JsonRecord>((current, [axis, sides]) => {
    if (!(axis in current)) {
      return current;
    }
    const { [axis]: axisValue, ...rest } = current;
    const added = Object.fromEntries(
      sides.filter((side) => !(side in rest)).map((side) => [side, axisValue]),
    );
    return { ...rest, ...added };
  }, props);
}

/**
 * ノードとその子孫の props を読み替える。
 * artboard も Box スキーマを流用して props と children を持つ（docs/03-schema.md）ので、
 * 同じ関数で写せる。
 *
 * @param node 読み替える前のノード
 * @returns props と children が読み替えられたノード。ノードとして読めない値はそのまま
 */
function withSidePaddingNode(node: unknown): unknown {
  if (!isRecord(node)) {
    return node;
  }
  const props = isRecord(node.props)
    ? { props: withSidePadding(node.props) }
    : {};
  const children = Array.isArray(node.children)
    ? { children: node.children.map(withSidePaddingNode) }
    : {};
  return { ...node, ...props, ...children };
}

/**
 * 公開 prop が軸の padding へ binding されている箇所。
 *
 * binding は 1 つの prop しか指せないので、軸を 2 辺へ複製すると
 * その公開 prop が効く範囲が半分になる。黙って意味を変えないため、
 * 見つけた時点で変換を失敗させる。
 *
 * @param components 部品の辞書として読める値
 * @returns `<部品名>.<公開 prop 名>` の並び。該当する binding が無ければ空
 */
function axisBoundPublicProps(components: JsonRecord): readonly string[] {
  const axisNames = AxisEntries.map(([axis]) => axis);
  return Object.entries(components).flatMap(([componentName, component]) => {
    if (!isRecord(component) || !isRecord(component.publicProps)) {
      return [];
    }
    return Object.entries(component.publicProps)
      .filter(
        ([, binding]) =>
          isRecord(binding) &&
          typeof binding.prop === "string" &&
          axisNames.includes(binding.prop),
      )
      .map(([publicPropName]) => `${componentName}.${publicPropName}`);
  });
}

/**
 * major 1 のドキュメントを major 2 の形へ写す。
 *
 * @param document 変換元の JSON のデータモデル
 * @returns padding が 4 方向になったドキュメント。公開 prop が軸の padding へ
 *   binding されている場合は、写すと意味が変わるため理由を持つ `err`
 */
export function migrateV1ToV2(
  document: JsonRecord,
): Result<JsonRecord, string> {
  const components = isRecord(document.components) ? document.components : {};
  const bound = axisBoundPublicProps(components);
  if (bound.length > 0) {
    return Result.err(
      `public props bound to paddingX/paddingY cannot be split into four sides: ${bound.join(", ")}`,
    );
  }

  const migratedComponents = isRecord(document.components)
    ? {
        components: Object.fromEntries(
          Object.entries(document.components).map(([name, component]) => [
            name,
            withSidePaddingNode(component),
          ]),
        ),
      }
    : {};
  const migratedArtboards = Array.isArray(document.artboards)
    ? { artboards: document.artboards.map(withSidePaddingNode) }
    : {};

  return Result.ok({
    ...document,
    ...migratedComponents,
    ...migratedArtboards,
  });
}
