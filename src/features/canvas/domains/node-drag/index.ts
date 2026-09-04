import { DesignDocument } from "@/domains/dcmp/design-document";
import type { NodeTemplate } from "@/domains/session/node-template";
import { Offset } from "@/domains/unit/offset";
import {
  DraggedNode,
  type DropTarget,
} from "@/features/canvas/domains/node-drop";
import type { RepositionTarget } from "@/features/canvas/domains/reposition-target";
import { Option } from "@/utils/Option";

/**
 * 掴んでいるものと、掴んだ位置。
 * 座標の移動量は掴んだ位置からの差で決まるので、どちらか片方だけでは意味を持たない。
 * 対で 1 つの型にして、「掴んでいるのに掴んだ位置が無い」を書けなくする。
 */
export type Grab = Readonly<{ dragged: DraggedNode; origin: Offset }>;

/**
 * 何かを掴んでからキャンバスで離すまでの状態（docs/06-ui.md「キャンバス直接操作」の
 * 移動と、「編集操作の一覧」の挿入）。
 *
 * 掴んだものを持つのは離すまで、落ちる先を持つのは動かしている間だけ、と
 * 状態ごとに持つものが変わるため直和で列挙する（「動かしていないのに落ちる先がある」
 * のような組み合わせを作れなくするため）。
 *
 * 掴むのはキャンバス上の既存ノードとパレットの雛形の2通りで、どちらを運んでいるかは
 * `DraggedNode` が持つ。状態遷移は同じ（閾値・落とし先の解決・提示）なので、
 * 2つのドラッグには分けない。分けるとキャンバスが落とし先を2つ受け取ることになり、
 * 「両方ドラッグ中」が型で書けてしまう。
 *
 * `dropped` は既存ノードを離した直後の状態。ブラウザは `pointerup` のあとに `click` を
 * 発火させるので、これを挟まないと運んだ先の要素が選択されてしまう（選択を持つのは
 * 編集画面の側で / #35、移動は選択を変えない）。閾値未満の動き（＝ただのクリック）
 * ではここへ入らない。
 */
export type NodeDrag =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "held"; grab: Grab }>
  | Readonly<{ kind: "dragging"; grab: Grab; drop: Option<DropEdit> }>
  | Readonly<{ kind: "dropped" }>;

/**
 * 今の落とし方（docs/06-ui.md「キャンバス直接操作」の移動と、
 * 「編集操作の一覧」の挿入）。離したときに届く編集と、離す前の提示の両方を答える。
 *
 * ツリーへ挿すのと座標を置き直すのは**排他**なので直和で列挙する。
 * 並べて持つと「挿入位置と座標の両方がある」が型で書けてしまう。
 *
 * 落とし先だけでなく**誰を**動かすかまで持つのは、運んでいるものと落とし方に
 * 成立しない組み合わせがあるため（パレットの雛形はまだ木に無いので座標を持てない）。
 * 分けて持つと「雛形を座標へ置き直す」が型で書け、受け取る側に捨てるだけの分岐が要る。
 */
export type DropEdit =
  | Readonly<{ kind: "move"; name: string; target: DropTarget }>
  | Readonly<{ kind: "insert"; template: NodeTemplate; target: DropTarget }>
  | Readonly<{ kind: "reposition"; name: string; target: RepositionTarget }>;

/**
 * 運んでいる間、掴んだノードをどれだけずらして見せるか。
 *
 * 書かれる座標ではなく画面上のずらし量を持つのは、親を付け替えると座標の原点が
 * 変わる一方で、**見た目は動かない**ため（`RepositionTarget`）。
 */
export type RepositionPreview = Readonly<{
  name: string;
  offset: Offset;
}>;

export const DropEdit = {
  /**
   * ツリーの中へ落とす編集。
   * 運んでいるものが既存ノードなら移動、パレットの雛形なら挿入になる。
   *
   * @param dragged 運んでいるもの
   * @param target 落とせる親と、その中での挿入位置
   * @returns 移動または挿入の編集
   */
  intoTree(dragged: DraggedNode, target: DropTarget): DropEdit {
    return dragged.kind === "existing"
      ? { kind: "move", name: dragged.name, target }
      : { kind: "insert", template: dragged.template, target };
  },

  /**
   * 落とし先の親の中の座標へ置き直す編集。既存ノードにしか起きない。
   *
   * @param name 置き直すノードの名前
   * @param target 落とし先の親から見た座標と、運んでいる間のずらし量
   * @returns 座標の置き直しの落とし方
   */
  reposition(name: string, target: RepositionTarget): DropEdit {
    return { kind: "reposition", name, target };
  },

  /**
   * ツリーへ挿さる位置。座標の置き直しでは持たない。
   *
   * @param edit 届く編集
   * @returns 挿さる位置。座標の置き直しなら `none`
   */
  insertionTarget(edit: DropEdit): Option<DropTarget> {
    switch (edit.kind) {
      case "move":
      case "insert":
        return Option.some(edit.target);
      case "reposition":
        return Option.none;
    }
  },

  /**
   * 運んでいるノードをずらして見せる相手と量。ツリーへ落とすときは持たない
   * （そちらは実体を動かさず、ドロップ線で落ちる先を見せる）。
   *
   * @param edit 今の落とし方
   * @returns ずらして見せる相手と量。ツリーへの移動・挿入なら `none`
   */
  repositionPreview(edit: DropEdit): Option<RepositionPreview> {
    switch (edit.kind) {
      case "move":
      case "insert":
        return Option.none;
      case "reposition":
        return Option.some({ name: edit.name, offset: edit.target.offset });
    }
  },

  /**
   * 今ドロップしたら子になる親の名前。ツリーへ落とすときも座標を置き直すときも、
   * 落ちる先の親は決まっている（枠で提示するのに使う）。
   *
   * @param edit 今の落とし方
   * @returns 落ちる先の親の名前
   */
  dropParentName(edit: DropEdit): string {
    switch (edit.kind) {
      case "move":
      case "insert":
        return edit.target.position.parentName;
      case "reposition":
        return edit.target.to.parentName;
    }
  },
} as const;

/**
 * ここまでの動きはクリックとして扱う（px）。
 * 閾値を置かないと、押したときの手ぶれで選択がドラッグに化けて選択できなくなる。
 *
 * artboard のドラッグ（`ArtboardDrag`）も同じ閾値で判定するので export している。
 * 掴む対象が違っても、手ぶれをクリックとして扱う境目は同じ。
 */
export const DragThresholdPx = 4;

export const NodeDrag = {
  /** 何も掴んでいない状態から始める。 */
  create(): NodeDrag {
    return { kind: "idle" };
  },

  /**
   * 内側から外へ並べた候補のうち、最も内側の掴めるノードの名前。
   *
   * 掴めるのは artboard 配下のノードだけ。artboard 自身の名前はどのツリーにも無いので
   * （`Artboard.findNode` が探すのは `children`）ここでは引けず、ツリー内の移動先も
   * 持たない（artboard の並べ替えは別の操作 / docs/06-ui.md「編集操作の一覧」）。
   *
   * **artboard の背景を押したときにここが `none` を返すことに、キャンバスの掴み分けが
   * 載っている**（`ArtboardFrame` の `onPointerDown`）。引けるようにすると、背景を
   * 押しても artboard が動かなくなる。
   * 部品インスタンスの中身はドキュメントの木に無いので、そこを押すと
   * インスタンス自身が掴まれる（選択と同じ振る舞い / #35）。
   *
   * @param document 名前の引き先になるドキュメント
   * @param names 押された位置から根へ向かう順のノード名
   * @returns 最も内側の掴めるノードの名前。1つも掴めなければ `none`
   */
  grabbableName(
    document: DesignDocument,
    names: readonly string[],
  ): Option<string> {
    return Option.fromNullable(
      names.find((name) => DesignDocument.findNode(document, name).some),
    );
  },

  /** 掴む。まだ動かしていないので、この時点ではクリックと区別が付かない。 */
  grab(grab: Grab): NodeDrag {
    return { kind: "held", grab };
  },

  /**
   * 掴んでいるものと掴んだ位置。動き出す前も掴んではいるので `held` でも答える。
   *
   * 2 つを別々のアクセサに分けないのは、どちらも同じ状態でだけ存在するため。
   * 分けると受け取る側が「片方だけある」場合の分岐を書くことになり、その分岐は
   * 実際には到達しない（＝テストで守れない）。
   *
   * @param drag 今のドラッグの状態
   * @returns 掴んでいるものと掴んだ位置。掴んでいなければ `none`
   */
  grabbed(drag: NodeDrag): Option<Grab> {
    switch (drag.kind) {
      case "held":
      case "dragging":
        return Option.some(drag.grab);
      case "idle":
      case "dropped":
        return Option.none;
    }
  },

  /**
   * 今まさに運んでいるもの。閾値を越えて動かしている間だけ答える。
   *
   * `grabbed` と分けているのは、掴んだ行の強調やツールバーの点灯が「運んでいる」
   * ことの表示だから。押しただけで点くと、クリックのたびに一瞬光る。
   *
   * @param drag 今のドラッグの状態
   * @returns 運んでいるもの。動かしていなければ `none`
   */
  carriedNode(drag: NodeDrag): Option<DraggedNode> {
    return drag.kind === "dragging"
      ? Option.some(drag.grab.dragged)
      : Option.none;
  },

  /**
   * 今まさにパレットから運んでいる雛形。
   *
   * 運んでいるものの種別まで見るのは、掴んだ行の強調とキャンバスのツールバーの点灯が
   * 「パレットから運んでいる」ときだけの表示だから（既存ノードの移動では点かない）。
   *
   * @param drag 今のドラッグの状態
   * @returns 運んでいる雛形。動かしていない / 既存ノードを運んでいるときは `none`
   */
  carriedTemplate(drag: NodeDrag): Option<NodeTemplate> {
    return Option.flatMap(NodeDrag.carriedNode(drag), DraggedNode.template);
  },

  /**
   * ポインタの移動を反映する。閾値を越えたところで初めて「動かしている」状態になる。
   * 掴んでいなければ何も起きない（ボタンを離したあとのマウス移動）。
   */
  moveTo(drag: NodeDrag, pointer: Offset, drop: Option<DropEdit>): NodeDrag {
    if (drag.kind === "dragging") {
      return { ...drag, drop };
    }
    if (drag.kind !== "held") {
      return drag;
    }
    return Offset.distance(drag.grab.origin, pointer) < DragThresholdPx
      ? drag
      : { kind: "dragging", grab: drag.grab, drop };
  },

  /**
   * 今ドロップしたら届く編集。動かしていて、かつ落とせる状態のときだけ。
   *
   * @param drag 今のドラッグの状態
   * @returns 移動・挿入・座標の置き直しのいずれか。動かしていない / 落とせる先が
   *   無いなら `none`
   */
  drop(drag: NodeDrag): Option<DropEdit> {
    return drag.kind === "dragging" ? drag.drop : Option.none;
  },

  /**
   * 今ドロップしたら挿さる位置。ツリーへ落とすときだけ答える。
   *
   * ドロップ線とラベルは「どの親の何番目の子になるか」の提示なので、
   * 座標を置き直すドラッグでは出さない。
   *
   * @param drag 今のドラッグの状態
   * @returns 挿さる位置。座標の置き直し / 動かしていないなら `none`
   */
  insertionTarget(drag: NodeDrag): Option<DropTarget> {
    return Option.flatMap(NodeDrag.drop(drag), DropEdit.insertionTarget);
  },

  /**
   * 今ドロップしたら、掴んだノードをどれだけずらして見せるか。
   * 座標を動かすドラッグのときだけ答える。
   *
   * 掴んだだけ（閾値未満）では答えないのは、`drop` を経由しているため。
   * 押しただけで見た目が動くと、クリックのたびにノードが一瞬ずれる。
   *
   * @param drag 今のドラッグの状態
   * @returns ずらして見せる相手と量。ツリーへの移動・挿入 / 動かしていないなら `none`
   */
  repositionPreview(drag: NodeDrag): Option<RepositionPreview> {
    return Option.flatMap(NodeDrag.drop(drag), DropEdit.repositionPreview);
  },

  /**
   * 今ドロップしたら子になる親の名前。落とし方に依らず答えるので、ツリーの移動でも
   * 座標の置き直しでも同じ枠で提示できる。
   *
   * @param drag 今のドラッグの状態
   * @returns 落ちる先の親の名前。落とせる先が無い / 動かしていないなら `none`
   */
  dropParentName(drag: NodeDrag): Option<string> {
    return Option.map(NodeDrag.drop(drag), DropEdit.dropParentName);
  },

  /**
   * 指を離す。
   *
   * 既存ノードを運んでいたなら直後の `click` を飲み込む状態へ入る。パレットの雛形を
   * 運んでいたときに入らないのは、押した場所（パレットの行）と離した場所（キャンバス）が
   * 別の枝にあり、`click` が両者の共通の祖先へ飛ぶため。キャンバスの枠までは上がって
   * こないので飲み込むものが無く、それでも `dropped` に入ると**次のクリック**を
   * 食べてしまう（選択が1回黙って消える）。
   *
   * 動かしていなかったなら何も起きていないので、どちらの場合も掴んでいない状態へ戻す。
   */
  release(drag: NodeDrag): NodeDrag {
    const swallowsClick =
      drag.kind === "dragging" && drag.grab.dragged.kind === "existing";
    return swallowsClick ? { kind: "dropped" } : NodeDrag.create();
  },

  /** 直後の `click` を選択に使わせないか（上の `dropped` の説明を参照）。 */
  consumesClick(drag: NodeDrag): boolean {
    return drag.kind === "dropped";
  },

  isDragging(drag: NodeDrag): boolean {
    return drag.kind === "dragging";
  },
} as const;
