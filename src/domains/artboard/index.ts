import type { AxisLength } from "@/domains/axis-length";
import { Node, type PropEdit, Props } from "@/domains/node";
import { NodeTree } from "@/domains/node-tree";
import {
  BOX_SCHEMA,
  type PropDefinition,
  type PropDefinitionRecord,
} from "@/domains/primitive-schema";
import { ResolvedProps } from "@/domains/resolved-props";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import type { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/** キャンバスに置かれる 1 枚の画面。大きさを必ず持ち、配下にノードを並べる。 */
export type Artboard = Readonly<{
  name: string;
  width: number;
  height: number;
  props?: Props;
  children: readonly Node[];
}>;

/** artboard が JSON 上で持ちうるフィールド(docs/01-file-format.md「artboards」)。 */
const ARTBOARD_FIELDS = [
  "name",
  "width",
  "height",
  "props",
  "children",
] as const;

/**
 * Box スキーマのデフォルトのうち、artboard では違う値になるもの
 * (docs/03「artboard は…`overflow` のデフォルトは `clip`」)。
 * デフォルトなので artboard 側の指定が勝つ。
 */
const ARTBOARD_PROP_DEFAULTS: Props = { overflow: "clip" };

/**
 * artboard の props では変えられない prop
 * (docs/03「`widthMode` / `heightMode` は `fixed` に固定され、`width` / `height` が必須」)。
 * 長さは artboard 自身の `width` / `height` が持ち、`boxProps` がそれを固定値として与える。
 */
const ARTBOARD_FIXED_SIZE_PROPS: readonly string[] = [
  "widthMode",
  "width",
  "heightMode",
  "height",
];

/** Box の prop 定義を artboard 用のデフォルトで上書きしたもの。 */
function withArtboardDefault(
  name: string,
  definition: PropDefinition,
): PropDefinition {
  const artboardDefault = ARTBOARD_PROP_DEFAULTS[name];
  return artboardDefault === undefined
    ? definition
    : { ...definition, default: artboardDefault };
}

/**
 * artboard を Box として解決した props。
 * サイズが2軸とも `fixed` で長さが必ず存在することが構造に現れる
 * (artboard では「サイズが決まらない」状態を作れない)。
 */
export type ArtboardBoxProps = ResolvedProps<"Box"> &
  Readonly<{
    widthMode: "fixed";
    width: number;
    heightMode: "fixed";
    height: number;
  }>;

/** artboard の生成・大きさの読み出しと、JSON 表現との相互変換。 */
export const Artboard = {
  create(params: {
    name: string;
    width: number;
    height: number;
    props?: Props;
    children?: readonly Node[];
  }): Artboard {
    return {
      name: params.name,
      width: params.width,
      height: params.height,
      props: params.props,
      children: params.children ?? [],
    };
  },

  /**
   * 子の並びをツリーの一階層として見る。
   * 並びの探索・編集の規則は `NodeTree` が持つので、artboard は自分の並びを渡すだけ。
   */
  tree(artboard: Artboard): NodeTree {
    return NodeTree.create(artboard.children);
  },

  /** 子の並びを差し替えた artboard。 */
  withTree(artboard: Artboard, tree: NodeTree): Artboard {
    return { ...artboard, children: NodeTree.nodes(tree) };
  },

  /** 配下のノードを名前で探す。直下だけでなく子孫も辿る。 */
  findNode(artboard: Artboard, name: string): Option<Node> {
    return NodeTree.find(Artboard.tree(artboard), name);
  },

  /**
   * artboard の props を Box の props として解決する
   * (docs/01「artboard は…ルートノード(Box)を兼ねる」/ docs/03「Box スキーマを流用する」)。
   *
   * Box スキーマと違う点は2つで、それぞれ効き方が異なる:
   * - `overflow` の既定が `clip`。**デフォルト**なので artboard 側の指定が勝つ
   * - サイズは `fixed` **固定**で、長さは artboard の `width` / `height`。props では変えられない
   */
  boxProps(artboard: Artboard): ArtboardBoxProps {
    return {
      ...ResolvedProps.resolve("Box", {
        ...ARTBOARD_PROP_DEFAULTS,
        ...artboard.props,
      }),
      widthMode: "fixed",
      width: artboard.width,
      heightMode: "fixed",
      height: artboard.height,
    };
  },

  /**
   * artboard が props として受け付ける prop の定義（docs/03「Box スキーマを流用する」）。
   * サイズ系を落とすのは、`boxProps` が `fixed` と artboard の `width` / `height` を
   * 固定で与えるため、props に書いても効かないから。
   */
  propDefinitions(): PropDefinitionRecord {
    const editable = Object.entries(BOX_SCHEMA.props).filter(
      ([name]) => !ARTBOARD_FIXED_SIZE_PROPS.includes(name),
    );
    return Object.fromEntries(
      editable.map(([name, definition]) => [
        name,
        withArtboardDefault(name, definition),
      ]),
    );
  },

  /**
   * 軸方向の長さを変えた artboard。
   *
   * 書き込み先が props ではなく artboard 自身のフィールドなのは、artboard の
   * サイズが `fixed` 固定で長さを `width` / `height` が持つため
   * (docs/03「`widthMode` / `heightMode` は `fixed` に固定され、`width` / `height` が必須」)。
   * props へ書いても `boxProps` が固定値で上書きするので効かない。
   */
  resize(artboard: Artboard, size: AxisLength): Artboard {
    return { ...artboard, [size.axis]: size.length };
  },

  /** artboard の prop を書き換える。 */
  applyPropEdit(artboard: Artboard, edit: PropEdit): Artboard {
    return { ...artboard, props: Props.apply(artboard.props ?? {}, edit) };
  },

  fromJson(cursor: JsonCursor): JsonDecoded<Artboard> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine5(
          Json.required(record, "name", Json.string),
          Json.required(record, "width", Json.number),
          Json.required(record, "height", Json.number),
          Json.optional(record, "props", Props.fromJson),
          Json.required(record, "children", Node.fromJsonArray),
          (name, width, height, props, children) => ({
            name,
            width,
            height,
            ...(props !== undefined ? { props } : {}),
            children,
          }),
        ),
        record,
        ARTBOARD_FIELDS,
      ),
    );
  },

  /** `children` は必須フィールドなので空でも書き出す(docs/01-file-format.md)。 */
  toJson(artboard: Artboard): JsonObject {
    return {
      name: artboard.name,
      width: artboard.width,
      height: artboard.height,
      ...Json.nonEmptyField(
        "props",
        artboard.props === undefined ? undefined : Props.toJson(artboard.props),
      ),
      children: artboard.children.map(Node.toJson),
    };
  },
} as const;
