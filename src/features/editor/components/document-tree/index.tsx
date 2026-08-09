import { useState } from "react";
import type { ChildPosition } from "@/domains/child-position";
import { Node, type PrimitiveNode } from "@/domains/node";
import type { TEXT_SCHEMA } from "@/domains/primitive-schema";
import { TypeGlyph } from "@/features/editor/components/type-glyph";
import { EditorState } from "@/features/editor/domains/editor-state";
import {
  Selection,
  type SelectionKind,
} from "@/features/editor/domains/selection";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";
import { SetEx } from "@/utils/SetEx";

/** 1 段ぶんの字下げ幅と、行の左端の余白（px）。 */
const INDENT_WIDTH_PX = 12;
const ROW_PADDING_PX = 8;

/**
 * 開閉の三角を置く枠（UI 案 docs/Design Composer.html の実測値は 10px）。
 * 子を持たない行でも同じ幅を空けて、型アイコンの左端を兄弟と揃える
 * （UI 案も子を持たない行に空の枠を置いている）。
 */
const BRANCH_TOGGLE_SLOT_STYLE = { width: "10px" };

/** 文言を読む prop。Text のスキーマが宣言している名前に限る。 */
const CONTENT_PROP = "content" satisfies keyof typeof TEXT_SCHEMA.props;

/**
 * 名前の右に出す補助情報。何を出すかは種別ごとに違うので、種別と値を対で持つ。
 */
type TreeItemNote =
  | Readonly<{ kind: "content"; text: string }>
  | Readonly<{ kind: "instance" }>;

/** 行が名前の左右に出すもの（左に型アイコン、右に補助情報）。 */
type TreeItemMarks = Readonly<{
  glyph: Option<SelectionKind>;
  note: Option<TreeItemNote>;
}>;

/**
 * Text の行に出す文言。空の文言では引用符だけが残るので出さない
 * （UI 案でも文言を持たない Text の行には補助情報が無い）。
 *
 * 既定値の解決を挟まないのは、`content` の既定が空文字で、解決しても
 * 出るものが変わらないため。
 */
function contentNote(node: PrimitiveNode): Option<TreeItemNote> {
  const content = node.props?.[CONTENT_PROP];
  if (content === undefined || content === "") {
    return Option.none;
  }
  return Option.some({ kind: "content", text: String(content) });
}

/**
 * 名前の右に出す補助情報。文言を持つのは Text だけで、Box には補助情報が無い。
 * 参照ノードはインスタンスであること自体を出す。
 */
function noteOf(node: Node): Option<TreeItemNote> {
  if (Node.isRef(node)) {
    return Option.some({ kind: "instance" });
  }
  return node.type === "Text" ? contentNote(node) : Option.none;
}

/**
 * 行が名前の左右に出すもの。
 *
 * 種別は `Selection` から引く。「そのノードが何であるか」は行が選ばれているかに
 * よらない性質で、インスペクタの見出しと同じ判定になるため（同じ分岐を 2 箇所に
 * 置かない / rules/coding.md「同じ処理が2箇所に現れたら共通化する」）。
 */
function nodeMarks(node: Node): TreeItemMarks {
  return { glyph: Selection.fromNode(node).kind, note: noteOf(node) };
}

/**
 * ツリーのどの行でも同じ値（今の見え方と、行から起こせる操作）。
 * 行ごとに props を積み増さないため 1 つにまとめる
 * （rules/components.md「props が概ね5個を超える…」）。
 *
 * 状態と操作を 1 つの型に持つのは `useCanvasView` が返す `CanvasViewControl` と
 * 同じ形で、この feature で既に使っている流儀に合わせている。
 */
type TreeControl = Readonly<{
  state: EditorState;
  /** 畳んでいる枝の名前。畳んだ側を持つので、開いた直後は空になる。 */
  collapsedNames: ReadonlySet<string>;
  onSelect: (name: string) => void;
  onReorder: (from: ChildPosition, toIndex: number) => void;
  onToggleBranch: (name: string) => void;
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

/** 行の右端に出る補助情報（大きさ・文言・インスタンスの印）。 */
function NoteText({ note }: Readonly<{ note: TreeItemNote }>) {
  /*
   * 補助情報は行の右端に出る（UI 案では名前と離れた位置に出る）。
   * 幅を半分までに抑えて自身も省略するのは、長い文言が名前を押し出さないため
   * （行が何のものかは名前で読むので、削るならまず補助情報を削る）。
   */
  const className = "min-w-0 max-w-1/2 truncate text-gray-400 text-xs";

  switch (note.kind) {
    case "content":
      return (
        <span aria-hidden="true" className={`${className} italic`}>
          "{note.text}"
        </span>
      );
    case "instance":
      return (
        <span aria-hidden="true" className={className}>
          inst
        </span>
      );
  }
}

/**
 * 名前を出して、押すとその名前を選ぶボタン。
 *
 * 型アイコンと補助情報を `aria-hidden` にしたうえで `aria-label` に名前を置くのは、
 * 選ぶ対象がノードの名前だからで、こうしないと読み上げ名が「T title Sign in」のように
 * 装飾を含んだ文字列になる。
 *
 * 選択の色は行の器（`TreeBranch`）が持つ。三角と字下げまで含めた行全体に色が付く形が
 * UI 案（docs/Design Composer.html）なので、名前のボタンだけを塗らない。
 */
function SelectableName({
  name,
  marks,
  isSelected,
  onSelect,
}: Readonly<{
  name: string;
  marks: TreeItemMarks;
  isSelected: boolean;
  onSelect: (name: string) => void;
}>) {
  return (
    <button
      type="button"
      aria-label={name}
      aria-current={isSelected}
      onClick={() => onSelect(name)}
      className="flex min-w-0 flex-1 items-center gap-1.5 pr-2 text-left"
    >
      {marks.glyph.some ? <TypeGlyph kind={marks.glyph.value} /> : null}
      {/*
        名前が余りを占め、補助情報はその右に出る。flex の子は既定で内容幅より
        縮まないため、省略には min-w-0 が要る。
      */}
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {marks.note.some ? <NoteText note={marks.note.value} /> : null}
    </button>
  );
}

/** 同じ親の中で 1 つ分だけ順序を動かすボタン。 */
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

/**
 * 枝を開閉する三角（UI 案 docs/Design Composer.html の `▾` / `▸`）。
 *
 * 名前のボタンとは別のボタンにする。名前の行が既に `button` で入れ子にできないことと、
 * 1 つのボタンに「選ぶ」と「開閉する」の 2 つの結果を持たせないため。
 *
 * ラベルを状態で変えないのは、押した瞬間に読み上げ名が変わって何を押したのかが
 * 分からなくなるため。開いているかどうかは `aria-expanded` が伝える。
 */
function BranchToggle({
  name,
  isExpanded,
  onToggle,
}: Readonly<{
  name: string;
  isExpanded: boolean;
  onToggle: () => void;
}>) {
  return (
    <button
      type="button"
      aria-label={`${name} の開閉`}
      aria-expanded={isExpanded}
      onClick={onToggle}
      style={BRANCH_TOGGLE_SLOT_STYLE}
      /*
       * 列の幅は名前の左端を揃えるための 10px だが、それだけでは押す的が小さすぎる。
       * 疑似要素で当たり判定だけを外へ広げ、行の組み方（列幅）は変えない。
       */
      className="relative shrink-0 text-[9px] text-gray-400 before:absolute before:-inset-1.5 before:content-['']"
    >
      {isExpanded ? "▾" : "▸"}
    </button>
  );
}

/**
 * ツリーの枝（1 行と、開いていればその下にぶら下がる子の並び）。
 * 字下げ・開閉の列・選択の色といった行の組み立てをここ 1 箇所に集める。
 *
 * 字下げ幅は深さで決まる値でクラス名に固定できないため、インラインスタイルで与える。
 */
function TreeBranch({
  node,
  placement,
  depth,
  control,
}: Readonly<{
  node: Node;
  placement: SiblingPlacement;
  depth: number;
  control: TreeControl;
}>) {
  const children = Node.children(node);
  const hasChildren = children.length > 0;
  const isExpanded = !control.collapsedNames.has(node.name);
  const isSelected = EditorState.isSelected(control.state, node.name);
  /*
   * 子の並びを出す条件。子がいない行は畳めないので常に「開いている」側に倒れるが、
   * 出すものが無いので空の <ul> を作らないよう子の有無も見る。
   */
  const showsChildren = hasChildren && isExpanded;

  return (
    <>
      <div
        style={{
          paddingInlineStart: `${ROW_PADDING_PX + depth * INDENT_WIDTH_PX}px`,
        }}
        className={`flex items-center gap-1.5 rounded py-1 pr-1 ${
          // 押せる範囲を示す hover と、選択の色を重ねない（選択中はホバーで灰にしない）
          isSelected ? "bg-blue-100 text-blue-900" : "hover:bg-gray-100"
        }`}
      >
        {hasChildren ? (
          <BranchToggle
            name={node.name}
            isExpanded={isExpanded}
            onToggle={() => control.onToggleBranch(node.name)}
          />
        ) : (
          // 子を持たない行にも同じ幅を空け、型アイコンの左端を兄弟と揃える
          <span
            aria-hidden="true"
            style={BRANCH_TOGGLE_SLOT_STYLE}
            className="shrink-0"
          />
        )}
        <SelectableName
          name={node.name}
          marks={nodeMarks(node)}
          isSelected={isSelected}
          onSelect={control.onSelect}
        />
        <ReorderButtons
          name={node.name}
          placement={placement}
          onReorder={control.onReorder}
        />
      </div>
      {showsChildren ? (
        <NodeList
          nodes={children}
          parentName={node.name}
          depth={depth + 1}
          control={control}
        />
      ) : null}
    </>
  );
}

/**
 * 同じ親を持つノードの並び。子も同じ形なので枝を通して自分自身へ戻る。
 * 各行の親の名前と兄弟内 index は描画をたどる過程でそのまま分かるため、
 * 並べ替えの位置を求めるのにツリーを探索する必要がない。
 *
 * 空の並びで呼ばれることはない（子を持つ枝が開いているときだけ描かれる）。
 */
function NodeList({
  nodes,
  parentName,
  depth,
  control,
}: Readonly<{
  nodes: readonly Node[];
  parentName: string;
  depth: number;
  control: TreeControl;
}>) {
  return (
    <ul>
      {nodes.map((node, index) => (
        <li key={node.name}>
          <TreeBranch
            node={node}
            placement={{ position: { parentName, index }, siblings: nodes }}
            depth={depth}
            control={control}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * 今見ている artboard の中身を出すツリービュー（docs/06-ui.md「画面構成」。
 * UI 案 docs/Design Composer.html の `Layers` パネル下段）。
 *
 * artboard 自身は行として出さない。UI 案は artboard を上段の `Artboards`
 * （`ArtboardList`）に並べ、ツリーはそのうちの 1 枚の中身だけを映す。どの 1 枚かは
 * 選択から決まる（`EditorState.currentArtboard`）ので、ここは持たない。
 *
 * どの枝を畳んでいるかは編集ではなく見え方なので、ドキュメントの状態
 * （`EditorState`）には持たずここに閉じる。畳んだ側の名前を持つので、開いた直後は
 * 全部が開いた状態になり、後から増えたノードが畳まれた状態で現れることもない。
 * ただし畳んだ名前は消えたノードのぶんも残るので、同じ名前でノードを作り直すと
 * 畳んだ状態で現れる（名前は使い回される。三角で状態は読めるので許容している）。
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
  const current = EditorState.currentArtboard(state);
  const [collapsedNames, setCollapsedNames] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  /*
   * 映す artboard が無いのは artboard が 1 枚も無いときだけで、それは
   * `ArtboardList` が伝える。ここで見出しだけを出すと、同じ「無い」を 2 箇所で言う。
   */
  if (!current.some) {
    return null;
  }

  const artboard = current.value;
  const control: TreeControl = {
    state,
    collapsedNames,
    onSelect,
    onReorder,
    onToggleBranch: (name) =>
      setCollapsedNames((current) => SetEx.toggle(current, name)),
  };

  return (
    /*
     * 左ペインには artboard の一覧とレールの行き先も並ぶため、ツリーの行だけを
     * 指せるよう領域として名前を持たせる（#39）。見出しの綴りは UI 案に合わせて
     * `Layers` だが、読み上げ名は他の領域と同じく日本語のまま置く
     * （パネルの見出しも `Layers` なので、そのまま名前にすると 2 つが同じ名前になる）。
     */
    <section aria-label="ツリー" className="text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-500 text-xs uppercase">
          Layers
        </h3>
        {/* どの artboard の中身を映しているかを右端に出す（UI 案の `login`） */}
        <span className="min-w-0 truncate text-gray-400 text-xs">
          {artboard.name}
        </span>
      </div>
      {artboard.children.length === 0 ? null : (
        <NodeList
          nodes={artboard.children}
          parentName={artboard.name}
          depth={0}
          control={control}
        />
      )}
    </section>
  );
}
