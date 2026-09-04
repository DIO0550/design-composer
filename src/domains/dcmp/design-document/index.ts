import { Artboard } from "@/domains/dcmp/artboard";
import { AxisLength, AxisResize } from "@/domains/dcmp/axis-length";
import type { ChildPosition } from "@/domains/dcmp/child-position";
import {
  Component,
  type ComponentAsset,
  ComponentSet,
} from "@/domains/dcmp/component";
import { Constraint } from "@/domains/dcmp/constraint";
import { ExpandedNode } from "@/domains/dcmp/expanded-node";
import {
  FormatVersion,
  type FormatVersionCompatibility,
  type FormatVersionOf,
} from "@/domains/dcmp/format-version";
import { NameSpace } from "@/domains/dcmp/name-space";
import { Node, type PropEdit, type RefNode } from "@/domains/dcmp/node";
import { NodeTree, type NodeTreeUpdate } from "@/domains/dcmp/node-tree";
import { type AbsolutePlacement, Placement } from "@/domains/dcmp/placement";
import { ResolvedProps } from "@/domains/dcmp/resolved-props";
import { Size } from "@/domains/dcmp/size";
import { type Token, type TokenRef, TokenSet } from "@/domains/dcmp/token";
import { Axes, type Axis } from "@/domains/unit/axis";
import type { Offset } from "@/domains/unit/offset";
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
 * 版ごとの型と JSON 表現は版のフォルダ（`v1/`）が持つ。
 * major を上げるときは隣に `v2/` を作ってここを差し替え、旧版のフォルダは残す。
 * 旧版の型が残ることで、マイグレーション（`libs/document-migration`）が
 * 「どの形から どの形へ」を型で書ける。
 * アプリ本体が旧版の形を扱うことはないので、ここを版の直和にはしない
 * （消費側に版の分岐を強いないため）。
 */
export type DesignDocument = DesignDocumentV1;

/*
 * 以下の関数は「どの artboard を相手にするか」を選ぶためのもの。
 * 並びの探索・編集そのものは `NodeTree` が、名前の規則は `NameSpace` が持っており、
 * ドキュメントに残るのは「複数の artboard のどれに対して行うか」という調停だけ。
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
  const index = document.artboards.findIndex(
    (artboard) => Artboard.findNode(artboard, name).some,
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
 * artboard を先に見るのは、長さの持ち主が artboard 自身のフィールドで、
 * `boxProps` が props の側を固定値で上書きするため（`Artboard.resize` の doc）。
 *
 * @param document 引き先になるドキュメント
 * @param name 長さを知りたい artboard / ノードの名前
 * @param axis どちらの軸の長さか
 * @returns その軸の長さ。名前が無い / 部品インスタンス / `hug` `fill` のときは `none`
 */
function axisLengthOf(
  document: DesignDocument,
  name: string,
  axis: Axis,
): Option<number> {
  const artboard = DesignDocument.findArtboard(document, name);
  if (artboard.some) {
    return Option.some(artboard.value[axis]);
  }
  const node = DesignDocument.findNode(document, name);
  if (!node.some || !Node.isPrimitive(node.value)) {
    return Option.none;
  }
  return Size.fixedLength(
    Size.fromProps(ResolvedProps.forNode(node.value), axis),
  );
}

/**
 * 1 つの子を、親の長さの変化へ追従させる編集
 * （docs/03「配置の指定」の追従の表）。
 *
 * @param node 追従させる子
 * @param resize 親のその軸の長さの変化
 * @returns 座標と長さの編集。フローの子・部品インスタンス・追従の綴りが読めない子と、
 *   追従しても値が変わらない子では空
 */
function followPropEdits(node: Node, resize: AxisResize): readonly PropEdit[] {
  if (!Node.isPrimitive(node)) {
    return [];
  }
  const props = ResolvedProps.forNode(node);
  const placement = Placement.fromProps(props);
  const constraint = Constraint.fromProps(props, resize.axis);
  if (!Placement.isAbsolute(placement) || !constraint.some) {
    return [];
  }
  const offsetEdit = Placement.followPropEdit(
    placement,
    constraint.value,
    resize,
  );
  const length = Size.fixedLength(Size.fromProps(props, resize.axis));
  const lengthEdit = Option.map(length, (current) =>
    AxisLength.toPropEdit(
      AxisLength.create(
        resize.axis,
        Constraint.lengthAfter(constraint.value, current, resize),
      ),
    ),
  );
  const edits = [offsetEdit, lengthEdit];
  return edits.flatMap((edit) => (edit.some ? [edit.value] : []));
}

/**
 * 大きさが変わった artboard / ノードの、直下の絶対配置の子を追従させる
 * （docs/03「配置の指定」）。
 *
 * 子への書き込みを `applyPropEdit` へ戻すので、**長さが変わった子は自分の子の追従を
 * 自分で引き起こす**（明示的な再帰を書かない）。
 *
 * Why not: 「どの prop を編集したか」で追従の要否を決めない。`width` を消して `hug`
 * へ戻す編集のように、prop 名だけでは長さが変わったかを判定できないため。
 *
 * @param before 編集する前のドキュメント
 * @param name 大きさが変わったかもしれない artboard / ノードの名前
 * @param edited その編集の結果
 * @returns 子を追従させたドキュメント。長さが変わっていなければ `edited` のまま
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
      return resize.some ? [resize.value] : [];
    });
    const children = DesignDocument.findChildren(after, name);
    if (resizes.length === 0 || !children.some) {
      return Result.ok(after);
    }
    return followChildren(after, children.value, resizes);
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
  return children.slice(0, 1).reduce<Result<DesignDocument, DesignDocumentEditError>>(
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
  if (!DesignDocument.findArtboard(document, name).some) {
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
  if (!found.some) {
    return Result.err({ kind: "node-not-found", name });
  }
  const updated = NodeTree.updateSiblingsOf(
    Artboard.tree(document.artboards[found.value]),
    name,
    update,
  );
  if (!updated.some) {
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

  const hostIndex = document.artboards.findIndex(
    (artboard) => Artboard.findNode(artboard, parentName).some,
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
    tree.some
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
function nameSpaceOf(document: DesignDocument): NameSpace {
  return NameSpace.create(
    NameSpace.collectNames(document.components, document.artboards),
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
  if (!found.some) {
    return Result.err({ kind: "node-not-found", name });
  }
  const node = found.value;
  if (!Node.isRef(node)) {
    return Result.err({ kind: "ref-node-required", name });
  }
  return ExpandedNode.fromNode(node, document.components);
}

/**
 * ドキュメントのコンパニオンオブジェクト。
 * ツリーの探索・編集は `NodeTree`、名前の規則は `NameSpace`、
 * 部品への変換は `Component`、検証は `validation/`、版ごとの JSON 表現は `v1/` が持ち、
 * ここは「どの artboard・どの部品を相手にするか」の調停に徹する。
 */
export const DesignDocument = {
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
   * 雛形を引数で受け取るのは、既定を隠さず呼び出し側に選ばせるため。
   */
  createFromTemplate(template: DocumentTemplate): DesignDocument {
    return DesignDocument.create({
      tokens: template.tokens,
      components: template.components,
    });
  },

  compatibility(document: DesignDocument): FormatVersionCompatibility {
    return FormatVersion.compatibility(document.formatVersion);
  },

  /**
   * 現在の形式を名乗るドキュメントにする。
   * 書き出しは常に現在の形式で行う（旧形式へのダウングレード書き出しは持たない・
   * マイグレーションは一方向）ため、書き出す値はこれを通したものになる。
   */
  withCurrentFormatVersion(document: DesignDocument): DesignDocument {
    return { ...document, formatVersion: FormatVersion.Current };
  },

  /**
   * JSON のデータモデルからドキュメントを組み立てる。
   * どのフィールドをどう読むかは版ごとの知識なので、現在の版のモジュールが持つ。
   */
  fromJson(cursor: JsonCursor): JsonDecoded<DesignDocument> {
    return DesignDocumentV1.fromJson(cursor);
  },

  /** ドキュメントを JSON のデータモデルへ落とす。表現は現在の版のモジュールが持つ。 */
  toJson(document: DesignDocument): JsonObject {
    return DesignDocumentV1.toJson(document);
  },

  /**
   * ツリー上の位置へノードを挿入する。
   * 位置は「どの親の何番目か」で指すので、親が子を持てない・親が居ない・
   * index が範囲外、のいずれでも失敗しうる。
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
   * 名前はドキュメント全体で一意でなければならない（docs/01-file-format.md
   * 「ノードの識別（name）」）ので、挿す前に部分木の名前をまとめて付け替える。
   * 付け替えと挿入を呼び出し側に順番で守らせず 1 つの操作にするのは、
   * 付け替え忘れが「重複した名前を持つドキュメント」として通ってしまうため。
   */
  insertNodeCopy(
    document: DesignDocument,
    at: ChildPosition,
    node: Node,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const [renamed] = DesignDocument.renameSubtree(
      [node],
      DesignDocument.usedNames(document),
    ).nodes;
    return DesignDocument.insertNode(document, at, renamed);
  },

  /** 名前で指したノードをツリーから取り除く。 */
  removeNode(
    document: DesignDocument,
    name: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return updateSiblingsOfNode(document, name, (siblings) =>
      NodeTree.create(
        NodeTree.nodes(siblings).filter((sibling) => sibling.name !== name),
      ),
    );
  },

  /**
   * パレットに並べる部品の一覧。組み立ての規則は `ComponentSet` が持ち、ここは
   * 「部品の外側にある木はどれか」を渡す調停だけを行う（`nameSpaceOf` と同じ形）。
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

  /** 名前で artboard を引く。名前は単一名前空間なので artboard 名も一意に決まる。 */
  findArtboard(document: DesignDocument, name: string): Option<Artboard> {
    return Option.fromNullable(
      document.artboards.find((artboard) => artboard.name === name),
    );
  },

  /**
   * その名前のものが載っている artboard。artboard 自身の名前ならその artboard、
   * ノードの名前ならそれを含む artboard（子孫まで辿る）。どちらでもなければ `none`。
   *
   * 名前 1 つから artboard へ辿る道をここに置くのは、「今どの artboard を見ているか」を
   * 選択から決める側（左ペイン）が、artboard とノードのどちらを選んでいるかで
   * 場合分けせずに済むようにするため。名前は単一名前空間なので答えは一意に決まる。
   */
  findOwningArtboard(document: DesignDocument, name: string): Option<Artboard> {
    const named = DesignDocument.findArtboard(document, name);
    if (named.some) {
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
   */
  findChildren(
    document: DesignDocument,
    name: string,
  ): Option<readonly Node[]> {
    const artboard = DesignDocument.findArtboard(document, name);
    if (artboard.some) {
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
   * 足せるかどうかは子の並びを持つかどうかと同じなので `findChildren` に乗せる。
   * 挿入の可否は木の形で決まるためここが答え、UI が `allowsChildren` を見に行かない（#39）。
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
      if (found.some) {
        return found;
      }
    }
    return Option.none;
  },

  /**
   * 名前で指したノードが今置かれている座標。**座標で動かせるものだけ**が答えを持つ。
   *
   * 「置かれ方」ではなく絶対配置だけを答えるのは、消費側（キャンバスのドラッグと
   * その見た目のプレビュー）が知りたいのが「このノードは座標で動かせるか、
   * 動かせるなら今どこか」だから。`Placement.fromProps` が
   * スキーマ違反に返す `undefined` をここで `none` へ潰せるのも、
   * その区別が答えを変えないため（フローと同じく「動かせない」に落ちる）。
   *
   * @param document 引き先になるドキュメント
   * @param name 座標を知りたいノードの名前
   * @returns 今置かれている座標。木に無い名前 / 部品インスタンス（props を持たない）/
   *   フロー / 座標が数値でないときは `none`
   */
  absolutePlacementOf(
    document: DesignDocument,
    name: string,
  ): Option<AbsolutePlacement> {
    const node = DesignDocument.findNode(document, name);
    if (!node.some || !Node.isPrimitive(node.value)) {
      return Option.none;
    }
    const placement = Placement.fromProps(ResolvedProps.forNode(node.value));
    return Placement.isAbsolute(placement)
      ? Option.some(placement)
      : Option.none;
  },

  /** 名前でノードを引く。artboard 直下だけでなく子孫も辿る。 */
  findNode(document: DesignDocument, name: string): Option<Node> {
    for (const artboard of document.artboards) {
      const found = Artboard.findNode(artboard, name);
      if (found.some) {
        return found;
      }
    }
    return Option.none;
  },

  /**
   * 名前で指した artboard またはノードの prop を書き換える
   * （docs/06-ui.md「編集操作の一覧」の props 編集）。
   * 名前は単一名前空間なので、artboard とノードのどちらを相手にするかは名前で決まる。
   *
   * 大きさが変わったときは、直下の絶対配置の子をここで追従させる
   * （`withResizeFollowUp`）。`resize` 側にも同じフックを置かないのは、ノードの
   * リサイズがこの入口を通るため（両方に置くと子が 2 度動く）。
   */
  applyPropEdit(
    document: DesignDocument,
    name: string,
    edit: PropEdit,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const editedArtboard = updateArtboardNamed(document, name, (artboard) =>
      Artboard.applyPropEdit(artboard, edit),
    );
    if (editedArtboard.some) {
      return Result.ok(editedArtboard.value);
    }
    const found = DesignDocument.findNode(document, name);
    if (!found.some) {
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
   * 名前で指した artboard またはノードの大きさを変える
   * （docs/06-ui.md「キャンバス直接操作」のリサイズハンドル）。
   *
   * 長さの持ち主が artboard とノードで違う（artboard は自身のフィールド、
   * ノードは `width` / `height` prop）ため、名前で相手を決めてから書き込み先を分ける。
   * ノード側でモードが `fixed` かどうかは見ない。ハンドルを出す軸を決めるのは
   * キャンバス側の役目で、ここは指定された長さを書くところ。
   *
   * 絶対配置の子の追従は、artboard の経路だけここで起こす。ノードの経路は
   * `applyPropEdit` を通るのでそちらが起こす（`applyPropEdit` の doc）。
   */
  resize(
    document: DesignDocument,
    name: string,
    sizes: readonly AxisLength[],
  ): Result<DesignDocument, DesignDocumentEditError> {
    const resizedArtboard = updateArtboardNamed(document, name, (artboard) =>
      sizes.reduce(Artboard.resize, artboard),
    );
    if (resizedArtboard.some) {
      return withResizeFollowUp(
        document,
        name,
        Result.ok(resizedArtboard.value),
      );
    }
    return applyPropEdits(document, name, sizes.map(AxisLength.toPropEdit));
  },

  /**
   * 名前で指した artboard を、キャンバス上の別の位置へ置き直す
   * （docs/06-ui.md「キャンバス直接操作」の移動のうち、artboard の分）。
   *
   * ノードを相手にしないのは、キャンバス上の位置を持つのが artboard だけのため
   * （ノードの座標は親からの相対で、そちらは `reposition` が受ける）。
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
    return repositioned.some
      ? Result.ok(repositioned.value)
      : Result.err({ kind: "node-not-found", name });
  },

  /**
   * 名前で指したノードを、親の中の別の座標へ置き直す
   * （docs/06-ui.md「キャンバス直接操作」の移動のうち、絶対配置のノードの分）。
   *
   * 座標の 2 prop を 1 回の呼び出しで書くのは、ドラッグ 1 回が undo 1 回で戻る
   * ようにするため。`PropEdit` は同じ値を複数の prop へ入れる形なので、
   * `x` と `y` は 1 件では表せない。
   *
   * artboard を相手にしないのは、artboard が親 Box の中ではなくキャンバスの
   * 並びに置かれるため（`Artboard.boxProps` が `placement` を `flow` に固定する）。
   * `applyPropEdit` は名前で artboard を先に相手にするので、委譲する前に
   * ノードとして在ることを確かめる（そうしないと artboard の props に効かない
   * `x` / `y` が黙って書かれ、undo 履歴だけが 1 件増える）。
   *
   * @param document 書き換える対象を含むドキュメント
   * @param name 置き直すノードの名前
   * @param placement 置き直したあとの配置
   * @returns 座標を書き換えたドキュメント。その名前のノードが無ければ失敗
   *   （artboard の名前もノードではないので失敗する）
   */
  reposition(
    document: DesignDocument,
    name: string,
    placement: AbsolutePlacement,
  ): Result<DesignDocument, DesignDocumentEditError> {
    if (!DesignDocument.findNode(document, name).some) {
      return Result.err({ kind: "node-not-found", name });
    }
    return applyPropEdits(document, name, Placement.toPropEdits(placement));
  },

  /** 名前で指したノードを別のノードに差し替える。 */
  replaceNode(
    document: DesignDocument,
    name: string,
    node: Node,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return updateSiblingsOfNode(document, name, (siblings) =>
      NodeTree.create(
        NodeTree.nodes(siblings).map((sibling) =>
          sibling.name === name ? node : sibling,
        ),
      ),
    );
  },

  /**
   * 同一の親の中で子を動かす。移動元は「どの親の何番目か」で指す位置なので
   * 移動先は同じ親の中の index だけで決まる（親をまたぐ移動は `moveNode`）。
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
   * ノードを別の親の下へ移す（同一の親の中での並べ替えは `reorderNode`）。
   * 自分自身や自分の子孫を移動先に指定するとツリーが壊れるため、
   * `move-into-descendant` として失敗させる。
   */
  moveNode(
    document: DesignDocument,
    name: string,
    to: ChildPosition,
  ): Result<DesignDocument, DesignDocumentEditError> {
    const found = DesignDocument.findNode(document, name);
    if (!found.some) {
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
    if (!found.some) {
      return Result.err({ kind: "node-not-found", name });
    }
    const unavailable = unusableNameError(document, componentName);
    if (unavailable.some) {
      return Result.err(unavailable.value);
    }
    const component = Component.fromNode(found.value);
    if (!component.some) {
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
      const usedNames = DesignDocument.usedNames(document);
      /*
       * ここに来る `expanded` は参照ノードを展開したものだけで、その `children` は
       * 必ず配列（部品に子が無ければ空）。`ExpandedNode` の `children?` が省略可能
       * なのは、木の途中に居る子無しのプリミティブのため。
       */
      const children = DesignDocument.renameSubtree(
        expanded.children ?? [],
        usedNames,
      ).nodes;
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
   * 展開までしか見ないのは、`detach` の残り（名前の付け替えと置き換え）が
   * 失敗しないため。`DesignDocument.replaceNode` も `Result` を返すが、探索
   * （`findNode`）と置き換えは同じ `Node.children` の走査を通るので、探索できた
   * ノードの置き換えは必ず成功する。
   *
   * @param document 解除元のドキュメント
   * @param name 解除したいノードの名前
   * @returns 解除できるなら true
   */
  isDetachable(document: DesignDocument, name: string): boolean {
    return expandInstance(document, name).ok;
  },

  /** artboard をドキュメントの指定位置へ挿入する。 */
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

  /** 名前で指した artboard をドキュメントから取り除く。 */
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
   * 単一名前空間の名前で指したものを取り除く（docs/06-ui.md「編集操作の一覧」の
   * 削除と artboard 操作）。artboard ならその 1 枚を配下ごと、そうでなければ
   * ノードをサブツリーごと取り除く。
   *
   * 振り分けをここに置くのは、名前だけでは artboard かノードかが決まらず、
   * どのドキュメントの中の名前かで初めて引けるため（`applyPropEdit` / `resize` が
   * 同じ理由で名前から振り分けているのと同じ形）。呼び出し側で分けると
   * 「選んでいるものが artboard か」の判定が features 層へ出る。
   *
   * @param document 取り除く先のドキュメント
   * @param name 取り除きたい artboard / ノードの名前
   * @returns 取り除いたドキュメント。どちらにも無い名前は `node-not-found`
   *   （artboard でなければノードとして扱うため）
   */
  remove(
    document: DesignDocument,
    name: string,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return DesignDocument.findArtboard(document, name).some
      ? DesignDocument.removeArtboard(document, name)
      : DesignDocument.removeNode(document, name);
  },

  /** artboard の並び順を入れ替える。 */
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

  /** トークンの値を差し替える。 */
  replaceToken(
    document: DesignDocument,
    token: Token,
  ): Result<DesignDocument, DesignDocumentEditError> {
    return Result.map(TokenSet.replace(document.tokens, token), (tokens) => ({
      ...document,
      tokens,
    }));
  },

  /** トークンの名前を変える。 */
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

  /** トークンを削除する。 */
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
   * そのトークンを参照している箇所をすべて集める
   * （UI 案 docs/Design Composer.html の `Used by` / #127）。
   *
   * artboard の中（キャンバス上のもの）を先に、部品定義の中を後に並べる。
   * 一覧は先頭の数件しか出さないので、選択やキャンバスから指し示せるものを先に見せる
   * （`collectErrors` は部品を先に並べるが、あちらは全件を読む一覧なので順序の意味が違う）。
   *
   * UI 案（docs/Design Composer.html）の `Used by` はキャンバスの行と部品定義の行を
   * 交互に並べているが、それを再現できる大域順序が無いため規則で決めている
   * （先頭3件しか出ないので、どちらを先にするかは見える差になる）。
   *
   * トークンが実在するかは見ない。「その参照を指している prop はどれか」に答えるので、
   * 宙に浮いた参照（dangling）も同じ関数で数えられる（存在の確認は `TokenSet.has` の担当）。
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
   * キャンバスに描かれているものの中から、そのトークンを参照している箇所を集める（#147）。
   *
   * 走るのは artboard とその配下だけ。インスタンスは上書きしか持たず、その先の
   * 部品定義へは降りないので、ここで集まるものはすべてキャンバスに描かれている。
   *
   * 全体（`collectTokenReferrers`）から絞り込むのではなく走る範囲を狭めているのは、
   * 集めたあとに名前でドキュメントを引き直すと、由来を捨ててから復元することになるため。
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

  /** ドキュメントの単一名前空間で使われている名前。 */
  usedNames(document: DesignDocument): ReadonlySet<string> {
    return NameSpace.toSet(nameSpaceOf(document));
  },

  /** その名前が識別子の規則（kebab-case）を満たすか。 */
  isValidIdentifier(name: string): boolean {
    return NameSpace.isValidIdentifier(name);
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
    return !unusableNameError(document, name).some;
  },

  /** 使用済みの名前と衝突しない名前。衝突する場合は連番を付ける。 */
  uniqueName(baseName: string, usedNames: ReadonlySet<string>): string {
    return NameSpace.uniqueName(NameSpace.create([...usedNames]), baseName);
  },

  /** 部分木のノード名を、使用済みの名前と衝突しないよう付け替える。 */
  renameSubtree(
    nodes: readonly Node[],
    usedNames: ReadonlySet<string>,
  ): { nodes: readonly Node[]; renameMap: Readonly<Record<string, string>> } {
    const renameMap = NameSpace.renameMap(
      NameSpace.create([...usedNames]),
      nodes.flatMap(Node.collectNames),
    );
    return {
      nodes: nodes.map((node) => Node.rename(node, renameMap)),
      renameMap,
    };
  },

  /**
   * ドキュメントが仕様に適合しない箇所をすべて集める。
   * 最初の1件で止めないのは、不正なファイルのエラー一覧を出せるようにするため。
   * 適合の規則そのものは `validation/` が関心ごとに持ち、
   * ここは「どの部品・どの artboard を検証対象にするか」の取りまとめを行う。
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
        if (component === undefined) {
          return [];
        }
        return collectComponentErrors(context, name, component);
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
