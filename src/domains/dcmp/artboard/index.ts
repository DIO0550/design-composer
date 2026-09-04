import type { AxisLength } from "@/domains/dcmp/axis-length";
import { Node, type PropEdit, Props } from "@/domains/dcmp/node";
import { NodeTree } from "@/domains/dcmp/node-tree";
import {
  BoxSchema,
  type PropDefinition,
  type PropDefinitionRecord,
} from "@/domains/dcmp/primitive-schema";
import { ResolvedProps } from "@/domains/dcmp/resolved-props";
import type { Offset } from "@/domains/unit/offset";
import {
  Json,
  type JsonCursor,
  type JsonDecoded,
  type JsonObject,
  type JsonRecordCursor,
} from "@/utils/Json";
import type { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";

/**
 * キャンバスに置かれる 1 枚の画面。大きさを必ず持ち、配下にノードを並べる。
 *
 * `canvasPosition` は無限キャンバス上の位置で、指すのは**枠の左上**
 * (docs/01-file-format.md「artboards」)。省略できるのは、この版より前に書かれた
 * ドキュメントが座標を持たないため。持たないものをどこへ置くかは描く側が決める。
 */
export type Artboard = Readonly<{
  name: string;
  width: number;
  height: number;
  canvasPosition?: Offset;
  props?: Props;
  children: readonly Node[];
}>;

/** artboard が JSON 上で持ちうるフィールド(docs/01-file-format.md「artboards」)。 */
const ArtboardFields = [
  "name",
  "width",
  "height",
  "x",
  "y",
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
 * artboard の props では変えられない配置の prop。
 *
 * artboard は親 Box を持たないので、親からの相対で置かれる `placement: "absolute"`
 * を書いても意味が決まらない。追従（`constraintX` / `constraintY`）も、変化する親の
 * 長さが無いので同じく決まらない。artboard 自身のキャンバス上の位置は**別の座標系**で、
 * props ではなく `canvasPosition` が持つ。
 */
const ArtboardFixedPlacementProps: readonly string[] = [
  "placement",
  "x",
  "y",
  "constraintX",
  "constraintY",
];

/**
 * artboard の props では変えられない prop の全体。
 * 落とす理由が 2 通りあるので、定数を分けたまま結合する。
 */
const ArtboardUneditableProps: readonly string[] = [
  ...ArtboardFixedSizeProps,
  ...ArtboardFixedPlacementProps,
];

/**
 * キャンバス上の位置を `x` / `y` の対として読む。
 *
 * 片方だけを不在として通さないのは、位置が対でしか決まらないため
 * (`Offset` の doc)。`Json.optional` を 2 つ並べると「`x` だけがある」が
 * 読めてしまい、残りをどう埋めるかを呼び出し側が決めることになる。
 *
 * `Offset` 側に置かないのは、`x` / `y` という綴りで**フラットな兄弟フィールドに**
 * 書くのが `.dcmp` の artboard の都合であって、`Offset` の性質ではないため
 * (`unit/` は外部フォーマットを知らない層でもある)。
 *
 * @param record 読み取り元の artboard のフィールド一式
 * @returns 位置。`x` と `y` がどちらも無ければ不在を表す `undefined`。
 *   片方だけのとき・数値でないときは失敗
 */
function canvasPositionFromJson(
  record: JsonRecordCursor,
): JsonDecoded<Offset | undefined> {
  const axes = Json.combine2(
    Json.optional(record, "x", Json.number),
    Json.optional(record, "y", Json.number),
    (x, y) => ({ x, y }),
  );
  return Result.flatMap(axes, ({ x, y }) => {
    if (x === undefined && y === undefined) {
      return Result.ok(undefined);
    }
    const missing = x === undefined ? "x" : "y";
    if (x === undefined || y === undefined) {
      return Json.error(
        "missing-field",
        `${record.path}.${missing}`,
        `"${missing}" is required when the other axis is present`,
      );
    }
    return Result.ok({ x, y });
  });
}

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
    placement: "flow";
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
    canvasPosition?: Offset;
    props?: Props;
    children?: readonly Node[];
  }): Artboard {
    return {
      name: params.name,
      width: params.width,
      height: params.height,
      canvasPosition: params.canvasPosition,
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
   * Box スキーマと違う点は3つで、それぞれ効き方が異なる:
   * - `overflow` の既定が `clip`。**デフォルト**なので artboard 側の指定が勝つ
   * - サイズは `fixed` **固定**で、長さは artboard の `width` / `height`。props では変えられない
   * - 配置は `flow` **固定**。`propDefinitions()` から落としても、artboard の props を
   *   照らす先は Box スキーマなので（`design-document/validation`）ファイルには書けてしまう。
   *   ここで固定しないと、持っていない親からの相対で置かれた artboard が描かれる
   *   （キャンバス上の位置は `canvasPosition` が別に持つ）
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
      placement: "flow",
    };
  },

  /**
   * artboard が props として受け付ける prop の定義（docs/03「Box スキーマを流用する」）。
   * サイズ系と配置系を落とすのは、`boxProps` が固定値を与えるため、props に書いても
   * 効かないから（それぞれの理由は定数の doc）。
   */
  propDefinitions(): PropDefinitionRecord {
    const editable = Object.entries(BoxSchema.props).filter(
      ([name]) => !ArtboardUneditableProps.includes(name),
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

  /**
   * キャンバス上の位置を置き直した artboard。
   *
   * 書き込み先が props ではなく artboard 自身のフィールドなのは、キャンバス上の位置が
   * props の `placement` / `x` / `y`（親の中での置かれ方）とは**別の座標系**のため
   * (`ArtboardFixedPlacementProps` の doc)。
   *
   * 整数へ丸めるのは `Placement.moveBy`（ノード側の座標移動）と同じ理由による。
   *
   * @param artboard 置き直す元の artboard
   * @param canvasPosition 置き直したあとの位置。枠の左上を指す
   * @returns その位置を持つ artboard。座標は整数
   */
  withCanvasPosition(artboard: Artboard, canvasPosition: Offset): Artboard {
    return {
      ...artboard,
      canvasPosition: {
        x: Math.round(canvasPosition.x),
        y: Math.round(canvasPosition.y),
      },
    };
  },

  /** artboard の prop を書き換える。 */
  applyPropEdit(artboard: Artboard, edit: PropEdit): Artboard {
    return { ...artboard, props: Props.apply(artboard.props ?? {}, edit) };
  },

  fromJson(cursor: JsonCursor): JsonDecoded<Artboard> {
    return Result.flatMap(Json.record(cursor), (record) =>
      Json.knownFields(
        Json.combine6(
          Json.required(record, "name", Json.string),
          Json.required(record, "width", Json.number),
          Json.required(record, "height", Json.number),
          canvasPositionFromJson(record),
          Json.optional(record, "props", Props.fromJson),
          Json.required(record, "children", Node.fromJsonArray),
          (name, width, height, canvasPosition, props, children) => ({
            name,
            width,
            height,
            ...(canvasPosition !== undefined ? { canvasPosition } : {}),
            ...(props !== undefined ? { props } : {}),
            children,
          }),
        ),
        record,
        ArtboardFields,
      ),
    );
  },

  /**
   * `children` は必須フィールドなので空でも書き出す(docs/01-file-format.md)。
   * キャンバス上の位置は `x` / `y` の対で出し、持たないなら**どちらも出さない**
   * (既定値を書き出すと、置き場所を書いていないドキュメントと区別が付かなくなる)。
   */
  toJson(artboard: Artboard): JsonObject {
    const canvasPosition = artboard.canvasPosition;
    return {
      name: artboard.name,
      width: artboard.width,
      height: artboard.height,
      ...(canvasPosition !== undefined
        ? { x: canvasPosition.x, y: canvasPosition.y }
        : {}),
      ...Json.nonEmptyField(
        "props",
        artboard.props === undefined ? undefined : Props.toJson(artboard.props),
      ),
      children: artboard.children.map(Node.toJson),
    };
  },
} as const;
