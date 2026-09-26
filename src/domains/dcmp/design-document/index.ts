import { Artboard } from "@/domains/dcmp/artboard";
import { AxisLength, AxisResize } from "@/domains/dcmp/axis-length";
import { ChildPlacement } from "@/domains/dcmp/child-placement";
import type { ChildPosition } from "@/domains/dcmp/child-position";
import {
  Component,
  type ComponentAsset,
  ComponentSet,
} from "@/domains/dcmp/component";
import { Constraint } from "@/domains/dcmp/constraint";
import { DocumentNames } from "@/domains/dcmp/document-names";
import { ExpandedNode } from "@/domains/dcmp/expanded-node";
import {
  FormatVersion,
  type FormatVersionCompatibility,
  type FormatVersionOf,
} from "@/domains/dcmp/format-version";
import { Node, type PropEdit, type RefNode } from "@/domains/dcmp/node";
import { NodeTree, type NodeTreeUpdate } from "@/domains/dcmp/node-tree";
import { Placement } from "@/domains/dcmp/placement";
import { PrimitiveTypes } from "@/domains/dcmp/primitive-schema";
import type { ResizeEdit } from "@/domains/dcmp/resize-edit";
import { ResolvedProps } from "@/domains/dcmp/resolved-props";
import { Size } from "@/domains/dcmp/size";
import { type Token, type TokenRef, TokenSet } from "@/domains/dcmp/token";
import { Axes, type Axis } from "@/domains/unit/axis";
import { Offset } from "@/domains/unit/offset";
import { ArrayEx } from "@/utils/ArrayEx";
import type { JsonCursor, JsonDecoded, JsonObject } from "@/utils/Json";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import type { DesignDocumentEditError } from "./edit-error";
import type { DocumentTemplate } from "./template";
import { TokenReferrer } from "./token-referrer";
import { DesignDocumentV1 } from "./v1";
import {
  collectArtboardErrors,
  collectCircularRefErrors,
  collectComponentErrors,
  collectDocumentNameErrors,
  type DesignDocumentValidationError,
  type ReferenceContext,
} from "./validation";

export { DesignDocumentEditError } from "./edit-error";
export { DocumentTemplate } from "./template";
export { TokenReferrer } from "./token-referrer";
export type { DesignDocumentV1 } from "./v1";
export type {
  DesignDocumentValidationError,
  DesignDocumentValidationErrorKind,
} from "./validation";

/**
 * アプリが読み書きするドキュメント。今は major 1 のみ。
 *
 * 版ごとの型と JSON 表現は版のフォルダ（`v1/`）が持つ。major を上げるときは隣に `v2/`
 * を作ってここを差し替え、旧版のフォルダは残す（旧版の型が残ることで、マイグレーション
 * が「どの形からどの形へ」を型で書ける）。
 */
export type DesignDocument = DesignDocumentV1;

/**
 * Box を外した結果（`DesignDocument.ungroupBox`）。
 *
 * 外したあとのドキュメントから「どれが親へ戻ったか」は引けない（戻った子は元からの兄弟と
 * 同じ並びに混ざる）ので、対で返す。呼び出し側が同じ導出をやり直すと、戻した子と選んだ子
 * が食い違う組み合わせを作れてしまう。
 */
export type UngroupedBox = Readonly<{
  document: DesignDocument;
  /** 親へ戻った子の名前。並びは Box の中にあった順のまま。 */
  freedNames: readonly string[];
}>;

/*
 * 以下の関数は「どの artboard を相手にするか」を選ぶためのもの。
 * 並びの探索・編集そのものは `NodeTree` が、名前の規則は `DocumentNames` が持っており、
 * ドキュメントに残るのは「複数の artboard のどれに対して行うか」という調停だけ。
 *
 * 例外は追従（`followPropEdits`）で、ここだけは `Placement` / `Constraint` / `Size` を
 * 組み合わせて編集を作る。子側のドメイン（`Node`）へ置けないのは、`Placement` が
 * `PropEdit` を `Node` から import しており、逆向きの import が循環になるため。
 */

/**
 * 名前で指したノードを持つ artboard を、その位置とともに返す。
 *
 * @param document 探す対象のドキュメント
 * @param name 探すノードの名前
 * @returns そのノードを含む artboard の位置。どの artboard にも無ければ `none`
 */
function artboardIndexOfNode(
  document: DesignDocument,
  name: string,
): Option<number> {
  const index = document.artboards.findIndex((artboard) =>
    Option.isSome(Artboard.findNode(artboard, name)),
  );
  return index === -1 ? Option.none : Option.some(index);
}

/**
 * 名前で指したノードへ、並びの順に編集を重ねる。
 *
 * 大きさ（軸ごと）と座標（`x` / `y`）がどちらも「1 回の編集で複数の prop を書く」
 * 形なので 1 箇所に置く。途中で失敗したらそこで止めて失敗を返す。
 *
 * @param document 書き換える対象を含むドキュメント
 * @param name 書き換えるノードの名前
 * @param edits 重ねる編集。並びの順に適用する
 * @returns すべて適用したドキュメント。途中で失敗したらその失敗
 */
function applyPropEdits(
  document: DesignDocument,
  name: string,
  edits: readonly PropEdit[],
): Result<DesignDocument, DesignDocumentEditError> {
  const unedited: Result<DesignDocument, DesignDocumentEditError> =
    Result.ok(document);
  return edits.reduce<Result<DesignDocument, DesignDocumentEditError>>(
    (edited, edit) =>
      Result.flatMap(edited, (current) =>
        DesignDocument.applyPropEdit(current, name, edit),
      ),
    unedited,
  );
}

/**
 * 名前で指した artboard / ノードが今持っている、軸ごとの長さ。
 *
 * @param document 引き先になるドキュメント
 * @param name 長さを知りたい artboard / ノードの名前
 * @param axis どちらの軸の長さか
 * @returns その軸の長さ。名前が無い / 部品インスタンス / スキーマに無い type /
 *   `hug` `fill` のときは `none`
 */
function axisLengthOf(
  document: DesignDocument,
  name: string,
  axis: Axis,
): Option<number> {
  const artboard = DesignDocument.findArtboard(document, name);
  if (Option.isSome(artboard)) {
    return Option.some(artboard.value[axis]);
  }
  const node = DesignDocument.findNode(document, name);
  if (!Option.isSome(node) || !Node.isPrimitive(node.value)) {
    return Option.none;
  }
  return Option.flatMap(ResolvedProps.forNode(node.value), (props) =>
    Size.fixedLengthFromProps(props, axis),
  );
}

/**
 * 1 つの子を、親の長さの変化へ追従させる編集
 * （docs/03「配置の指定」の追従の表）。
 *
 * @param node 追従させる子
 * @param resize 親のその軸の長さの変化
 * @returns 座標と長さの編集。フローの子・部品インスタンス・スキーマに無い type の子・
 *   追従の綴りが読めない子と、追従しても値が変わらない子では空
 */
function followPropEdits(node: Node, resize: AxisResize): readonly PropEdit[] {
  if (!Node.isPrimitive(node)) {
    return [];
  }
  const resolved = ResolvedProps.forNode(node);
  if (!Option.isSome(resolved)) {
    return [];
  }
  const props = resolved.value;
  const placement = Placement.fromProps(props);
  const constraint = Constraint.fromProps(props, resize.axis);
  if (!Placement.isAbsolute(placement) || !Option.isSome(constraint)) {
    return [];
  }
  const offsetEdit = Placement.followPropEdit(
    placement,
    constraint.value,
    resize,
  );
  const length = Size.fixedLengthFromProps(props, resize.axis);
  /*
   * 長さが変わるときだけ編集にする。変わらないのに書くと、`AxisLength.create` の
   * 丸めが**変えないはずの長さまで書き換える**（手で 40.5 と書いたファイルが、
   * 長さを変えない追従でリサイズしただけで 41 になる）。
   */
  const lengthEdit = Option.flatMap(length, (current) =>
    Option.map(
      AxisResize.create({
        axis: resize.axis,
        before: current,
        after: Constraint.lengthAfter(constraint.value, current, resize),
      }),
      (changed) =>
        AxisLength.toPropEdit(AxisLength.create(changed.axis, changed.after)),
    ),
  );
  const edits = [offsetEdit, lengthEdit];
  return edits.flatMap((edit) => (Option.isSome(edit) ? [edit.value] : []));
}

/**
 * 大きさが変わった artboard / ノードの、直下の絶対配置の子を追従させる（docs/03「配置の
 * 指定」）。
 *
 * 子への書き込みを `applyPropEdit` へ戻すので、**長さが変わった子は自分の子の追従を自分で
 * 引き起こす**（明示的な再帰を書かない）。
 *
 * @param before 編集する前のドキュメント
 * @param name 大きさが変わったかもしれない artboard / ノードの名前
 * @param edited その編集の結果
 * @returns 子を追従させたドキュメント。長さが変わっていない・長さが読めない
 *   （`axisLengthOf` が答えない）ときは `edited` のまま
 */
function withResizeFollowUp(
  before: DesignDocument,
  name: string,
  edited: Result<DesignDocument, DesignDocumentEditError>,
): Result<DesignDocument, DesignDocumentEditError> {
  return Result.flatMap(edited, (after) => {
    const resizes = Object.values(Axes).flatMap((axis) => {
      const resize = Option.flatMap(axisLengthOf(before, name, axis), (from) =>
        Option.flatMap(axisLengthOf(after, name, axis), (to) =>
          AxisResize.create({ axis, before: from, after: to }),
        ),
      );
      return Option.isSome(resize) ? [resize.value] : [];
    });
    const children = DesignDocument.findChildren(after, name);
    // 大きさと無関係な prop の編集（大半がそれ）で子の走査まで進まないための打ち切り
    if (resizes.length === 0 || !Option.isSome(children)) {
      return Result.ok(after);
    }
    return followChildren(after, children.value, resizes);
  });
}

/**
 * 位置も書き換えるリサイズなら置き直した artboard。
 *
 * `canvasPosition` は片方の軸だけでは持てない（`x` があって `y` が無いファイルは
 * `Artboard.fromJson` が弾く）ので、artboard の経路は常に両軸を書く。
 *
 * @param artboard 大きさを変え終えた artboard
 * @param edit 書き込む長さと、置き直したあとの位置
 * @returns 位置も書くリサイズなら置き直した artboard。位置を書かないならそのまま
 */
function repositionResized(artboard: Artboard, edit: ResizeEdit): Artboard {
  return Option.isSome(edit.position)
    ? Artboard.withCanvasPosition(artboard, edit.position.value)
    : artboard;
}

/**
 * ノードの座標を置き直す編集。
 *
 * **今の座標と値が変わる軸だけ**を編集にする（理由は `followPropEdits` と同じ）。
 *
 * @param document 今の座標の出どころになるドキュメント
 * @param name 置き直すノードの名前
 * @param position 置き直したあとの位置。位置を書かないリサイズなら `none`
 * @returns 値が変わる軸ぶんの編集。位置を書かないとき・そのノードが座標を持たない
 *   とき（`childPlacementOf` が答えないとき）は空
 */
function nodePositionPropEdits(
  document: DesignDocument,
  name: string,
  position: Option<Offset>,
): readonly PropEdit[] {
  const current = DesignDocument.childPlacementOf(document, name);
  if (!Option.isSome(position) || !Option.isSome(current)) {
    return [];
  }
  const stayedAt = Placement.offset(current.value.placement);
  return Object.values(Axes).flatMap((axis) => {
    const moved = Offset.along(position.value, axis);
    const stayed = Offset.along(stayedAt, axis);
    return moved === stayed ? [] : [Placement.positionPropEdit(axis, moved)];
  });
}

/**
 * 子の並びを順に追従させる。
 *
 * @param document 書き換える元のドキュメント
 * @param children 追従させる子の並び
 * @param resizes 親の長さの変化（変化した軸のぶんだけ）
 * @returns すべての子を追従させたドキュメント。途中で失敗したらその失敗
 */
function followChildren(
  document: DesignDocument,
  children: readonly Node[],
  resizes: readonly AxisResize[],
): Result<DesignDocument, DesignDocumentEditError> {
  const unfollowed: Result<DesignDocument, DesignDocumentEditError> =
    Result.ok(document);
  return children.reduce<Result<DesignDocument, DesignDocumentEditError>>(
    (followed, child) =>
      Result.flatMap(followed, (current) =>
        applyPropEdits(
          current,
          child.name,
          resizes.flatMap((resize) => followPropEdits(child, resize)),
        ),
      ),
    unfollowed,
  );
}

/**
 * 名前で指した artboard を作り直したドキュメント。
 * その名前の artboard が無ければ `none`（呼び出し側がノードとして相手をする）。
 *
 * @param document 作り直す元のドキュメント
 * @param name 作り直す artboard の名前
 * @param update その artboard を作り直す手続き
 * @returns 差し替え後のドキュメント。その名前の artboard が無ければ `none`
 */
function updateArtboardNamed(
  document: DesignDocument,
  name: string,
  update: (artboard: Artboard) => Artboard,
): Option<DesignDocument> {
  if (!Option.isSome(DesignDocument.findArtboard(document, name))) {
    return Option.none;
  }
  return Option.some({
    ...document,
    artboards: document.artboards.map((artboard) =>
      artboard.name === name ? update(artboard) : artboard,
    ),
  });
}

/**
 * index 番目の artboard のツリーを差し替えたドキュメント。
 *
 * @param document 差し替える元のドキュメント
 * @param index 差し替える artboard の位置
 * @param tree 差し替え後のツリー
 * @returns その artboard だけツリーが入れ替わったドキュメント
 */
function withArtboardTree(
  document: DesignDocument,
  index: number,
  tree: NodeTree,
): DesignDocument {
  return {
    ...document,
    artboards: document.artboards.map((artboard, current) =>
      current === index ? Artboard.withTree(artboard, tree) : artboard,
    ),
  };
}

/**
 * 名前で指したノードを含む並びを差し替える。
 * 対象がどの artboard に居るかを選ぶところだけがここの責務。
 *
 * @param document 差し替える元のドキュメント
 * @param name 並びを差し替えたいノードの名前
 * @param update そのノードを含む並びを差し替える手続き
 * @returns 差し替え後のドキュメント。その名前のノードが無ければ `node-not-found`
 */
function updateSiblingsOfNode(
  document: DesignDocument,
  name: string,
  update: (siblings: NodeTree) => NodeTree,
): Result<DesignDocument, DesignDocumentEditError> {
  const found = artboardIndexOfNode(document, name);
  if (!Option.isSome(found)) {
    return Result.err({ kind: "node-not-found", name });
  }
  const updated = NodeTree.updateSiblingsOf(
    Artboard.tree(document.artboards[found.value]),
    name,
    update,
  );
  if (!Option.isSome(updated)) {
    return Result.err({ kind: "node-not-found", name });
  }
  return Result.ok(withArtboardTree(document, found.value, updated.value));
}

/**
 * 名前で指した親の子の並びを差し替える。
 * 親は artboard 自身のこともあるため、artboard 名で当ててから
 * ノードの中を探す、の順で調停する。
 *
 * @param document 差し替える元のドキュメント
 * @param parentName 子の並びを差し替えたい親の名前（artboard 名でもよい）
 * @param update 子の並びを差し替える手続き
 * @returns 差し替え後のドキュメント。その名前の親が無ければ `parent-not-found`、
 *   手続き自身が失敗すればその失敗
 */
function updateChildrenOfParent(
  document: DesignDocument,
  parentName: string,
  update: NodeTreeUpdate,
): Result<DesignDocument, DesignDocumentEditError> {
  const artboardIndex = document.artboards.findIndex(
    (artboard) => artboard.name === parentName,
  );
  if (artboardIndex !== -1) {
    return Result.map(
      update(Artboard.tree(document.artboards[artboardIndex])),
      (tree) => withArtboardTree(document, artboardIndex, tree),
    );
  }

  const hostIndex = document.artboards.findIndex((artboard) =>
    Option.isSome(Artboard.findNode(artboard, parentName)),
  );
  if (hostIndex === -1) {
    return Result.err({ kind: "parent-not-found", name: parentName });
  }
  /*
   * ツリーの失敗はドキュメントの失敗でもあるので、
   * ここで語彙を広げてから「親が見つからない」を足す。
   */
  const updated: Result<
    Option<NodeTree>,
    DesignDocumentEditError
  > = NodeTree.updateChildrenOf(
    Artboard.tree(document.artboards[hostIndex]),
    parentName,
    update,
  );
  return Result.flatMap(updated, (tree) =>
    Option.isSome(tree)
      ? Result.ok(withArtboardTree(document, hostIndex, tree.value))
      : Result.err({ kind: "parent-not-found", name: parentName }),
  );
}

/**
 * ドキュメントに現れる名前の集まり。
 *
 * @param document 名前を集める対象のドキュメント
 * @returns 部品・artboard・配下のノードの名前を集めた名前空間
 */
function documentNamesOf(document: DesignDocument): DocumentNames {
  return DocumentNames.create(
    DocumentNames.collectNames(document.components, document.artboards),
  );
}

/**
 * 新しい名前を単一名前空間へ加えられないときの理由。
 *
 * 加える側（`createComponent`）と、加えられるかだけを知りたい側
 * （`isUsableName`）の両方がここを通る。条件を 2 箇所に書くと、片方だけ変わった
 * ときにボタンの出方と編集の結果が食い違う。
 *
 * @param document 名前空間の出どころ
 * @param name 新しく加えたい名前
 * @returns 識別子の規則を満たさないなら `invalid-name`、既に使われているなら
 *   `duplicate-name`。加えられるなら `none`
 */
function unusableNameError(
  document: DesignDocument,
  name: string,
): Option<DesignDocumentEditError> {
  if (!DesignDocument.isValidIdentifier(name)) {
    return Option.some({ kind: "invalid-name", name });
  }
  if (DesignDocument.usedNames(document).has(name)) {
    return Option.some({ kind: "duplicate-name", name });
  }
  return Option.none;
}

/**
 * 解除の対象になる参照ノードを、部品を辿って展開したもの。
 *
 * 解除できるか（`isDetachable`）と解除そのもの（`detach`）の両方がここを通る。
 * 失敗の条件を 2 箇所に書くと、片方だけ変わったときにボタンの出方と結果が食い違う。
 *
 * @param document 解除元のドキュメント
 * @param name 解除したいノードの名前
 * @returns 展開後のノード。ノードが無い・参照ノードでない・参照先の部品が無い・
 *   参照が循環しているときは失敗
 */
function expandInstance(
  document: DesignDocument,
  name: string,
): Result<ExpandedNode, DesignDocumentEditError> {
  const found = DesignDocument.findNode(document, name);
  if (!Option.isSome(found)) {
    return Result.err({ kind: "node-not-found", name });
  }
  const node = found.value;
  if (!Node.isRef(node)) {
    return Result.err({ kind: "ref-node-required", name });
  }
  return ExpandedNode.fromNode(node, document.components);
}

/**
 * ドキュメントのコンパニオンオブジェクト。ツリーの探索・編集は `NodeTree`、名前の規則は
 * `DocumentNames`、部品への変換は `Component`、検証は `validation/`、版ごとの JSON 表現は
 * `v1/` が持ち、ここは「どの artboard・どの部品を相手にするか」の調停に徹する。
 */
export const DesignDocument = {
  /**
   * 材料からドキュメントを組み立てる。仕様に適合するかは見ない（`collectErrors` の担当）。
   *
   * @param params ドキュメントの材料。`formatVersion` は名乗る形式版で、省くと現在の版
   *   （`FormatVersion.Current`）。`tokens` はトークン一式で、省くと空の `TokenSet`。
   *   `components` は部品名をキーにした部品定義で、省くと空。`artboards` は並べる順の
   *   artboard で、省くと空
   * @returns 省いたフィールドを既定値で埋めたドキュメント
   */
  create(params: {
    formatVersion?: FormatVersionOf<1>;
    tokens?: TokenSet;
    components?: ComponentSet;
    artboards?: readonly Artboard[];
  }): DesignDocument {
    return {
      formatVersion: params.formatVersion ?? FormatVersion.Current,
      tokens: params.tokens ?? TokenSet.empty(),
      components: params.components ?? {},
      artboards: params.artboards ?? [],
    };
  },

  /**
   * 雛形から新規ドキュメントを作る（docs/04-tokens.md「新規ドキュメントテンプレート」）。
   * artboards は空で始まる（描く対象はユーザーが足す）。
   *
   * @param template 新規ドキュメントの雛形
   * @returns 雛形のトークンと部品を持ち、現在の版を名乗る、artboard が 0 枚のドキュメント
   */
  createFromTemplate(template: DocumentTemplate): DesignDocument {
    return DesignDocument.create({
      tokens: template.tokens,
      components: template.components,
    });
  },

  /**
   * ドキュメントが名乗る形式版が、アプリにとってどういう関係にあるか。
   *
   * @param document 形式版を見るドキュメント
   * @returns 現在の版と比べた `FormatVersion.compatibility` の答え。型が major を 1 に
   *   固定しているので `needs-migration` にはならない
   */
  compatibility(document: DesignDocument): FormatVersionCompatibility {
    return FormatVersion.compatibility(document.formatVersion);
  },

  /**
   * 現在の形式を名乗るドキュメントにする。
   * 書き出しは常に現在の形式で行う（旧形式へのダウングレード書き出しは持たない・
   * マイグレーションは一方向）ため、書き出す値はこれを通したものになる。
   *
   * @param document 書き出す前のドキュメント
   * @returns 中身はそのままで、`formatVersion` だけを現在の版にしたドキュメント
   */
  withCurrentFormatVersion(document: DesignDocument): DesignDocument {
    return { ...document, formatVersion: FormatVersion.Current };
  },

  /**
   * JSON のデータモデルからドキュメントを組み立てる。
   * どのフィールドをどう読むかは版ごとの知識なので、現在の版のモジュールが持つ。
   *
   * @param cursor ファイルから読んだ JSON の値と、その位置
   * @returns `DesignDocumentV1.fromJson` の結果そのまま（失敗の条件もそちら）
   */
  fromJson(cursor: JsonCursor): JsonDecoded<DesignDocument> {
    return DesignDocumentV1.fromJson(cursor);
  },

  /**
   * ドキュメントを JSON のデータモデルへ落とす。表現は現在の版のモジュールが持つ。
   *
   * @param document 書き出すドキュメント
   * @returns `DesignDocumentV1.toJson` の結果そのまま。`formatVersion` はドキュメントが
   *   名乗る版のまま書く
   */
  toJson(document: DesignDocument): JsonObject {
    return DesignDocumentV1.toJson(document);
  },

  /**
   * ツリー上の位置へノードを挿入する。
   * 位置は「どの親の何番目か」で指すので、親が子を持てない・親が居ない・
   * index が範囲外、のいずれでも失敗しうる。
   *
   * @param document 挿入先のドキュメント
   * @param at 挿入する位置。親は artboard でもノードでもよく、`index` は挿入する前の子の
   *   並びで見た位置（子の数と同じなら末尾）
   * @param node 挿入するノード。名前の一意性は見ないので、既にある名前もそのまま入る
   *   （複製を挿すなら `insertNodeCopy`）
   * @returns 挿入したドキュメント。親の名前が artboard にも artboard 配下のノードにも無い
   *   （部品定義の中のノードも含む）なら `parent-not-found`、親が参照ノードか、スキーマが
   *   子を認めていないプリミティブなら `children-not-allowed`、`index` が 0 以上子の数以下の整数でなければ
   *   `index-out-of-range`。名前が重複した不正なドキュメントでは artboard の名前を先に当て、
   *   ノードは並びで先にある artboard の中で、各階層の直下の並びを子孫より先に見て当てる
   */
  insertNode(
    document: DesignDocument,
    at: ChildPosition,
    node: Node,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return updateChildrenOfParent(document, at.parentName, (children) =>
      NodeTree.insertAt(children, at.index, node),
    );
  },

  /**
   * ノードの複製をツリー上の位置へ挿入する（docs/06-ui.md「編集操作の一覧」の
   * コピー & ペースト）。
   *
   * 名前はドキュメント全体で一意でなければならない（docs/01-file-format.md「ノードの識別（name）」）
   * ので、挿す前に部分木の名前をまとめて付け替える。
   *
   * @param document 挿入先のドキュメント
   * @param at 挿入する位置（`insertNode` と同じ）
   * @param node 複製元のノード。自分と子孫の名前は `DocumentNames.renameSubtree` で
   *   ドキュメントの名前と衝突しない名前へ付け替える
   * @returns 名前を付け替えた複製を挿入したドキュメント。`insertNode` と同じ条件で `err`
   */
  insertNodeCopy(
    document: DesignDocument,
    at: ChildPosition,
    node: Node,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const [renamed] = DocumentNames.renameSubtree(documentNamesOf(document), [
      node,
    ]);
    return DesignDocument.insertNode(document, at, renamed);
  },

  /**
   * 名前で指したノードをツリーから取り除く。
   *
   * @param document 取り除く先のドキュメント
   * @param name 取り除くノードの名前。配下ごと取り除く
   * @returns 取り除いたドキュメント。`replaceNode` と同じ条件で `node-not-found` になり、
   *   名前が重複した不正なドキュメントでも `replaceNode` と同じ相手を取り除く
   */
  removeNode(
    document: DesignDocument,
    name: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return updateSiblingsOfNode(document, name, (siblings) =>
      NodeTree.spliceByName(siblings, name, []),
    );
  },

  /**
   * パレットに並べる部品の一覧。組み立ての規則は `ComponentSet` が持ち、ここは
   * 「部品の外側にある木はどれか」を渡す調停だけを行う（`documentNamesOf` と同じ形）。
   *
   * @param document 部品と、部品の外側にある木の出どころになるドキュメント
   * @returns 部品 1 つにつき 1 件のパレット項目。外側の木として渡すのは artboard の直下の
   *   子（とその子孫）で、並びと数え方は `ComponentSet.assets`
   */
  componentAssets(document: DesignDocument): readonly ComponentAsset[] {
    return ComponentSet.assets(
      document.components,
      document.artboards.flatMap((artboard) => artboard.children),
    );
  },

  /**
   * その部品を指しているインスタンスの名前（UI 案 docs/Design Composer.html の
   * `Select all N instances`）。走査は `Node` が持ち、ここは artboard を跨ぐ調停だけを行う。
   *
   * 見るのは artboard の配下だけ。部品定義の中にある参照ノードはキャンバスには描かれるが
   * ドキュメントの木には無いので選択の対象にならない（`EditorState.select` と同じ線引き）。
   *
   * `componentAssets` の使用数が部品定義の中の参照も数えるのに対し、こちらが数えないのは
   * このため（同じ部品でも 2 つの数が食い違いうる / docs/06-ui.md「選択」）。
   *
   * @param document 走査するドキュメント
   * @param componentName 参照先として探す部品の名前
   * @returns その部品を指すインスタンスの名前。1 つも無ければ空
   */
  collectInstanceNames(
    document: DesignDocument,
    componentName: string,
  ): readonly string[] {
    return document.artboards.flatMap((artboard) =>
      artboard.children.flatMap((node) =>
        Node.collectInstanceNames(node, componentName),
      ),
    );
  },

  /**
   * 並んでいる artboard すべての名前。
   *
   * キャンバスに描かれているものを名前で引く側（文書全体を画面へ収めるズーム）が、
   * artboard の中身に立ち入らずに「全体とはどれか」を受け取れるようにする。
   *
   * @param document 名前の出どころになるドキュメント
   * @returns 配列順そのままの artboard 名。1 枚も無ければ空
   */
  collectArtboardNames(document: DesignDocument): readonly string[] {
    return document.artboards.map((artboard) => artboard.name);
  },

  /**
   * すべての artboard の**直下の子**の名前（範囲選択が選びうる相手）。
   *
   * 直下だけで止めるのは、キャンバスから選べる階層がそこだから（掘るのはダブルクリック
   * の担当 / docs/06-ui.md「キャンバスのクリックが選ぶ階層」）。孫まで集めると、範囲で払
   * ったときにクリックとは違う階層が選ばれる。
   *
   * @param document 走査するドキュメント
   * @returns artboard の並び順・子の並び順のままの名前。1 つも無ければ空
   */
  collectArtboardChildNames(document: DesignDocument): readonly string[] {
    return document.artboards.flatMap((artboard) =>
      artboard.children.map((child) => child.name),
    );
  },

  /**
   * 名前で artboard を引く。名前は単一名前空間なので artboard 名も一意に決まる。
   *
   * @param document 引き先になるドキュメント
   * @param name 引きたい artboard の名前
   * @returns その名前の artboard。無ければ（ノードの名前も含む）`none`。名前が重複した
   *   不正なドキュメントでは並びで先にある 1 枚
   */
  findArtboard(document: DesignDocument, name: string): Option<Artboard> {
    return Option.fromNullable(
      document.artboards.find((artboard) => artboard.name === name),
    );
  },

  /**
   * その名前のものが載っている artboard。artboard 自身の名前ならその artboard、ノードの
   * 名前ならそれを含む artboard（子孫まで辿る）で、どちらでもなければ `none`。
   *
   * 名前は単一名前空間なので答えは一意に決まる。
   *
   * @param document 引き先になるドキュメント
   * @param name artboard かノードの名前
   * @returns その名前のものが載っている artboard。部品定義の中のノードの名前は `none`。
   *   名前が重複した不正なドキュメントでは artboard 自身の名前を先に当て、次に並びで先に
   *   あるノードを含む artboard を返す
   */
  findOwningArtboard(document: DesignDocument, name: string): Option<Artboard> {
    const named = DesignDocument.findArtboard(document, name);
    if (Option.isSome(named)) {
      return named;
    }
    // 走査そのものは `artboardIndexOfNode` が持つ（同じ探索を 2 つ書かない）
    return Option.map(
      artboardIndexOfNode(document, name),
      (index) => document.artboards[index],
    );
  },

  /**
   * 名前で指したもの（artboard またはノード）の子の並び。
   *
   * artboard は常に子を持てるので必ず並びを持つ。子を持てないノード（Text・参照ノード）と
   * ドキュメントに無い名前は「子の並びが無い」ので `none`。
   * 「子を持てない」（`none`）と「子が 0 件」（`some([])`）は別のことなので区別する。
   *
   * @param document 引き先になるドキュメント
   * @param name 子の並びを知りたい artboard / ノードの名前
   * @returns 子の並び。名前が重複した不正なドキュメントでは artboard を優先し、ノードは
   *   `findNode` が見つけたものの子
   */
  findChildren(
    document: DesignDocument,
    name: string,
  ): Option<readonly Node[]> {
    const artboard = DesignDocument.findArtboard(document, name);
    if (Option.isSome(artboard)) {
      return Option.some(artboard.value.children);
    }
    return Option.flatMap(DesignDocument.findNode(document, name), (node) =>
      NodeTree.allowsChildren(node)
        ? Option.some(Node.children(node))
        : Option.none,
    );
  },

  /**
   * その名前のものの子として足すときの位置（並びの末尾）。
   *
   * 足せるかどうかは子の並びを持つかどうかと同じなので `findChildren` に乗せる。挿入の可否は
   * 木の形で決まるためここが答え、UI が `allowsChildren` を見に行かない。
   *
   * @param document 引き先になるドキュメント
   * @param parentName 子を足したい artboard / ノードの名前
   * @returns その名前と、今の子の数を `index` にした位置。`findChildren` が `none` になる
   *   名前は `none`
   */
  appendPositionOf(
    document: DesignDocument,
    parentName: string,
  ): Option<ChildPosition> {
    return Option.map(
      DesignDocument.findChildren(document, parentName),
      (children) => ({ parentName, index: children.length }),
    );
  },

  /**
   * 名前で指したノードが今いる位置を「どの親の何番目か」で引く。
   * artboard 自身は誰の子でもないため位置を持たない（`none`）。
   *
   * @param document 引き先になるドキュメント
   * @param name 位置を知りたいノードの名前
   * @returns 親の名前（artboard の直下なら artboard 名）と、その親の子の並びの中の位置。
   *   部品定義の中のノードと無い名前も `none`。名前が重複した不正なドキュメントでは、並び
   *   で先にある artboard の中で、各階層の直下の並びを子孫より先に見て当たったもの
   *   （`findNode` とは別のノードを指しうる）
   */
  findChildPosition(
    document: DesignDocument,
    name: string,
  ): Option<ChildPosition> {
    for (const artboard of document.artboards) {
      const found = NodeTree.childPositionOf(
        Artboard.tree(artboard),
        artboard.name,
        name,
      );
      if (Option.isSome(found)) {
        return found;
      }
    }
    return Option.none;
  },

  /**
   * 名前で指したノードを包んでいるものの名前を、内側から外側へ並べたもの。
   * 末尾は必ずその artboard になる。
   *
   * artboard は誰の子でもない（`findChildPosition` が `none` を返す）ので、そこで辿るのが止
   * まる。
   *
   * @param document 引き先になるドキュメント
   * @param name 包んでいるものを知りたいノードの名前
   * @returns 親から artboard までの名前。artboard 自身と、ドキュメントに無い名前は空
   */
  collectAncestorNames(
    document: DesignDocument,
    name: string,
  ): readonly string[] {
    const position = DesignDocument.findChildPosition(document, name);
    if (!Option.isSome(position)) {
      return [];
    }
    const parentName = position.value.parentName;
    return [
      parentName,
      ...DesignDocument.collectAncestorNames(document, parentName),
    ];
  },

  /**
   * 名前で指したノードが今どの親の中のどこに置かれているか。**座標で動かせるものだけ**
   * が答えを持つ。
   *
   * @param document 引き先になるドキュメント
   * @param name 置かれている場所を知りたいノードの名前
   * @returns 今いる親と、その親から見た座標。木に無い名前 / 部品インスタンス（props
   *   を持たない）/ スキーマに無い type（props を解決できない）/ フロー / 座標が数値で
   *   ないとき / 親を持たない artboard 自身は `none`
   */
  childPlacementOf(
    document: DesignDocument,
    name: string,
  ): Option<ChildPlacement> {
    const node = DesignDocument.findNode(document, name);
    if (!Option.isSome(node) || !Node.isPrimitive(node.value)) {
      return Option.none;
    }
    const resolved = ResolvedProps.forNode(node.value);
    if (!Option.isSome(resolved)) {
      return Option.none;
    }
    const placement = Placement.fromProps(resolved.value);
    if (!Placement.isAbsolute(placement)) {
      return Option.none;
    }
    return Option.map(
      DesignDocument.findChildPosition(document, name),
      (position) => ChildPlacement.create(position.parentName, placement),
    );
  },

  /**
   * 名前でノードを引く。artboard 直下だけでなく子孫も辿る。
   *
   * @param document 引き先になるドキュメント
   * @param name 引きたいノードの名前
   * @returns その名前のノード。artboard 自身の名前・部品定義の中のノードの名前・無い名前
   *   は `none`。名前が重複した不正なドキュメントでは、並びで先にある artboard の中で、
   *   深さ優先（自分 → 子 → 次の兄弟）で先に当たったもの
   */
  findNode(document: DesignDocument, name: string): Option<Node> {
    for (const artboard of document.artboards) {
      const found = Artboard.findNode(artboard, name);
      if (Option.isSome(found)) {
        return found;
      }
    }
    return Option.none;
  },

  /**
   * 名前で指した artboard またはノードの prop を書き換える（docs/06-ui.md「編集操作の一
   * 覧」の props 編集）。名前は単一名前空間なので、artboard とノードのどちらを相手にす
   * るかは名前で決まる。
   *
   * 大きさが変わったときは、直下の絶対配置の子をここで追従させる（`withResizeFollowUp`）。
   *
   * @param document 書き換える対象を含むドキュメント
   * @param name 書き換える artboard / ノードの名前
   * @param edit 書き込む prop と値（未設定へ戻す編集も含む）。参照ノードには上書きとして
   *   書く
   * @returns 書き換えたドキュメント。artboard にも artboard 配下のノードにも無い名前
   *   （部品定義の中のノードも含む）は `node-not-found`。名前が重複した不正なドキュメント
   *   では artboard を優先して同名の artboard をすべて書き換える。ノードは `findNode` が
   *   見つけたものに編集を重ね、`replaceNode` の相手へ書く（2 つが別のノードになりうる）
   */
  applyPropEdit(
    document: DesignDocument,
    name: string,
    edit: PropEdit,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const editedArtboard = updateArtboardNamed(document, name, (artboard) =>
      Artboard.applyPropEdit(artboard, edit),
    );
    if (Option.isSome(editedArtboard)) {
      return Result.ok(editedArtboard.value);
    }
    const found = DesignDocument.findNode(document, name);
    if (!Option.isSome(found)) {
      return Result.err({ kind: "node-not-found", name });
    }
    return withResizeFollowUp(
      document,
      name,
      DesignDocument.replaceNode(
        document,
        name,
        Node.applyPropEdit(found.value, edit),
      ),
    );
  },

  /**
   * 名前で指した artboard またはノードの大きさと位置を変える（docs/06-ui.md「キャンバス
   * 直接操作」のリサイズハンドル）。長さと位置の持ち主が artboard とノードで違うため、
   * 名前で相手を決めてから書き込み先を分ける。
   *
   * ノード側でモードが `fixed` かどうか・座標を持つかどうかは見ない（ハンドルを出す箇所
   * を決めるのはキャンバス側の役目）。絶対配置の子の追従は artboard の経路だけここで起こ
   * す。ノードの経路は `applyPropEdit` を通る。
   *
   * @param document 書き換える対象を含むドキュメント
   * @param name 大きさを変える artboard / ノードの名前
   * @param edit 書き込む長さと、置き直したあとの位置
   * @returns 書き換えたドキュメント。その名前のものが無ければ失敗。位置が書かれるのは
   *   artboard と座標を持つノード（`childPlacementOf` が答えるもの）だけで、フロー配置・
   *   スキーマに無い type のノードには長さだけが書かれる
   */
  resize(
    document: DesignDocument,
    name: string,
    edit: ResizeEdit,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const resizedArtboard = updateArtboardNamed(document, name, (artboard) =>
      repositionResized(edit.lengths.reduce(Artboard.resize, artboard), edit),
    );
    if (Option.isSome(resizedArtboard)) {
      return withResizeFollowUp(
        document,
        name,
        Result.ok(resizedArtboard.value),
      );
    }
    const sizeEdits = edit.lengths.map(AxisLength.toPropEdit);
    const positionEdits = nodePositionPropEdits(document, name, edit.position);
    return applyPropEdits(document, name, [...sizeEdits, ...positionEdits]);
  },

  /**
   * 名前で指した artboard を、キャンバス上の別の位置へ置き直す
   * （docs/06-ui.md「キャンバス直接操作」の移動のうち、artboard の分）。
   *
   * @param document 書き換える対象を含むドキュメント
   * @param name 置き直す artboard の名前
   * @param canvasPosition 置き直したあとの位置。枠の左上を指す
   * @returns 位置を書き換えたドキュメント。その名前の artboard が無ければ失敗
   *   （ノードの名前を渡した場合も artboard ではないので失敗する）
   */
  repositionArtboard(
    document: DesignDocument,
    name: string,
    canvasPosition: Offset,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const repositioned = updateArtboardNamed(document, name, (artboard) =>
      Artboard.withCanvasPosition(artboard, canvasPosition),
    );
    return Option.isSome(repositioned)
      ? Result.ok(repositioned.value)
      : Result.err({ kind: "node-not-found", name });
  },

  /**
   * 名前で指したノードを、親の中の別の座標へ置き直す（docs/06-ui.md「キャンバス直接操作」の
   * 移動のうち、絶対配置のノードの分）。
   *
   * 今いる位置で相手を確かめるので、どの親の子でもない artboard はここで弾かれる（素通しする
   * と artboard の props に効かない `x` / `y` が黙って書かれる）。
   *
   * 指した親が今の親と違えば、**その親の末尾の子へ移してから**座標を書く。絶対配置の兄弟に並
   * び順の意味が薄いためで、移す先が今の親と必ず違うので `ChildPosition.afterRemoving` は要
   * らない。
   *
   * @param document 書き換える対象を含むドキュメント
   * @param name 置き直すノードの名前
   * @param to 置き直したあとの親と、その親から見た座標
   * @returns 親と座標を書き換えたドキュメント。その名前のノードが無い（artboard
   *   の名前もノードではない）なら失敗。指した親が子を受け入れられない（無い名前
   *   ・ Text・参照ノード）ときと、指した親が自分自身か自分の子孫のときも失敗
   */
  reposition(
    document: DesignDocument,
    name: string,
    to: ChildPlacement,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const current = DesignDocument.findChildPosition(document, name);
    if (!Option.isSome(current)) {
      return Result.err({ kind: "node-not-found", name });
    }
    const write = (moved: DesignDocument) =>
      applyPropEdits(moved, name, Placement.toPropEdits(to.placement));
    if (ChildPlacement.hasParent(to, current.value.parentName)) {
      return write(document);
    }
    const appended = DesignDocument.appendPositionOf(document, to.parentName);
    if (!Option.isSome(appended)) {
      return Result.err({ kind: "parent-not-found", name: to.parentName });
    }
    return Result.flatMap(
      DesignDocument.moveNode(document, name, appended.value),
      write,
    );
  },

  /**
   * 名前で指したノードを別のノードに差し替える。
   *
   * @param document 差し替える対象を含むドキュメント
   * @param name 差し替えるノードの名前
   * @param node 差し替え後のノード。名前は見ないので、`name` と違う名前でもそのまま入る
   * @returns 差し替えたドキュメント。artboard 自身の名前・部品定義の中のノードの名前・
   *   無い名前は `node-not-found`。名前が重複した不正なドキュメントでは、並びで先にある
   *   artboard の中で、各階層の直下の並びを子孫より先に見て当たった並びの、その名前の
   *   ものをすべて差し替える
   */
  replaceNode(
    document: DesignDocument,
    name: string,
    node: Node,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return updateSiblingsOfNode(document, name, (siblings) =>
      NodeTree.spliceByName(siblings, name, [node]),
    );
  },

  /**
   * 同一の親の中で子を動かす。移動元は「どの親の何番目か」で指す位置なので
   * 移動先は同じ親の中の index だけで決まる（親をまたぐ移動は `moveNode`）。
   *
   * @param document 動かす子を含むドキュメント
   * @param from 動かす子の親と、動かす前の位置
   * @param toIndex 動かしたあとにその子が来る位置（抜いたあとの並びで見た位置と同じ）
   * @returns 動かしたドキュメント。親の条件で `insertNode` と同じ `parent-not-found` /
   *   `children-not-allowed`、`from.index` か `toIndex` が既にある子を指していなければ
   *   `index-out-of-range`（どちらを報告するかは `ArrayEx.moveWithin`）
   */
  reorderNode(
    document: DesignDocument,
    from: ChildPosition,
    toIndex: number,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return updateChildrenOfParent(document, from.parentName, (children) =>
      NodeTree.moveWithin(children, from.index, toIndex),
    );
  },

  /**
   * ノードを取り除き、指した親の子の並びの指した位置へ挿す。
   * 自分自身や自分の子孫を移動先に指定するとツリーが壊れるため、
   * `move-into-descendant` として失敗させる。
   *
   * @param document 移すノードを含むドキュメント
   * @param name 移すノードの名前
   * @param to 移したあとの親と位置。今と同じ親も指せる。`index` は自分を取り除いたあとの
   *   並びで読むので、同じ親の中で取り除く前の子の数（末尾の後ろ）を渡すと
   *   `index-out-of-range` になる（取り除く前の並びで見た位置は
   *   `ChildPosition.afterRemoving` で読み替える）
   * @returns 移したドキュメント。ノードが無い（artboard 自身の名前も含む）なら
   *   `node-not-found`、`to` の親がそのノード自身か子孫なら `move-into-descendant`、挿す
   *   ところで失敗すれば `insertNode` と同じ条件の `err`
   */
  moveNode(
    document: DesignDocument,
    name: string,
    to: ChildPosition,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const found = DesignDocument.findNode(document, name);
    if (!Option.isSome(found)) {
      return Result.err({ kind: "node-not-found", name });
    }
    const node = found.value;
    if (Node.collectNames(node).includes(to.parentName)) {
      return Result.err({
        kind: "move-into-descendant",
        name,
        parentName: to.parentName,
      });
    }
    return Result.flatMap(
      DesignDocument.removeNode(document, name),
      (without) => DesignDocument.insertNode(without, to, node),
    );
  },

  /**
   * ノードを部品として切り出し、元の位置をその部品への参照に置き換える。
   * 部品名はドキュメントの単一名前空間に加わるため、規則と衝突の両方をここで見る。
   *
   * @param document 切り出し元のドキュメント
   * @param name 部品にするノードの名前
   * @param componentName 新しく作る部品に付ける名前
   * @returns 部品が増え、元の位置が参照ノードに変わったドキュメント。
   *   ノードが無い・部品名が識別子の規則を満たさない・部品名が既に使われている・
   *   参照ノードを指しているときは失敗
   */
  createComponent(
    document: DesignDocument,
    name: string,
    componentName: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const found = DesignDocument.findNode(document, name);
    if (!Option.isSome(found)) {
      return Result.err({ kind: "node-not-found", name });
    }
    const unavailable = unusableNameError(document, componentName);
    if (Option.isSome(unavailable)) {
      return Result.err(unavailable.value);
    }
    const component = Component.fromNode(found.value);
    if (!Option.isSome(component)) {
      return Result.err({ kind: "ref-node-not-supported", name });
    }
    const refNode: RefNode = { name, ref: componentName };
    return Result.map(
      DesignDocument.replaceNode(document, name, refNode),
      (replaced) => ({
        ...replaced,
        components: {
          ...replaced.components,
          [componentName]: component.value,
        },
      }),
    );
  },

  /**
   * 部品インスタンスを定義の中身へ置き換える
   * （docs/06-ui.md「部品化・解除」。`createComponent` の逆向き）。
   *
   * 内側のノード名は既存の名前と衝突しないよう付け替える。
   *
   * @param document 解除元のドキュメント
   * @param name 解除したいインスタンスの名前
   * @returns 参照ノードが実体の木に変わったドキュメント。
   *   ノードが無い・参照ノードでない・参照先の部品が無い・
   *   参照が循環しているときは失敗
   */
  detach(
    document: DesignDocument,
    name: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.flatMap(expandInstance(document, name), (expanded) => {
      /*
       * ここに来る `expanded` は参照ノードを展開したものだけで、その `children` は
       * 必ず配列（部品に子が無ければ空）。`ExpandedNode` の `children?` が省略可能
       * なのは、木の途中に居る子無しのプリミティブのため。
       */
      const children = DocumentNames.renameSubtree(
        documentNamesOf(document),
        expanded.children ?? [],
      );
      const replacement: Node = {
        name: expanded.name,
        type: expanded.type,
        ...(expanded.props !== undefined ? { props: expanded.props } : {}),
        children,
      };
      return DesignDocument.replaceNode(document, name, replacement);
    });
  },

  /**
   * その名前のノードを解除できるか（参照ノードで、参照先を辿りきれる）。
   *
   * `DesignDocument.replaceNode` も `Result` を返すが、探索（`findNode`）と置き換えは同じ
   * `Node.children` の走査を通るので、探索できたノードの置き換えは必ず成功する。
   *
   * @param document 解除元のドキュメント
   * @param name 解除したいノードの名前
   * @returns 解除できるなら true
   */
  isDetachable(document: DesignDocument, name: string): boolean {
    return Result.isOk(expandInstance(document, name));
  },

  /**
   * ノードを新しい Box の中へ入れる（docs/06-ui.md「編集操作の一覧」のグループ化）。
   *
   * 新しい Box は元のノードが居た位置へ入り、そのノードを唯一の子にする。props は持たせ
   * ない（スキーマ既定の `hug` が包んだ中身に合う）。
   *
   * @param document 包む先のドキュメント
   * @param name 包むノードの名前
   * @param boxName 新しく作る Box に付ける名前
   * @returns 元の位置が新しい Box に変わり、その子が元のノードになったドキュメント。
   *   ノードが無い・artboard を指しているときは `node-not-found`、Box 名が識別子の規則を
   *   満たさなければ `invalid-name`、既に使われていれば `duplicate-name`
   */
  groupIntoBox(
    document: DesignDocument,
    name: string,
    boxName: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const found = DesignDocument.findNode(document, name);
    if (!Option.isSome(found)) {
      return Result.err({ kind: "node-not-found", name });
    }
    const unusable = unusableNameError(document, boxName);
    if (Option.isSome(unusable)) {
      return Result.err(unusable.value);
    }
    const box: Node = {
      name: boxName,
      type: PrimitiveTypes.Box,
      children: [found.value],
    };
    return DesignDocument.replaceNode(document, name, box);
  },

  /**
   * Box を外して、その子を Box が居た位置へ戻す（docs/06-ui.md「編集操作の一覧」のグルー
   * プ解除。`groupIntoBox` の逆向き）。
   *
   * 子の名前は単一名前空間で既に一意なので付け替えない。子が 0 件なら Box だけが消える。
   *
   * @param document 外す先のドキュメント
   * @param name 外したい Box の名前
   * @returns Box が居た位置へその子が同じ順で並んだドキュメントと、親へ戻った子の名前。
   *   ノードが無い・artboard を指しているときは `node-not-found`、子を持てないノード
   *   （Text・部品インスタンス）は `children-not-allowed`
   */
  ungroupBox(
    document: DesignDocument,
    name: string,
  ): Result<UngroupedBox, DesignDocumentEditError> {
    const found = DesignDocument.findNode(document, name);
    if (!Option.isSome(found)) {
      return Result.err({ kind: "node-not-found", name });
    }
    if (!NodeTree.allowsChildren(found.value)) {
      return Result.err({ kind: "children-not-allowed", name });
    }
    const freed = Node.children(found.value);
    return Result.map(
      updateSiblingsOfNode(document, name, (siblings) =>
        NodeTree.spliceByName(siblings, name, freed),
      ),
      (ungrouped) => ({
        document: ungrouped,
        freedNames: freed.map((child) => child.name),
      }),
    );
  },

  /**
   * artboard をドキュメントの指定位置へ挿入する。
   *
   * @param document 挿入先のドキュメント
   * @param index 挿入する位置。artboard の数と同じなら末尾
   * @param artboard 挿入する artboard。名前の一意性は見ないので、既にある名前もそのまま
   *   入る
   * @returns 挿入したドキュメント。`index` が 0 以上 artboard の数以下の整数でなければ
   *   `index-out-of-range`
   */
  insertArtboard(
    document: DesignDocument,
    index: number,
    artboard: Artboard,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(
      Result.mapErr(
        ArrayEx.insertAt(document.artboards, index, artboard),
        (range): DesignDocumentEditError => ({
          kind: "index-out-of-range",
          ...range,
        }),
      ),
      (artboards) => ({ ...document, artboards }),
    );
  },

  /**
   * 名前で指した artboard をドキュメントから取り除く。
   *
   * @param document 取り除く先のドキュメント
   * @param name 取り除く artboard の名前。配下ごと取り除く
   * @returns 取り除いたドキュメント。その名前の artboard が無ければ（ノードの名前も含む）
   *   `artboard-not-found`。名前が重複した不正なドキュメントでは並びで先にある 1 枚だけを
   *   取り除く
   */
  removeArtboard(
    document: DesignDocument,
    name: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const index = document.artboards.findIndex(
      (artboard) => artboard.name === name,
    );
    if (index === -1) {
      return Result.err({ kind: "artboard-not-found", name });
    }
    return Result.ok({
      ...document,
      artboards: [
        ...document.artboards.slice(0, index),
        ...document.artboards.slice(index + 1),
      ],
    });
  },

  /**
   * 単一名前空間の名前で指したものを取り除く（docs/06-ui.md「編集操作の一覧」の削除と
   * artboard 操作）。artboard ならその 1 枚を配下ごと、そうでなければノードをサブツリー
   * ごと取り除く。
   *
   * 呼び出し側で分けると「選んでいるものが artboard か」の判定が features 層へ出る。
   *
   * @param document 取り除く先のドキュメント
   * @param name 取り除きたい artboard / ノードの名前
   * @returns 取り除いたドキュメント。どちらにも無い名前は `node-not-found`（artboard
   *   でなければノードとして扱うため）
   */
  remove(
    document: DesignDocument,
    name: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Option.isSome(DesignDocument.findArtboard(document, name))
      ? DesignDocument.removeArtboard(document, name)
      : DesignDocument.removeNode(document, name);
  },

  /**
   * 単一名前空間の名前で指したものに別の名前を付ける（docs/06-ui.md「編集操作の一覧」の
   * 名前を変更）。artboard ならその 1 枚、そうでなければノードの名前を付け替える。
   *
   * 参照（`ref` と部品の `publicProps` の binding）は書き換えない。`ref` が指すのは
   * `components` のキー、binding が指すのは部品**内部**のノード名で、どちらもここで指せる
   * 名前（artboard と その配下のノード）にはならないため。
   *
   * 呼び出し側で分けると「選んでいるものが artboard か」の判定が features 層へ出る
   * （`remove` と同じ）。
   *
   * @param document 名前を変える先のドキュメント
   * @param names 今の名前と、新しい名前
   * @returns 名前を変えたドキュメント。新しい名前が識別子の規則を満たさなければ
   *   `invalid-name`、単一名前空間で既に使われていれば `duplicate-name`、今の名前が
   *   artboard にもノードにも無ければ `node-not-found`
   */
  rename(
    document: DesignDocument,
    { from, to }: Readonly<{ from: string; to: string }>,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const unusable = unusableNameError(document, to);
    if (Option.isSome(unusable)) {
      return Result.err(unusable.value);
    }
    const renamedArtboard = updateArtboardNamed(document, from, (artboard) => ({
      ...artboard,
      name: to,
    }));
    if (Option.isSome(renamedArtboard)) {
      return Result.ok(renamedArtboard.value);
    }
    const node = DesignDocument.findNode(document, from);
    if (!Option.isSome(node)) {
      return Result.err({ kind: "node-not-found", name: from });
    }
    return DesignDocument.replaceNode(
      document,
      from,
      Node.rename(node.value, { [from]: to }),
    );
  },

  /**
   * artboard を 1 枚抜いて、並びの別の位置へ差し込む。
   *
   * @param document 動かす artboard を含むドキュメント
   * @param fromIndex 動かす artboard の、動かす前の位置
   * @param toIndex 動かしたあとにその artboard が来る位置（抜いたあとの並びで見た位置と
   *   同じ）
   * @returns 動かしたドキュメント。どちらかの位置が既にある artboard を指していなければ
   *   `index-out-of-range`（どちらを報告するかは `ArrayEx.moveWithin`）
   */
  reorderArtboard(
    document: DesignDocument,
    fromIndex: number,
    toIndex: number,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(
      Result.mapErr(
        ArrayEx.moveWithin(document.artboards, fromIndex, toIndex),
        (range): DesignDocumentEditError => ({
          kind: "index-out-of-range",
          ...range,
        }),
      ),
      (artboards) => ({ ...document, artboards }),
    );
  },

  /**
   * トークンを追加する（docs/06-ui.md「編集操作の一覧」の tokens 編集）。
   * 名前の規則と種別内の一意性は `TokenSet` が見るので、ここは
   * 「ドキュメントのどこを差し替えるか」だけを担う。
   *
   * @param document 追加先のドキュメント
   * @param token 追加するトークン
   * @returns トークンを足したドキュメント。`TokenSet.add` と同じ条件で `err`
   */
  addToken(
    document: DesignDocument,
    token: Token,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(TokenSet.add(document.tokens, token), (tokens) => ({
      ...document,
      tokens,
    }));
  },

  /**
   * トークンの値を差し替える。
   *
   * @param document 差し替える対象を含むドキュメント
   * @param token 差し替え後のトークン。種別と名前で差し替える相手を指す
   * @returns 差し替えたドキュメント。`TokenSet.replace` と同じ条件で `err`
   */
  replaceToken(
    document: DesignDocument,
    token: Token,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(TokenSet.replace(document.tokens, token), (tokens) => ({
      ...document,
      tokens,
    }));
  },

  /**
   * トークンの名前を変える。そのトークンを指している prop は書き換えない。
   *
   * @param document 名前を変える対象を含むドキュメント
   * @param ref 名前を変えるトークン
   * @param newName 新しい名前
   * @returns 名前を変えたドキュメント。`TokenSet.rename` と同じ条件で `err`
   */
  renameToken(
    document: DesignDocument,
    ref: TokenRef,
    newName: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(
      TokenSet.rename(document.tokens, ref, newName),
      (tokens) => ({ ...document, tokens }),
    );
  },

  /**
   * トークンを削除する。そのトークンを指している prop は書き換えない。
   *
   * @param document 削除する対象を含むドキュメント
   * @param ref 削除するトークン
   * @returns 削除したドキュメント。`TokenSet.remove` と同じ条件で `err`
   */
  removeToken(
    document: DesignDocument,
    ref: TokenRef,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(TokenSet.remove(document.tokens, ref), (tokens) => ({
      ...document,
      tokens,
    }));
  },

  /**
   * そのトークンを参照している箇所をすべて集める（UI 案 docs/Design Composer.html の
   * `Used by`）。
   *
   * artboard の中を先に、部品定義の中を後に並べる。一覧は先頭の数件しか出さないので、選
   * 択やキャンバスから指し示せるものを先に見せる（UI 案は両者を交互に並べているが、それ
   * を再現できる大域順序が無い）。
   *
   * トークンが実在するかは見ないので、宙に浮いた参照（dangling）も同じ関数で数えられる。
   *
   * @param document 参照元を探すドキュメント
   * @param ref 参照されているかを知りたいトークン
   * @returns `collectCanvasTokenReferrers` の並びの後に
   *   `TokenReferrer.collectInComponents` の並びを続けたもの。1 件も無ければ空
   */
  collectTokenReferrers(
    document: DesignDocument,
    ref: TokenRef,
  ): readonly TokenReferrer[] {
    const canvasReferrers = DesignDocument.collectCanvasTokenReferrers(
      document,
      ref,
    );
    const componentReferrers = TokenReferrer.collectInComponents(
      document.components,
      ref,
    );
    return [...canvasReferrers, ...componentReferrers];
  },

  /**
   * キャンバスに描かれているものの中から、そのトークンを参照している箇所を集める。走るのは
   * artboard とその配下だけで、インスタンスの先の部品定義へは降りない。
   *
   * @param document 参照元を探すドキュメント
   * @param ref 参照されているかを知りたいトークン
   * @returns キャンバス上の参照元の並び。artboard 自身の props も含む
   */
  collectCanvasTokenReferrers(
    document: DesignDocument,
    ref: TokenRef,
  ): readonly TokenReferrer[] {
    return document.artboards.flatMap((artboard) =>
      TokenReferrer.collectInArtboard(document.components, artboard, ref),
    );
  },

  /**
   * ドキュメントの単一名前空間で使われている名前。
   *
   * @param document 名前を集めるドキュメント
   * @returns 部品名・部品定義の中のノード名・artboard 名・artboard 配下のノード名の集合。
   *   同じ名前が何度現れても 1 つに畳まれる
   */
  usedNames(document: DesignDocument): ReadonlySet<string> {
    return DocumentNames.toSet(documentNamesOf(document));
  },

  /**
   * その名前が識別子の規則（kebab-case）を満たすか。
   *
   * @param name 判定する名前
   * @returns `DocumentNames.isValidIdentifier` の答え
   */
  isValidIdentifier(name: string): boolean {
    return DocumentNames.isValidIdentifier(name);
  },

  /**
   * その名前を新しい名前としてこのドキュメントへ加えられるか
   * （識別子の規則を満たし、単一名前空間でまだ使われていない）。
   *
   * 部品化のボタンの可否がこれを見る。`createComponent` を空撃ちして `ok` を
   * 見る形だと、押せるかを知るためだけにドキュメントを 1 つ組み立てることになる。
   *
   * @param document 名前空間の出どころ
   * @param name 新しく加えたい名前
   * @returns 加えられるなら true
   */
  isUsableName(document: DesignDocument, name: string): boolean {
    return !Option.isSome(unusableNameError(document, name));
  },

  /**
   * 使用済みの名前と衝突しない名前。衝突する場合は連番を付ける。
   *
   * @param baseName 付けたい名前
   * @param usedNames 既に使われている名前
   * @returns 衝突しなければ `baseName` そのまま、衝突すれば `DocumentNames.uniqueName` が
   *   連番を付けた名前
   */
  uniqueName(baseName: string, usedNames: ReadonlySet<string>): string {
    return DocumentNames.uniqueName(
      DocumentNames.create([...usedNames]),
      baseName,
    );
  },

  /**
   * ドキュメントが仕様に適合しない箇所をすべて集める。
   *
   * 適合の規則そのものは `validation/` が関心ごとに持ち、ここは「どの部品・どの artboard
   * を検証対象にするか」の取りまとめを行う。
   *
   * @param document 検証するドキュメント
   * @returns 部品ごとのエラー・artboard ごとのエラー・部品の循環参照・名前のエラーの順に
   *   連ねた並び。適合していれば空
   */
  collectErrors(
    document: DesignDocument,
  ): readonly DesignDocumentValidationError[] {
    const context: ReferenceContext = {
      components: document.components,
      tokens: document.tokens,
    };

    const componentErrors = ComponentSet.names(document.components).flatMap(
      (name) => {
        const component = ComponentSet.get(document.components, name);
        if (!Option.isSome(component)) {
          return [];
        }
        return collectComponentErrors(context, name, component.value);
      },
    );
    const artboardErrors = document.artboards.flatMap((artboard) =>
      collectArtboardErrors(context, artboard),
    );
    const circularErrors = collectCircularRefErrors(document.components);
    const nameErrors = collectDocumentNameErrors(document);

    return [
      ...componentErrors,
      ...artboardErrors,
      ...circularErrors,
      ...nameErrors,
    ];
  },
} as const;
