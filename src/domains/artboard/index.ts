import { Node, Props } from "@/domains/node";
import { NodeTree } from "@/domains/node-tree";
import { ResolvedProps } from "@/domains/resolved-props";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
} from "@/utils/Json";
import type { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

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
        overflow: "clip",
        ...artboard.props,
      }),
      widthMode: "fixed",
      width: artboard.width,
      heightMode: "fixed",
      height: artboard.height,
    };
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
