import { Json, type JsonRecord } from "@/utils/Json";
import { Option } from "@/utils/Option";
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
 * props 1 つ分の読み替え。軸の prop を 2 辺へ複製し、軸の prop 自身は落とす。
 *
 * 既に 4 方向の prop が書かれている辺は上書きしない。1.x のファイルに 4 方向の prop は
 * 無いが、手で書き足したファイルの値を軸側で潰さないため。
 *
 * @param props 読み替える前の props
 * @returns 軸の prop が 2 辺へ展開された props
 */
function withSidePaddingProps(props: JsonRecord): JsonRecord {
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
 * `props` と `children` を持つものと、その子孫を読み替える。
 * 対象は artboard・ノード・部品定義の 3 つで、artboard と部品定義も Box スキーマを
 * 流用して props を持つ（docs/03-schema.md）ため同じ形で写せる。
 *
 * @param value 読み替える前の値
 * @returns props と children が読み替えられた値。オブジェクトとして読めない値はそのまま
 */
function withSidePaddingSubtree(value: unknown): unknown {
  if (!Json.isRecord(value)) {
    return value;
  }
  const props = Json.isRecord(value.props)
    ? { props: withSidePaddingProps(value.props) }
    : {};
  const children = Array.isArray(value.children)
    ? { children: value.children.map(withSidePaddingSubtree) }
    : {};
  return { ...value, ...props, ...children };
}

/**
 * 公開 prop が軸の padding へ binding されている箇所の綴り。
 *
 * binding は 1 つの prop しか指せないので、軸を 2 辺へ複製すると
 * その公開 prop が効く範囲が半分になる。黙って意味を変えないため、
 * 見つけた時点で変換を失敗させる。
 *
 * Why not: binding だけを落として開かせる案は採らない。公開 prop が 1 つ静かに
 * 消えるだけになり、利用者が失ったことに気づけない。
 *
 * @param components 部品の辞書
 * @returns `<部品名>.<公開 prop 名>` の並び。該当する binding が無ければ空
 */
function axisBoundPublicPropLabels(components: JsonRecord): readonly string[] {
  const axisNames = AxisEntries.map(([axis]) => axis);
  return Object.entries(components).flatMap(([componentName, component]) => {
    if (!Json.isRecord(component) || !Json.isRecord(component.publicProps)) {
      return [];
    }
    return Object.entries(component.publicProps)
      .filter(
        ([, binding]) =>
          Json.isRecord(binding) &&
          typeof binding.prop === "string" &&
          axisNames.includes(binding.prop),
      )
      .map(([publicPropName]) => `${componentName}.${publicPropName}`);
  });
}

/**
 * 部品の辞書を丸ごと読み替える。
 *
 * @param components 部品の辞書
 * @returns 各部品を読み替えた辞書
 */
function withSidePaddingComponents(components: JsonRecord): JsonRecord {
  return Object.fromEntries(
    Object.entries(components).map(([name, component]) => [
      name,
      withSidePaddingSubtree(component),
    ]),
  );
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
  const components = Json.isRecord(document.components)
    ? Option.some(document.components)
    : Option.none;

  const bound = components.some
    ? axisBoundPublicPropLabels(components.value)
    : [];
  if (bound.length > 0) {
    return Result.err(
      `public props bound to paddingX/paddingY cannot be split into four sides: ${bound.join(", ")}`,
    );
  }

  const migratedComponents = components.some
    ? { components: withSidePaddingComponents(components.value) }
    : {};
  const migratedArtboards = Array.isArray(document.artboards)
    ? { artboards: document.artboards.map(withSidePaddingSubtree) }
    : {};

  return Result.ok({
    ...document,
    ...migratedComponents,
    ...migratedArtboards,
  });
}
