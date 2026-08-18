import { DesignDocument } from "@/domains/design-document";
import { Node, type PrimitiveNode, PropEdit } from "@/domains/node";
import type { PrimitiveType, TextSchema } from "@/domains/primitive-schema";
import { ResolvedProps } from "@/domains/resolved-props";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { CanvasBounds } from "@/features/editor/domains/node-drop";
import { Option } from "@/utils/Option";

/** その場で編集できる文言を持つのは Text だけ（docs/02-data-model.md の表）。 */
const TextType = "Text" satisfies PrimitiveType;

/** 書き換える prop。Text のスキーマが宣言している名前に限る。 */
const ContentProp = "content" satisfies keyof typeof TextSchema.props;

/**
 * キャンバス上でその場で編集できる文言（docs/06-ui.md「キャンバス直接操作」の
 * 「Text のインライン編集」）。
 *
 * 名前と文言を対で持つのは、片方だけでは編集を始められないため
 * （入力欄を重ねる位置は名前で引いた要素から、下書きの初期値は文言から決まる）。
 */
export type EditableText = Readonly<{
  name: string;
  content: string;
}>;

/**
 * 設定されていない `content` にはスキーマの既定値が効いているため、
 * 既定を解決した後の文言を編集の初期値にする（空欄から書き始めることにならない）。
 *
 * @param node 文言を読む対象の Text ノード
 * @returns 既定を解決した後の文言
 */
function contentOf(node: PrimitiveNode): string {
  return String(ResolvedProps.resolve(TextType, node.props ?? {}).content);
}

/**
 * 選択中のものがインライン編集できる Text なら、その名前と今の文言。
 *
 * @param state 選択の出どころになるエディタの状態
 * @returns 名前と今の文言。未選択と、選択が Text でないときは `none`
 */
function forSelection(state: EditorState): Option<EditableText> {
  return Option.flatMap(EditorState.singleName(state), (name) => {
    const found = DesignDocument.findNode(EditorState.document(state), name);
    if (!found.some) {
      return Option.none;
    }
    const node = found.value;
    if (!Node.isPrimitive(node) || node.type !== TextType) {
      return Option.none;
    }
    return Option.some({ name, content: contentOf(node) });
  });
}

export const EditableText = {
  /**
   * ダブルクリックされた位置にある、インライン編集できる Text。
   * `names` は押された位置から外へ辿ったノード名（キャンバスの選択と同じ読み方）。
   *
   * 対象を選択から決めるのは、確定した文言の書き込み先が選択中のもの
   * （`EditorState.applyPropEdit`）だからで、ダブルクリックは `click` 2 回の後に
   * 届くため、その時点で押されたものは既に選択されている。
   * 押された位置も見るのは、選択中の Text から離れたところをダブルクリックしたときに
   * 編集が始まらないようにするため。
   *
   * artboard と部品インスタンスは対象にならない（文言を持つのは Text だけで、
   * インスタンスが持つのは部品への上書き）。部品インスタンスの中身に見えている
   * Text も、ドキュメントの木には無いため選択されず対象にならない。
   */
  at(state: EditorState, names: readonly string[]): Option<EditableText> {
    return Option.flatMap(forSelection(state), (text) =>
      names.includes(text.name) ? Option.some(text) : Option.none,
    );
  },
} as const;

/**
 * 編集中の Text（docs/06-ui.md「キャンバス直接操作」の「Text のインライン編集」）。
 *
 * 下書きは確定するまでドキュメントへ書かない。書きながら反映すると、
 * 取り消し（Escape）で戻すために編集前の文言を別に覚えておくことになる。
 *
 * 「どう見せるか」（入力欄なのか吹き出しなのか）は持たない。矩形を持つのは、
 * どこを編集しているかがブラウザの実測でしか決まらないためで、`NodeResize` が
 * 掴んだ位置を、`NodeDrop` が実測した矩形を持つのと同じ扱いにしている。
 */
export type TextEdit = Readonly<{
  draft: string;
  /** 編集している文言が描かれている矩形。 */
  bounds: CanvasBounds;
}>;

export const TextEdit = {
  /** 今の文言を下書きの初期値にして編集を始める。 */
  create(text: EditableText, bounds: CanvasBounds): TextEdit {
    return { draft: text.content, bounds };
  },

  /** 入力された文言で下書きを差し替える。矩形は編集の間変わらない。 */
  withDraft(edit: TextEdit, draft: string): TextEdit {
    return { ...edit, draft };
  },

  /**
   * 下書きを `content` への編集にする。
   *
   * 空の下書きを「未設定へ戻す」とは読まない（プロパティパネルの入力欄は
   * `PropControl.editFrom` でそう読む）。パネルは既定値を別に見せる欄なので
   * 空欄に「未設定」の意味を持たせられるが、キャンバスに映っているものは
   * そのまま `content` であり、空にする操作は「文言を空にした」としか読めない。
   */
  toPropEdit(edit: TextEdit): PropEdit {
    return PropEdit.set([ContentProp], edit.draft);
  },
} as const;
