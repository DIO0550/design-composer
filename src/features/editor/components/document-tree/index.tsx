import { type ReactNode, useState } from "react";
import type { Artboard } from "@/domains/artboard";
import type { ChildPosition } from "@/domains/child-position";
import { Node, type PrimitiveNode } from "@/domains/node";
import {
  PrimitiveSchema,
  type PrimitiveType,
  type TEXT_SCHEMA,
} from "@/domains/primitive-schema";
import { EditorState } from "@/features/editor/domains/editor-state";
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
 * 行が表す対象の種別。UI 案（docs/Design Composer.html）は artboard・プリミティブ・
 * 部品インスタンスをそれぞれ別のアイコンで描き分ける。
 *
 * プリミティブの綴りを直接並べず `PrimitiveType` から導出するのは、primitive が
 * 増えたときにアイコンの取りこぼしをコンパイルエラーにするため。
 */
type TreeItemKind = "artboard" | PrimitiveType | "instance";

/** 名前の左に出す型アイコン。字面と色の対で 1 つの種別を表す。 */
type TypeGlyph = Readonly<{ symbol: string; className: string }>;

/**
 * 種別ごとの型アイコン。字面・色はいずれも UI 案の default 状態から採った値で、
 * Tailwind の色名に対応するものが無いため実際の色をそのまま書いている。
 */
const TYPE_GLYPHS = {
  artboard: { symbol: "▢", className: "text-[#0d99ff]" },
  Box: { symbol: "□", className: "text-[#00a0a0]" },
  Text: { symbol: "T", className: "font-bold text-[#c67c00]" },
  instance: { symbol: "◆", className: "text-[#8b5cf6]" },
} as const satisfies Readonly<Record<TreeItemKind, TypeGlyph>>;

/**
 * 名前の右に出す補助情報。何を出すかは種別ごとに違い、出どころも違う
 * （大きさは artboard 自身が、文言は props が持つ）ので、種別と値を対で持つ。
 */
type TreeItemNote =
  | Readonly<{ kind: "size"; width: number; height: number }>
  | Readonly<{ kind: "content"; text: string }>
  | Readonly<{ kind: "instance" }>;

/**
 * 行が名前の左右に出すもの。アイコンと補助情報はどちらも同じ種別から決まるため、
 * 種別の判定を 2 度行わずに済むよう 1 つにまとめて求める。
 */
type TreeItemMarks = Readonly<{
  glyph: Option<TypeGlyph>;
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

/** プリミティブが出すもの。文言を持つのは Text だけで、Box には補助情報が無い。 */
function primitiveMarks(node: PrimitiveNode): TreeItemMarks {
  if (!PrimitiveSchema.isPrimitiveType(node.type)) {
    // UI 案に無い type にはアイコンを当てず、種別が分からないことをそのまま出す
    return { glyph: Option.none, note: Option.none };
  }
  return {
    glyph: Option.some(TYPE_GLYPHS[node.type]),
    note: node.type === "Text" ? contentNote(node) : Option.none,
  };
}

function nodeMarks(node: Node): TreeItemMarks {
  if (Node.isRef(node)) {
    return {
      glyph: Option.some(TYPE_GLYPHS.instance),
      note: Option.some({ kind: "instance" }),
    };
  }
  return primitiveMarks(node);
}

/** artboard は自分が持つ幅・高さを出す（UI 案の `720×900`）。 */
function artboardMarks(artboard: Artboard): TreeItemMarks {
  return {
    glyph: Option.some(TYPE_GLYPHS.artboard),
    note: Option.some({
      kind: "size",
      width: artboard.width,
      height: artboard.height,
    }),
  };
}

/**
 * ツリーに 1 行として並ぶもの。artboard とノードは出どころが違うだけで、
 * 行としては「名前・左右に出すもの・下にぶら下がる子」の 3 つで同じ形になる。
 */
type TreeItem = Readonly<{
  name: string;
  marks: TreeItemMarks;
  children: readonly Node[];
}>;

function artboardItem(artboard: Artboard): TreeItem {
  return {
    name: artboard.name,
    marks: artboardMarks(artboard),
    children: artboard.children,
  };
}

function nodeItem(node: Node): TreeItem {
  return {
    name: node.name,
    marks: nodeMarks(node),
    children: Node.children(node),
  };
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

function NoteText({ note }: Readonly<{ note: TreeItemNote }>) {
  /*
   * 補助情報は行の右端に出る（UI 案では名前と離れた位置に出る）。
   * 幅を半分までに抑えて自身も省略するのは、長い文言が名前を押し出さないため
   * （行が何のものかは名前で読むので、削るならまず補助情報を削る）。
   */
  const className = "min-w-0 max-w-1/2 truncate text-gray-400 text-xs";

  switch (note.kind) {
    case "size":
      return (
        <span aria-hidden="true" className={className}>
          {note.width}×{note.height}
        </span>
      );
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
 * 名前を出して、押すとその名前を選ぶボタン。artboard もノードも
 * 「名前で選ぶ」点は同じなので 1 つで描く。
 *
 * 型アイコンと補助情報を `aria-hidden` にしたうえで `aria-label` に名前を置くのは、
 * 選ぶ対象がノードの名前だからで、こうしないと読み上げ名が「▢ home 360×240」のように
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
      {marks.glyph.some ? (
        <span
          aria-hidden="true"
          className={`shrink-0 ${marks.glyph.value.className}`}
        >
          {marks.glyph.value.symbol}
        </span>
      ) : null}
      {/*
        名前が余りを占め、補助情報はその右に出る。flex の子は既定で内容幅より
        縮まないため、省略には min-w-0 が要る。
      */}
      <span className="min-w-0 flex-1 truncate">{name}</span>
      {marks.note.some ? <NoteText note={marks.note.value} /> : null}
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
 * artboard の行とノードの行は右に並べ替えを置くかどうかだけが違うので、
 * 枝の組み立て（字下げ・開閉の列・選択の色）はここ 1 箇所に集める。
 *
 * 字下げ幅は深さで決まる値でクラス名に固定できないため、インラインスタイルで与える。
 */
function TreeBranch({
  item,
  depth,
  control,
  trailing,
}: Readonly<{
  item: TreeItem;
  depth: number;
  control: TreeControl;
  trailing?: ReactNode;
}>) {
  const hasChildren = item.children.length > 0;
  const isExpanded = !control.collapsedNames.has(item.name);
  const isSelected = EditorState.isSelected(control.state, item.name);
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
            name={item.name}
            isExpanded={isExpanded}
            onToggle={() => control.onToggleBranch(item.name)}
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
          name={item.name}
          marks={item.marks}
          isSelected={isSelected}
          onSelect={control.onSelect}
        />
        {trailing}
      </div>
      {showsChildren ? (
        <NodeList
          nodes={item.children}
          parentName={item.name}
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
            item={nodeItem(node)}
            depth={depth}
            control={control}
            trailing={
              <ReorderButtons
                name={node.name}
                placement={{
                  position: { parentName, index },
                  siblings: nodes,
                }}
                onReorder={control.onReorder}
              />
            }
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * ツリービュー（docs/06-ui.md「画面構成」）。
 *
 * どの枝を畳んでいるかは編集ではなく見え方なので、ドキュメントの状態
 * （`EditorState`）には持たずここに閉じる。畳んだ側の名前を持つので、開いた直後は
 * 全部が開いた状態になり、後から増えたノードが畳まれた状態で現れることもない。
 * ただし畳んだ名前は消えたノードのぶんも残るので、同じ名前でノードを作り直すと
 * 畳んだ状態で現れる（名前は使い回される。三角で状態は読めるので許容している）。
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
  const artboards = EditorState.document(state).artboards;
  const [collapsedNames, setCollapsedNames] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
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
     * 左ペインには編集操作のボタンや部品一覧のボタンも並ぶため、
     * ツリーの行だけを指せるよう領域として名前を持たせる（#39）。
     */
    <section aria-label="ツリー" className="text-sm">
      <h2 className="mb-2 font-semibold text-gray-500 text-xs uppercase">
        ツリー
      </h2>
      {artboards.length === 0 ? (
        <p className="text-gray-500">artboard がありません</p>
      ) : (
        <ul>
          {artboards.map((artboard) => (
            <li key={artboard.name}>
              <TreeBranch
                item={artboardItem(artboard)}
                depth={0}
                control={control}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
