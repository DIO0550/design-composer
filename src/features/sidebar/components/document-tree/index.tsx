import type { ReactElement } from "react";
import { type NestedRow, NestedRowList } from "@/components/nested-row-list";
import { TypeGlyph } from "@/components/type-glyph";
import type { ChildPosition } from "@/domains/dcmp/child-position";
import { Node, type PrimitiveNode } from "@/domains/dcmp/node";
import type { TextSchema } from "@/domains/dcmp/primitive-schema";
import { DocumentSelection } from "@/domains/session/document-selection";
import { Selection, type SelectionKind } from "@/domains/session/selection";
import { RowNameField } from "@/features/sidebar/components/row-name-field";
import type { LeftPaneRenameActions } from "@/features/sidebar/types/LeftPaneRenameActions";
import { Option } from "@/utils/Option";

/** 文言を読む prop。Text のスキーマが宣言している名前に限る。 */
const ContentProp = "content" satisfies keyof typeof TextSchema.props;

/**
 * 名前の右に出す補助情報。何を出すかは種別ごとに違うので、種別と値を対で持つ。
 */
type NodeNote =
  | Readonly<{ kind: "content"; text: string }>
  | Readonly<{ kind: "instance" }>;

/**
 * 名前を編集中のものと、その受け口。どの行が入力欄になるかは対で決まるので 1 つにまとめる
 * （片方だけでは、どの行を入力欄にするかも打った名前の行き先も決まらない）。
 */
type TreeRename = Readonly<{
  renaming: Option<string>;
  actions: LeftPaneRenameActions;
}>;

/** 行が名前の左右に出すもの（左に型アイコン、右に補助情報）。 */
type NodeMarks = Readonly<{
  glyph: Option<SelectionKind>;
  note: Option<NodeNote>;
}>;

/**
 * Text の行に出す文言。空の文言では引用符だけが残るので出さない
 * （UI 案でも文言を持たない Text の行には補助情報が無い）。
 *
 * @param node 文言を読む対象の Text ノード
 * @returns 文言を持つなら `some`。未設定と空文字なら `none`
 */
function contentNote(node: PrimitiveNode): Option<NodeNote> {
  const content = node.props?.[ContentProp];
  if (content === undefined || content === "") {
    return Option.none;
  }
  return Option.some({ kind: "content", text: String(content) });
}

/**
 * 名前の右に出す補助情報。文言を持つのは Text だけで、Box には補助情報が無い。
 *
 * 参照ノードはインスタンスであること自体を出す。
 *
 * @param node 補助情報を出したいノード
 * @returns 参照ノードはインスタンスの印、Text は文言。それ以外は `none`
 */
function noteOf(node: Node): Option<NodeNote> {
  if (Node.isRef(node)) {
    return Option.some({ kind: "instance" });
  }
  return node.type === "Text" ? contentNote(node) : Option.none;
}

/**
 * 行が名前の左右に出すもの。
 *
 * 種別は `Selection` から引く。
 *
 * @param node 行に出したいノード
 * @returns 名前の左に出す種別の印と、右に出す補助情報
 */
function nodeMarks(node: Node): NodeMarks {
  return { glyph: Selection.fromNode(node).kind, note: noteOf(node) };
}

/**
 * 行の右端に出る補助情報（大きさ・文言・インスタンスの印）。
 *
 * @returns 種別に応じた 1 行ぶんの補助情報
 */
function NoteText({ note }: Readonly<{ note: NodeNote }>): ReactElement {
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
 * 選択の色は行の器（`NestedRowList`）が持つ。三角と字下げまで含めた行全体に色が付く形が
 * UI 案（docs/Design Composer.html）なので、名前のボタンだけを塗らない。
 */
function SelectableName({
  name,
  marks,
  isSelected,
  onSelect,
  onStartRenaming,
}: Readonly<{
  name: string;
  marks: NodeMarks;
  isSelected: boolean;
  onSelect: (name: string) => void;
  onStartRenaming: (name: string) => void;
}>) {
  return (
    <button
      type="button"
      aria-label={name}
      aria-current={isSelected}
      onClick={() => onSelect(name)}
      onDoubleClick={() => onStartRenaming(name)}
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

/**
 * ノードを、ツリービューが並べる 1 行へ作り直す。子も同じ形で作り直す。
 *
 * @param node 行にしたいノード
 * @param selection 選択を読む対
 * @param onSelect 行が押されたときに名前を伝える先
 * @param rename 名前を編集中のものと、その受け口
 * @returns そのノードと、その子孫を映した行
 */
function rowFromNode(
  node: Node,
  selection: DocumentSelection,
  onSelect: (name: string) => void,
  rename: TreeRename,
): NestedRow {
  const isSelected = DocumentSelection.isSelected(selection, node.name);
  const isRenaming = Option.contains(rename.renaming, node.name);
  const marks = nodeMarks(node);

  return {
    name: node.name,
    isSelected,
    content: isRenaming ? (
      <RowNameField
        name={node.name}
        glyph={Option.unwrapOr<SelectionKind | undefined>(
          marks.glyph,
          undefined,
        )}
        onCommit={rename.actions.commit}
        onFinish={rename.actions.finish}
        onCancel={rename.actions.cancel}
      />
    ) : (
      <SelectableName
        name={node.name}
        marks={marks}
        isSelected={isSelected}
        onSelect={onSelect}
        onStartRenaming={rename.actions.startAt}
      />
    ),
    children: Node.children(node).map((child) =>
      rowFromNode(child, selection, onSelect, rename),
    ),
  };
}

/**
 * 今見ている artboard の中身を出すツリービュー（docs/06-ui.md「画面構成」/ UI 案
 * docs/Design Composer.html の `Layers` パネル下段）。行の並べ替えは docs/06-ui.md「編
 * 集操作の一覧」の並べ替えにあたる。
 *
 * artboard 自身は行として出さない。UI 案は artboard を上段の `Artboards` に並べ、ツリー
 * はそのうちの 1 枚の中身だけを映す（どの 1 枚かは `DocumentSelection.currentArtboard`
 * が決めるので、ここは持たない）。
 *
 * どの枝を畳んでいるかは編集ではなく見え方なので、選択とドキュメントの対には持たず行を
 * 並べる器（`NestedRowList`）に閉じる。名前は使い回されるので、同じ名前でノードを作り直
 * すと畳んだ状態で現れる（三角で状態は読める）。
 */
export function DocumentTree({
  selection,
  renaming,
  onSelect,
  onReorder,
  renameActions,
}: Readonly<{
  selection: DocumentSelection;
  /** 今その名前を編集しているもの。編集していなければ不在 */
  renaming: Option<string>;
  onSelect: (name: string) => void;
  onReorder: (from: ChildPosition, toIndex: number) => void;
  renameActions: LeftPaneRenameActions;
}>) {
  const current = DocumentSelection.currentArtboard(selection);

  /*
   * 映す artboard が無いのは artboard が 1 枚も無いときだけで、それは
   * `ArtboardList` が伝える。ここで見出しだけを出すと、同じ「無い」を 2 箇所で言う。
   */
  if (!current.some) {
    return null;
  }

  const artboard = current.value;

  return (
    /*
     * 左ペインには artboard の一覧とレールの行き先も並ぶため、ツリーの行だけを
     * 指せるよう領域として名前を持たせる。見出しの綴りは UI 案に合わせて
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
      <NestedRowList
        rows={artboard.children.map((child) =>
          rowFromNode(child, selection, onSelect, {
            renaming,
            actions: renameActions,
          }),
        )}
        parentName={artboard.name}
        onReorder={onReorder}
      />
    </section>
  );
}
