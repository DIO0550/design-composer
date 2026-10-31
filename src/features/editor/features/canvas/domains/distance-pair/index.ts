import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
import { SelectionDigs } from "@/domains/session/selection-dig";
import { CanvasBounds } from "@/features/editor/features/canvas/domains/canvas-bounds";
import { FacingDistances } from "@/features/editor/features/canvas/domains/facing-distances";
import type { Pointing } from "@/features/editor/features/canvas/domains/pointing";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * 選択しているだけのときの Alt / Option の距離を測る 2 つ（docs/06-ui.md「キャンバス直接操作」
 * の、選択しているだけのときの Alt / Option の距離）。名前で持つ。
 *
 * - `within`: `inner` から、それを包む `outer` の内側の縁まで上下左右を測る
 * - `beside`: 親子の関係に無い 2 つで、`from` から `to` まで離れている向きを測る
 */
export type DistancePair =
  | Readonly<{ kind: "within"; inner: string; outer: string }>
  | Readonly<{ kind: "beside"; from: string; to: string }>;

/** `DistancePair` の 2 つを、描かれている矩形（client 座標）に置き換えたもの。 */
export type DrawnDistancePair =
  | Readonly<{ kind: "within"; inner: CanvasBounds; outer: CanvasBounds }>
  | Readonly<{ kind: "beside"; from: CanvasBounds; to: CanvasBounds }>;

/** 選んでいるノードと、それを包んでいるもの。 */
type SelectedNode = Readonly<{
  name: string;
  /** 直接包んでいるもの（ノードか artboard） */
  parent: string;
  /** 載っている artboard */
  artboard: string;
  /** 包んでいるものの名前（内→外。先頭が `parent`、末尾が `artboard`） */
  ancestors: readonly string[];
}>;

/**
 * 選んでいるノードとその祖先。
 *
 * @param selection 選択とドキュメントの出どころ
 * @returns 1 つだけ選んでいて、それが親を持つノードなら名前と祖先。未選択・複数選択・
 *   artboard の選択・ドキュメントに無い名前は `none`
 */
function selectedNodeOf(selection: DocumentSelection): Option<SelectedNode> {
  return Option.flatMap(DocumentSelection.singleName(selection), (name) => {
    const ancestors = DesignDocument.collectAncestorNames(
      selection.document,
      name,
    );
    return Option.flatMap(ArrayEx.first(ancestors), (parent) =>
      Option.map(ArrayEx.last(ancestors), (artboard) => ({
        name,
        parent,
        artboard,
        ancestors,
      })),
    );
  });
}

/**
 * 選んでいるノードを、それを包む `outer` の内側の縁で測る組。
 *
 * @param selected 選んでいるノード
 * @param outer 包んでいるものの名前
 * @returns `within` の組
 */
function withinOf(selected: SelectedNode, outer: string): DistancePair {
  return { kind: "within", inner: selected.name, outer };
}

/**
 * 選んでいるノードと同じ親の中を指しているときの、その親の直下の子（兄弟）。
 *
 * @param selection 兄弟がロック中かを引くドキュメントの出どころ
 * @param selected 選んでいるノード
 * @param names 指している位置から外へ辿った名前（内→外）
 * @returns 指している位置を含む、親の直下の子の名前。親の中を指していない / 親の背景
 *   （直下の子の無いところ）を指している / その子がロック中なら `none`
 */
function siblingAt(
  selection: DocumentSelection,
  selected: SelectedNode,
  names: readonly string[],
): Option<string> {
  const parentIndex = names.indexOf(selected.parent);
  if (parentIndex <= 0) {
    return Option.none;
  }
  const child = names[parentIndex - 1];
  return DesignDocument.isLocked(selection.document, child)
    ? Option.none
    : Option.some(child);
}

/**
 * 枠の上を指しているときの相手。
 *
 * @param selection 選択とドキュメントの出どころ
 * @param pointing 枠の上の指し先
 * @param selected 選んでいるノード
 * @returns 相手の名前。別の artboard を指している / 指した位置にクリックが選ぶものが無けれ
 *   ば `none`
 */
function counterpartAt(
  selection: DocumentSelection,
  pointing: Extract<Pointing, { kind: "on-frame" }>,
  selected: SelectedNode,
): Option<string> {
  const pointedArtboard = ArrayEx.first(
    pointing.names.filter((name) =>
      Option.isSome(DesignDocument.findArtboard(selection.document, name)),
    ),
  );
  if (!Option.contains(pointedArtboard, selected.artboard)) {
    return Option.none;
  }
  const sibling =
    pointing.dig === SelectionDigs.Deepest
      ? Option.none
      : siblingAt(selection, selected, pointing.names);
  return Option.or(
    sibling,
    DocumentSelection.nameToSelectAt(selection, pointing.names, pointing.dig),
  );
}

/**
 * 選んでいるノードと相手の木の上の関係から、測る組を決める。
 *
 * @param selection 相手の祖先を引くドキュメントの出どころ
 * @param selected 選んでいるノード
 * @param counterpart 相手の名前
 * @returns 相手が自分なら親、祖先ならその相手の内側の縁、子孫なら相手から自分の内側の縁、
 *   それ以外は横並びの組
 */
function pairWith(
  selection: DocumentSelection,
  selected: SelectedNode,
  counterpart: string,
): DistancePair {
  if (counterpart === selected.name) {
    return withinOf(selected, selected.parent);
  }
  if (selected.ancestors.includes(counterpart)) {
    return withinOf(selected, counterpart);
  }
  const counterpartAncestors = DesignDocument.collectAncestorNames(
    selection.document,
    counterpart,
  );
  if (counterpartAncestors.includes(selected.name)) {
    return { kind: "within", inner: counterpart, outer: selected.name };
  }
  return { kind: "beside", from: selected.name, to: counterpart };
}

export const DistancePair = {
  /**
   * 今の選択と指し先から、測る 2 つを決める（docs/06-ui.md「キャンバス直接操作」の、選択
   * しているだけのときの Alt / Option の距離）。
   *
   * 相手はクリックが選ぶもの（`DocumentSelection.nameToSelectAt`）。ただし掘る量が
   * `Deepest` でなく、選択と同じ親の中を指していれば、その親の直下の子（ロック中は除く）を
   * 相手にする。相手が無い（枠の外・別の artboard を指している）・自分自身のときは親で測る。
   *
   * @param selection 選択とドキュメントの出どころ
   * @param pointing ポインタの指し先
   * @returns 測る 2 つ。1 つだけ選んだノード以外を選んでいる / キャンバスの外を指して
   *   いるときは `none`
   */
  create(
    selection: DocumentSelection,
    pointing: Pointing,
  ): Option<DistancePair> {
    return Option.flatMap(selectedNodeOf(selection), (selected) => {
      switch (pointing.kind) {
        case "outside":
          return Option.none;
        case "nothing":
          return Option.some(withinOf(selected, selected.parent));
        case "on-frame": {
          const counterpart = counterpartAt(selection, pointing, selected);
          return Option.some(
            Option.isSome(counterpart)
              ? pairWith(selection, selected, counterpart.value)
              : withinOf(selected, selected.parent),
          );
        }
      }
    });
  },

  /**
   * 2 つを描かれている矩形に置き換える。
   *
   * @param pair 測る 2 つ
   * @param measure 名前から描かれている矩形を測る手段
   * @returns 矩形に置き換えた組。どちらかが測れなければ `none`
   */
  measure(
    pair: DistancePair,
    measure: (name: string) => Option<CanvasBounds>,
  ): Option<DrawnDistancePair> {
    switch (pair.kind) {
      case "within":
        return Option.flatMap(measure(pair.inner), (inner) =>
          Option.map(measure(pair.outer), (outer) => ({
            kind: "within" as const,
            inner,
            outer,
          })),
        );
      case "beside":
        return Option.flatMap(measure(pair.from), (from) =>
          Option.map(measure(pair.to), (to) => ({
            kind: "beside" as const,
            from,
            to,
          })),
        );
    }
  },
} as const;

export const DrawnDistancePair = {
  /**
   * 組の 2 つの間に引く短い線。
   *
   * @param drawn 矩形に置き換えた組
   * @returns `within` は `inner` から `outer` の内側の縁までの上下左右、`beside` は `from`
   *   から `to` まで離れている向き（線の引き方は `FacingDistances`）
   */
  toDistances(drawn: DrawnDistancePair): FacingDistances {
    switch (drawn.kind) {
      case "within":
        return FacingDistances.create({
          from: drawn.inner,
          parentBounds: drawn.outer,
          siblings: [],
        });
      case "beside":
        return FacingDistances.createAmong({
          from: drawn.from,
          others: [drawn.to],
        });
    }
  },

  /**
   * 2 つの組が同じ矩形を指しているか。
   *
   * @param a 比べる組
   * @param b 比べる組
   * @returns 種類が同じで、2 つの矩形がどちらも等しければ真
   */
  equals(a: DrawnDistancePair, b: DrawnDistancePair): boolean {
    switch (a.kind) {
      case "within":
        return (
          b.kind === "within" &&
          CanvasBounds.equals(a.inner, b.inner) &&
          CanvasBounds.equals(a.outer, b.outer)
        );
      case "beside":
        return (
          b.kind === "beside" &&
          CanvasBounds.equals(a.from, b.from) &&
          CanvasBounds.equals(a.to, b.to)
        );
    }
  },
} as const;
