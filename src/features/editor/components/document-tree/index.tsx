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

/** 1 段ぶんの字下げ幅と、行の左端の余白（px）。 */
const INDENT_WIDTH_PX = 12;
const ROW_PADDING_PX = 8;

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
 * 名前で選ぶ行。artboard もノードも「名前で選ぶ」点は同じなので 1 つで描く。
 * 字下げ幅は深さで決まる値でクラス名に固定できないため、インラインスタイルで与える。
 *
 * 型アイコンと補助情報を `aria-hidden` にしたうえで `aria-label` に名前を置くのは、
 * 選ぶ対象がノードの名前だからで、こうしないと読み上げ名が「▢ home 360×240」のように
 * 装飾を含んだ文字列になる。
 */
function SelectableRow({
  name,
  marks,
  depth,
  handlers,
}: Readonly<{
  name: string;
  marks: TreeItemMarks;
  depth: number;
  handlers: TreeHandlers;
}>) {
  return (
    <button
      type="button"
      aria-label={name}
      aria-current={EditorState.isSelected(handlers.state, name)}
      onClick={() => handlers.onSelect(name)}
      style={{
        paddingInlineStart: `${ROW_PADDING_PX + depth * INDENT_WIDTH_PX}px`,
      }}
      className="flex min-w-0 flex-1 items-center gap-1.5 rounded py-1 pr-2 text-left hover:bg-gray-100 aria-[current=true]:bg-blue-100 aria-[current=true]:text-blue-900"
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
        marks={nodeMarks(node)}
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
  const artboards = EditorState.document(state).artboards;
  const handlers: TreeHandlers = { state, onSelect, onReorder };

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
              <div className="flex items-center gap-1 pr-1">
                <SelectableRow
                  name={artboard.name}
                  marks={artboardMarks(artboard)}
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
