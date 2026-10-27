import type { NodeTemplate } from "@/domains/session/node-template";
import { Offset } from "@/domains/unit/offset";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import {
  DraggedNode,
  type DropTarget,
} from "@/features/editor/features/canvas/domains/node-drop";
import { RepositionGuides } from "@/features/editor/features/canvas/domains/reposition-guides";
import type { RepositionTarget } from "@/features/editor/features/canvas/domains/reposition-target";
import {
  SideSnap,
  type SnapGuides,
} from "@/features/editor/features/canvas/domains/side-snap";
import { Option } from "@/utils/Option";

/**
 * 掴んでいるものと、掴んだ位置。座標の移動量は掴んだ位置からの差で決まるので、どちらか
 * 片方だけでは意味を持たない。
 *
 * 対で 1 つの型にして、「掴んでいるのに掴んだ位置が無い」を書けなくする。
 */
export type Grab = Readonly<{ dragged: DraggedNode; origin: Offset }>;

/**
 * 何かを掴んでからキャンバスで離すまでの状態（docs/06-ui.md「キャンバス直接操作」の移動
 * と、「編集操作の一覧」の挿入）。
 *
 * 掴んだものを持つのは離すまで、落ちる先を持つのは動かしている間だけ、と状態ごとに持つ
 * ものが変わるため直和で列挙する。掴むのは既存ノードとパレットの雛形の 2 通りで、どちら
 * を運んでいるかは `DraggedNode` が持つ（分けると「両方ドラッグ中」が型で書けてしまう）。
 *
 * `dropped` は既存ノードを離した直後の状態。ブラウザは `pointerup` のあとに `click` を発火
 * させるので、これを挟まないと運んだ先の要素が選択されてしまう（移動は選択を変えない）。閾
 * 値未満の動きではここへ入らない。
 */
export type NodeDrag =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: "held"; grab: Grab }>
  | Readonly<{ kind: "dragging"; grab: Grab; carrying: Carrying }>
  | Readonly<{ kind: "dropped" }>;

/**
 * 今の落とし方（docs/06-ui.md「キャンバス直接操作」の移動と、「編集操作の一覧」の挿入）。
 * 離したときに届く編集と、離す前の提示の両方を答える。
 *
 * ツリーへ挿すのと座標を置き直すのは**排他**なので直和で列挙する（並べて持つと「挿入位
 * 置と座標の両方がある」が型で書けてしまう）。
 *
 * 分けて持つと「雛形を座標へ置き直す」が型で書け、受け取る側に捨てるだけの分岐が要る。
 */
export type DropEdit =
  | Readonly<{ kind: "move"; name: string; target: DropTarget }>
  | Readonly<{ kind: "insert"; template: NodeTemplate; target: DropTarget }>
  | Readonly<{
      kind: "reposition";
      name: string;
      /** 書き込む座標と向き、見た目のずらし量（座標とずらし量は**ドキュメント上の px**）。 */
      target: RepositionTarget;
      /** 揃った線のガイド線と揃え先との隙間、Alt / Option の距離の短い線（**画面上の px**）。 */
      guides: RepositionGuides;
    }>;

/**
 * 運んでいる間、掴んだノードをどれだけずらして見せるか。
 */
export type RepositionPreview = Readonly<{
  name: string;
  offset: Offset;
}>;

/**
 * 運んでいる間、今のポインタで決まっていること。
 *
 * **落とせるかどうかと、掴んだノードが追従するかどうかは別に決まる。** 座標のドラッグは
 * 落とせる親がポインタの下に無くてもポインタへ追従する（追従を止めると、キャンバスの
 * 余白へ一瞬寄っただけで元の位置へ戻り、何を運んでいるのか分からなくなる）。
 */
export type Carrying =
  | Readonly<{ kind: "nothing" }>
  | Readonly<{ kind: "preview"; preview: RepositionPreview }>
  | Readonly<{ kind: "droppable"; drop: DropEdit }>;

export const Carrying = {
  /**
   * 落とせず、掴んだノードも動かない（ツリーのドラッグで落とし先が無いとき）。
   *
   * @returns 落とし先も、ずらす見た目も、ガイド線も距離も持たない運び方
   */
  nothing(): Carrying {
    return { kind: "nothing" };
  },

  /**
   * 落とせないが、掴んだノードはポインタへ追従する（座標のドラッグ）。
   *
   * @param preview ずらして見せる相手と量
   * @returns 見た目だけが動く運び方
   */
  preview(preview: RepositionPreview): Carrying {
    return { kind: "preview", preview };
  },

  /**
   * 今離せば編集が届く運び方。
   *
   * @param drop 離したときに届く編集
   * @returns 落とせる運び方
   */
  droppable(drop: DropEdit): Carrying {
    return { kind: "droppable", drop };
  },

  /**
   * 今離したら届く編集。
   *
   * @param carrying 今の運び方
   * @returns 届く編集。落とせないなら `none`
   */
  drop(carrying: Carrying): Option<DropEdit> {
    switch (carrying.kind) {
      case "nothing":
      case "preview":
        return Option.none;
      case "droppable":
        return Option.some(carrying.drop);
    }
  },

  /**
   * 掴んだノードをずらして見せる相手と量。
   * 落とせるときは、届く編集が同じ量を持っている（同じ 1 回のドラッグなので、
   * 落とせる場所へ入った瞬間にずれ方が変わってはいけない）。
   *
   * @param carrying 今の運び方
   * @returns ずらして見せる相手と量。ツリーのドラッグなら `none`
   */
  repositionPreview(carrying: Carrying): Option<RepositionPreview> {
    switch (carrying.kind) {
      case "nothing":
        return Option.none;
      case "preview":
        return Option.some(carrying.preview);
      case "droppable":
        return DropEdit.repositionPreview(carrying.drop);
    }
  },

  /**
   * 揃った線（辺か中心線）に引くガイド線と、揃え先との隙間。
   *
   * @param carrying 今の運び方
   * @returns 引く線と隙間（画面上の px）。揃った線が無ければ縦横とも `none`
   */
  snapGuides(carrying: Carrying): SnapGuides {
    switch (carrying.kind) {
      case "nothing":
      case "preview":
        return SideSnap.NoGuides;
      case "droppable":
        return DropEdit.snapGuides(carrying.drop);
    }
  },

  /**
   * 上下左右それぞれ、最初に当たる相手までの距離の短い線（Alt / Option の距離）。
   *
   * @param carrying 今の運び方
   * @returns 向きごとの短い線（画面上の px）。落とせないなら全部 `none`
   */
  facingDistances(carrying: Carrying): FacingDistances {
    switch (carrying.kind) {
      case "nothing":
      case "preview":
        return FacingDistances.None;
      case "droppable":
        return DropEdit.facingDistances(carrying.drop);
    }
  },
} as const;

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
   * `target` と `guides`（吸い付きの線と Alt / Option の距離）を作る場所を `useNodeDrag` の
   * 1 箇所へ閉じている。
   *
   * 線は丸める前の実測から引くので、書かれる座標との差は丸めのぶん（最大 0.5px /
   * docs/06-ui.md）だけ残る。
   *
   * @param name 置き直すノードの名前
   * @param target 落とし先の親を基準に書き込む座標と向きと、運んでいる間のずらし量（座標と
   *   ずらし量はドキュメント上の px）
   * @param guides 吸い付いた線・揃え先との隙間と、Alt / Option の距離（除く前。画面上の px）
   * @returns 座標の置き直しの落とし方
   */
  reposition(
    name: string,
    target: RepositionTarget,
    guides: RepositionGuides,
  ): DropEdit {
    return { kind: "reposition", name, target, guides };
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
   * 揃った線に引くガイド線と、揃え先との隙間。ツリーへ落とすときは引かない
   * （辺の吸い付きが起きるのは座標の置き直しだけ / docs/06-ui.md）。
   *
   * @param edit 今の落とし方
   * @returns 引く線と隙間（画面上の px）。ツリーへの移動・挿入なら縦横とも `none`
   */
  snapGuides(edit: DropEdit): SnapGuides {
    switch (edit.kind) {
      case "move":
      case "insert":
        return SideSnap.NoGuides;
      case "reposition":
        return edit.guides.snap;
    }
  },

  /**
   * 上下左右それぞれ、最初に当たる相手までの距離の短い線。ツリーへ落とすときは測らない
   * （docs/06-ui.md の Alt / Option の距離）。揃え先との隙間と同じ線になる向きは除く。
   *
   * @param edit 今の落とし方
   * @returns 向きごとの短い線（画面上の px）。ツリーへの移動・挿入なら全部 `none`
   */
  facingDistances(edit: DropEdit): FacingDistances {
    switch (edit.kind) {
      case "move":
      case "insert":
        return FacingDistances.None;
      case "reposition":
        return RepositionGuides.distancesExceptGaps(edit.guides);
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
        return edit.target.written.to.parentName;
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
  /**
   * 操作を受ける前の状態を作る。
   *
   * @returns 何も掴んでいない状態
   */
  create(): NodeDrag {
    return { kind: "idle" };
  },

  /**
   * 掴む。まだ動かしていないので、この時点ではクリックと区別が付かない。
   *
   * @param grab 掴んだ時点の状態（`Grab`）
   * @returns 掴んだまま動かしていない状態
   */
  grab(grab: Grab): NodeDrag {
    return { kind: "held", grab };
  },

  /**
   * 掴んでいるものと掴んだ位置。動き出す前も掴んではいるので `held` でも答える。
   *
   * 分けると受け取る側が「片方だけある」場合の分岐を書くことになり、その分岐は実際には到達し
   * ない（＝テストで守れない）。
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
   * 押しただけで点くと、クリックのたびに一瞬光る。
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
   * @param drag 今のドラッグの状態
   * @returns 運んでいる雛形。動かしていない / 既存ノードを運んでいるときは `none`
   */
  carriedTemplate(drag: NodeDrag): Option<NodeTemplate> {
    return Option.flatMap(NodeDrag.carriedNode(drag), DraggedNode.template);
  },

  /**
   * ポインタの移動を反映する。閾値を越えたところで初めて「動かしている」状態になる。
   *
   * @param drag 今のドラッグの状態
   * @param pointer 画面上のポインタの位置
   * @param carrying そのポインタの位置で決まった運び方
   * @returns 動かしている最中なら、距離に依らず運び方を載せ替えた状態。掴んだまま動かして
   *   いないなら、掴んだ位置から閾値以上離れたときだけ動かしている状態、それまでは `drag`
   *   のまま。掴んでいなければ（ボタンを離したあとのマウス移動）`drag` のまま
   */
  moveTo(drag: NodeDrag, pointer: Offset, carrying: Carrying): NodeDrag {
    if (drag.kind === "dragging") {
      return { ...drag, carrying };
    }
    if (drag.kind !== "held") {
      return drag;
    }
    return Offset.distance(drag.grab.origin, pointer) < DragThresholdPx
      ? drag
      : { kind: "dragging", grab: drag.grab, carrying };
  },

  /**
   * 今ドロップしたら届く編集。動かしていて、かつ落とせる状態のときだけ。
   *
   * @param drag 今のドラッグの状態
   * @returns 移動・挿入・座標の置き直しのいずれか。動かしていない / 落とせる先が
   *   無いなら `none`
   */
  drop(drag: NodeDrag): Option<DropEdit> {
    return drag.kind === "dragging"
      ? Carrying.drop(drag.carrying)
      : Option.none;
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
   * 掴んだノードを今どれだけずらして見せるか。座標を動かすドラッグのときだけ答え、
   * **落とせる親がポインタの下に無くても答える**（`Carrying`）。
   *
   * 押しただけで見た目が動くと、クリックのたびにノードが一瞬ずれる。
   *
   * @param drag 今のドラッグの状態
   * @returns ずらして見せる相手と量。ツリーへの移動・挿入 / 動かしていないなら `none`
   */
  repositionPreview(drag: NodeDrag): Option<RepositionPreview> {
    return drag.kind === "dragging"
      ? Carrying.repositionPreview(drag.carrying)
      : Option.none;
  },

  /**
   * 揃った線に引くガイド線と、揃え先との隙間（docs/06-ui.md「キャンバス直接操作」の辺のスナップ）。
   *
   * 押しただけで線が出ると、クリックのたびに一瞬線が走る。
   *
   * @param drag 今のドラッグの状態
   * @returns 引く線と隙間（画面上の px）。動かしていない / 揃った線が無いなら縦横とも `none`
   */
  snapGuides(drag: NodeDrag): SnapGuides {
    return drag.kind === "dragging"
      ? Carrying.snapGuides(drag.carrying)
      : SideSnap.NoGuides;
  },

  /**
   * 上下左右それぞれ、最初に当たる相手までの距離の短い線（docs/06-ui.md の Alt / Option の
   * 距離）。動かしていない間に出さない理由は `NodeDrag.snapGuides` と同じ。
   *
   * @param drag 今のドラッグの状態
   * @returns 向きごとの短い線（画面上の px）。動かしていない / 落とせないなら全部 `none`
   */
  facingDistances(drag: NodeDrag): FacingDistances {
    return drag.kind === "dragging"
      ? Carrying.facingDistances(drag.carrying)
      : FacingDistances.None;
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
   * 指を離す。既存ノードを運んでいたなら直後の `click` を飲み込む状態へ入り、動かしてい
   * なかったなら掴んでいない状態へ戻す。
   *
   * 落とせたかどうかでは分けない。ノードの移動の選択について仕様に定めは無く、範囲選択が
   * 「範囲を引いていない操作をクリックと区別する」としている（docs/06-ui.md「範囲選択」）
   * のに揃えて、引いた操作はクリックとして扱わない。
   *
   * 飲み込む `click` がどこへ出るかは離した場所で変わるので、受けるのは枠ではなく運んで
   * いる間のポインタを受けている器（`useNodeDrag` の `dragHandlers`）。
   *
   * @param drag 今のドラッグの状態
   * @returns 直後の `click` を飲み込む状態、または何も掴んでいない状態
   */
  release(drag: NodeDrag): NodeDrag {
    const swallowsClick =
      drag.kind === "dragging" && drag.grab.dragged.kind === "existing";
    return swallowsClick ? { kind: "dropped" } : NodeDrag.create();
  },

  /**
   * 直後の `click` を選択に使わせないか。
   *
   * @param drag 今のドラッグの状態
   * @returns `dropped`（`NodeDrag` の型の doc）にいれば `true`
   */
  consumesClick(drag: NodeDrag): boolean {
    return drag.kind === "dropped";
  },

  /**
   * 閾値を越えて運んでいる最中か。
   *
   * @param drag 今のドラッグの状態
   * @returns 動かしている状態なら `true`
   */
  isDragging(drag: NodeDrag): boolean {
    return drag.kind === "dragging";
  },
} as const;
