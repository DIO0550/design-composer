import type { AxisLength } from "@/domains/axis-length";
import { Node, type PropEdit, Props } from "@/domains/node";
import { NodeTree } from "@/domains/node-tree";
import {
  BoxSchema,
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
const ArtboardFields = [
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
const ArtboardPropDefaults: Props = { overflow: "clip" };

/**
 * artboard の props では変えられない prop
 * (docs/03「`widthMode` / `heightMode` は `fixed` に固定され、`width` / `height` が必須」)。
 * 長さは artboard 自身の `width` / `height` が持ち、`boxProps` がそれを固定値として与える。
 */
const ArtboardFixedSizeProps: readonly string[] = [
  "widthMode",
  "width",
  "heightMode",
  "height",
];

/**
 * Box の prop 定義を artboard 用のデフォルトで上書きしたもの。
 *
 * @param name 上書きするかどうかを引く prop 名
 * @param definition 元になる Box の prop 定義
 * @returns artboard 用の既定を持つ prop 定義。上書きが無ければ元のまま
 */
function withArtboardDefault(
  name: string,
  definition: PropDefinition,
): PropDefinition {
  const artboardDefault = ArtboardPropDefaults[name];
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

/**
 * 追加直後の artboard の大きさ。
 *
 * UI 案（docs/Design Composer.html）が描く artboard が 2 枚とも 720×900 で、
 * 既定の大きさを決めている材料はここしか無い（docs/ のどれにも既定値は無い）。
 */
const InitialSize = { width: 720, height: 900 } as const;

/** artboard の生成・大きさの読み出しと、JSON 表現との相互変換。 */
export const Artboard = {
  /**
   * 採番の元になる名前。識別子の規則（kebab-case）を満たす綴りで、
   * 衝突したときの連番は `DesignDocument.uniqueName` が付ける
   * （`NodeTemplate.baseName` / `TokenTemplate.baseName` と同じ扱い）。
   */
  BaseName: "artboard",

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
   * 追加直後の artboard（docs/06-ui.md「編集操作の一覧」の artboard 操作の追加）。
   *
   * 名前だけを受け取るのは、一意な名前が**どのドキュメントへ足すか**を見ないと
   * 決まらないため（採番は名前空間を持つ `DesignDocument` の担当）。大きさと
   * 空の子はこの型自身の性質なのでここが持つ。
   *
   * @param name 採番済みの名前
   * @returns 既定の大きさを持ち、子を持たない artboard
   */
  createInitial(name: string): Artboard {
    return Artboard.create({ name, ...InitialSize });
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
        ...ArtboardPropDefaults,
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
    const editable = Object.entries(BoxSchema.props).filter(
      ([name]) => !ArtboardFixedSizeProps.includes(name),
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
        ArtboardFields,
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
