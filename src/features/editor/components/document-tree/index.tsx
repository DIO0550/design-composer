import type { ChildPosition } from "@/domains/child-position";
import { Node } from "@/domains/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/** 1 段ぶんの字下げ幅と、行の左端の余白（px）。 */
const INDENT_WIDTH_PX = 12;
const ROW_PADDING_PX = 8;

/**
 * ツリーのどの行でも同じ値。行ごとに props を積み増さないため 1 つにまとめる
 * （rules/components.md「props が概ね5個を超える…」）。
 */
type TreeHandlers = Readonly<{
  state: EditorState;
  onSelect: (name: string) => void;
  onReorder: (from: ChildPosition, toIndex: number) => void;
}>;

/**
 * 行が兄弟の並びのどこにいるか。
 * どちらの向きへ動かせるかは位置と並びの両方が無いと決まらないため 1 つの型にまとめる。
 */
type SiblingPlacement = Readonly<{
  position: ChildPosition;
  siblings: readonly Node[];
}>;

/** 並びの中に収まる移動先だけを返す（端では隣がいないので `none`）。 */
function moveTargetIndex(
  placement: SiblingPlacement,
  step: number,
): Option<number> {
  const toIndex = placement.position.index + step;
  return ArrayEx.isIndexInRange(placement.siblings, toIndex)
    ? Option.some(toIndex)
    : Option.none;
}

/** 参照ノードは部品のインスタンス（docs/06-ui.md）。どの部品の実体かを行に出す。 */
function instanceBadge(node: Node): Option<string> {
  return Node.isRef(node)
    ? Option.some(`（${node.ref} のインスタンス）`)
    : Option.none;
}

/**
 * 名前で選ぶ行。artboard もノードも「名前で選ぶ」点は同じなので 1 つで描く。
 * 字下げ幅は深さで決まる値でクラス名に固定できないため、インラインスタイルで与える。
 */
function SelectableRow({
  name,
  badge,
  depth,
  handlers,
}: Readonly<{
  name: string;
  badge: Option<string>;
  depth: number;
  handlers: TreeHandlers;
}>) {
  return (
    <button
      type="button"
      aria-current={EditorState.isSelected(handlers.state, name)}
      onClick={() => handlers.onSelect(name)}
      style={{
        paddingInlineStart: `${ROW_PADDING_PX + depth * INDENT_WIDTH_PX}px`,
      }}
      className="flex min-w-0 flex-1 flex-col items-start rounded py-1 pr-2 text-left hover:bg-gray-100 aria-[current=true]:bg-blue-100 aria-[current=true]:text-blue-900"
    >
      <span className="max-w-full truncate">{name}</span>
      {/*
        参照先は名前の下に置き、折り返して全部出す。横に並べると幅の狭いペインで
        名前が先に削られ、省略するとどの部品の実体かが読めなくなる。
      */}
      {badge.some ? (
        <span className="max-w-full text-gray-500 text-xs">{badge.value}</span>
      ) : null}
    </button>
  );
}

function ReorderButton({
  label,
  symbol,
  onClick,
}: Readonly<{
  label: string;
  symbol: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded border border-gray-300 px-1 text-gray-600 text-xs hover:bg-gray-100"
    >
      {symbol}
    </button>
  );
}

/**
 * 同じ親の中で子を動かすボタン（docs/06-ui.md「編集操作の一覧」の並べ替え）。
 * 隣がいない向きはボタン自体を出さず、並びの外を指す移動を画面から作れなくする。
 */
function ReorderButtons({
  name,
  placement,
  onReorder,
}: Readonly<{
  name: string;
  placement: SiblingPlacement;
  onReorder: (from: ChildPosition, toIndex: number) => void;
}>) {
  const toPrevious = moveTargetIndex(placement, -1);
  const toNext = moveTargetIndex(placement, 1);

  return (
    <span className="flex shrink-0 items-center gap-1">
      {toPrevious.some ? (
        <ReorderButton
          label={`${name} を上へ`}
          symbol="↑"
          onClick={() => onReorder(placement.position, toPrevious.value)}
        />
      ) : null}
      {toNext.some ? (
        <ReorderButton
          label={`${name} を下へ`}
          symbol="↓"
          onClick={() => onReorder(placement.position, toNext.value)}
        />
      ) : null}
    </span>
  );
}

function NodeRow({
  node,
  placement,
  depth,
  handlers,
}: Readonly<{
  node: Node;
  placement: SiblingPlacement;
  depth: number;
  handlers: TreeHandlers;
}>) {
  return (
    <div className="flex items-center gap-1 pr-1">
      <SelectableRow
        name={node.name}
        badge={instanceBadge(node)}
        depth={depth}
        handlers={handlers}
      />
      <ReorderButtons
        name={node.name}
        placement={placement}
        onReorder={handlers.onReorder}
      />
    </div>
  );
}

/**
 * 同じ親を持つノードの並び。子も同じ形なので自分自身で描く。
 * 各行の親の名前と兄弟内 index は描画をたどる過程でそのまま分かるため、
 * 並べ替えの位置を求めるのにツリーを探索する必要がない。
 */
function NodeList({
  nodes,
  parentName,
  depth,
  handlers,
}: Readonly<{
  nodes: readonly Node[];
  parentName: string;
  depth: number;
  handlers: TreeHandlers;
}>) {
  if (nodes.length === 0) {
    return null;
  }

  return (
    <ul>
      {nodes.map((node, index) => (
        <li key={node.name}>
          <NodeRow
            node={node}
            placement={{ position: { parentName, index }, siblings: nodes }}
            depth={depth}
            handlers={handlers}
          />
          <NodeList
            nodes={Node.children(node)}
            parentName={node.name}
            depth={depth + 1}
            handlers={handlers}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * ツリービュー（docs/06-ui.md「画面構成」）。
 * データモデルの木をそのまま出すので、折りたたみのような表示だけの状態は持たない。
 *
 * artboard 自身には並べ替えボタンを出さない。artboard の追加・削除・並べ替えは
 * 別の操作（#43）で、ここが担うのは同じ親の中の子順序だけ（#33）。
 */
export function DocumentTree({
  state,
  onSelect,
  onReorder,
}: Readonly<{
  state: EditorState;
  onSelect: (name: string) => void;
  onReorder: (from: ChildPosition, toIndex: number) => void;
}>) {
  const artboards = state.document.artboards;
  const handlers: TreeHandlers = { state, onSelect, onReorder };

  return (
    <section className="text-sm">
      <h2 className="mb-2 font-semibold text-gray-500 text-xs uppercase">
        ツリー
      </h2>
      {artboards.length === 0 ? (
        <p className="text-gray-500">artboard がありません</p>
      ) : (
        <ul>
          {artboards.map((artboard) => (
            <li key={artboard.name}>
              <div className="flex items-center gap-1 pr-1">
                <SelectableRow
                  name={artboard.name}
                  badge={Option.none}
                  depth={0}
                  handlers={handlers}
                />
              </div>
              <NodeList
                nodes={artboard.children}
                parentName={artboard.name}
                depth={1}
                handlers={handlers}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
