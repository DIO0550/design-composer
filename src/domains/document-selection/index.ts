import type { Artboard } from "@/domains/dcmp/artboard";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { Selection } from "@/domains/selection";
import { SelectionState } from "@/domains/selection-state";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * ドキュメントと、その中で選ばれているものの対（docs/06-ui.md「選択」）。
 *
 * 2 つを 1 つの型にまとめるのは、**片方だけでは答えが決まらない**ため。選ばれて
 * いるのは名前だけで、それが artboard なのかノードなのか・どの artboard に載って
 * いるのか・何のインスタンスなのかは、どのドキュメントの中の名前かが決まって初めて
 * 引ける。
 *
 * 選ばれうるのは **artboard とその配下のノード**（キャンバスに描かれるもの）で、
 * 部品の定義やトークンは入らない（`EditorState.select` と同じ線引き）。
 *
 * `Selection`（選んだ 1 つの正体 = 名前と種別）とは別物で、あちらはドキュメントも
 * 「いくつ選ばれているか」も持たない。トークン側の対は `TokenSelection`。
 *
 * 名前がドキュメントに在ることは**検証しない**。
 * Why not: 生成時に弾くと、編集画面が選んでいるもの（`EditorState` の選択）と対が
 * 答えるものが食い違いうる。どちらが正かを追う場所が 2 つになるので、不変条件は
 * 選択を書き換える側（`EditorState.select` / `reveal` / 履歴の取り込み）に 1 つだけ
 * 置く。ここは名前をドキュメントから**引き直す**ので、在らない名前は行の強調にも
 * `currentArtboard` にも出ない。
 */
export type DocumentSelection = Readonly<{
  document: DesignDocument;
  selected: SelectionState;
}>;

export const DocumentSelection = {
  /**
   * ドキュメントと、その中で選ばれているものを対にする。
   *
   * @param document 選ばれている名前を引くドキュメント
   * @param selected 選ばれているもの。何も選んでいなければ `SelectionState.None`
   * @returns 2 つを対にした選択
   */
  create(
    document: DesignDocument,
    selected: SelectionState,
  ): DocumentSelection {
    return { document, selected };
  },

  /**
   * ドキュメントと、選ばれている名前の並びから対を作る。
   *
   * 並びから選択を組み立てる `SelectionState.create` を挟む手間をここで引き受ける。
   * 「未選択・単一・複数」の作り分けは並びの長さで決まるので、呼び出し側が状態を
   * 選ぶ必要はない。
   *
   * @param document 選ばれている名前を引くドキュメント
   * @param names 選ばれているものの名前。並びはそのまま保つ。空なら未選択
   * @returns 2 つを対にした選択
   */
  fromNames(
    document: DesignDocument,
    names: readonly string[],
  ): DocumentSelection {
    return DocumentSelection.create(document, SelectionState.create(names));
  },

  /**
   * その名前が選ばれているか。
   *
   * 答えは選択だけで決まる（`SelectionState.includes`）が、対しか持っていない
   * 消費側（ツリーの行）がここから読めるように置く。
   *
   * @param selection 選択の出どころ
   * @param name 選ばれているかを知りたいものの名前
   * @returns 選択に含まれていれば真
   */
  isSelected(selection: DocumentSelection, name: string): boolean {
    return SelectionState.includes(selection.selected, name);
  },

  /**
   * 選ばれているものすべての名前。
   *
   * 答えは選択だけで決まる（`SelectionState.names`）が、対しか持っていない消費側
   * （キャンバスの枠。ツリーと違い選択は artboard をまたげる / docs/06-ui.md「選択」）
   * のために置く。
   *
   * @param selection 名前の出どころになる選択
   * @returns 選ばれている名前の並び。未選択なら空
   */
  names(selection: DocumentSelection): readonly string[] {
    return SelectionState.names(selection.selected);
  },

  /**
   * いくつ選ばれているか。
   *
   * `isSelected` と同じく答えは選択だけで決まる（`SelectionState.count`）が、
   * 対しか持っていない消費側（`SelectionControls.forSelection`）のために置く。
   *
   * @param selection 件数の出どころになる選択
   * @returns 選ばれているものの件数。未選択なら 0
   */
  count(selection: DocumentSelection): number {
    return SelectionState.count(selection.selected);
  },

  /**
   * 1 つだけ選んでいるときの、その名前。
   *
   * `isSelected` と同じく答えは選択だけで決まるが、対しか持っていない消費側
   * （部品化のフッター）のために置く。
   *
   * @param selection 名前の出どころになる選択
   * @returns 単一選択ならその名前。未選択と複数選択では `none`
   */
  singleName(selection: DocumentSelection): Option<string> {
    return SelectionState.singleName(selection.selected);
  },

  /**
   * 1 つだけ選んでいるときの、その正体（名前と種別）。
   *
   * 名前だけを返さないのは、消費側（インスペクタの見出し）が名前と種別の両方を
   * 出すため。名前を渡して種別を引き直させると、artboard かノードかの場合分けが
   * features 層へ出る（`rules/coding.md`「features 層にドメイン知識を書かない」）。
   *
   * @param selection 選択とドキュメントの出どころ
   * @returns 単一選択ならその名前と種別。未選択・複数選択のとき、および名前が
   *   ドキュメントに無いときは `none`
   */
  singleSelection(selection: DocumentSelection): Option<Selection> {
    return Option.flatMap(DocumentSelection.singleName(selection), (name) => {
      const document = selection.document;
      const artboard = DesignDocument.findArtboard(document, name);
      if (artboard.some) {
        return Option.some(Selection.fromArtboard(artboard.value));
      }
      return Option.map(
        DesignDocument.findNode(document, name),
        Selection.fromNode,
      );
    });
  },

  /**
   * 選んでいるものがすべて同じ部品のインスタンスであるときの、その部品の名前
   * （UI 案 docs/Design Composer.html の `from ◆ primary-button` と
   * `Assets` の `source of selection`）。
   *
   * 右ペインと `Assets` パネルが同じ答えを要るので、参照先を引く経路をここ 1 つにする。
   * 別々に導出すると「パネルはインスタンスなのに `Assets` はどこも光らない」が作れる。
   *
   * 複数選択でも答えるのは、まとめて選べるのが「同じ部品のインスタンス」だけで、
   * 出どころが 1 つに定まるため（`EditorState.selectAllInstances`）。
   *
   * @param selection 選択とドキュメントの出どころ
   * @returns 選択が空でなく、すべて同じ部品のインスタンスならその部品名。
   *   1 つでもインスタンスでないもの・別の部品を指すものが混ざれば `none`
   */
  sourceName(selection: DocumentSelection): Option<string> {
    const document = selection.document;
    const names = DocumentSelection.names(selection);
    const refs = names.flatMap((name) => {
      const found = DesignDocument.findNode(document, name);
      return found.some && Node.isRef(found.value) ? [found.value.ref] : [];
    });
    const isSameSource =
      refs.length === names.length && ArrayEx.distinct(refs).length === 1;
    return isSameSource ? ArrayEx.first(refs) : Option.none;
  },

  /**
   * 今ツリーが中身を映している artboard（UI 案 docs/Design Composer.html の
   * `Layers` 見出しの右に出る名前）。
   *
   * 選んでいるのが artboard ならそれ自身、ノードならそれを載せている artboard、
   * 何も選んでいなければ先頭の 1 枚。artboard が 1 枚も無ければ `none`。
   *
   * 複数選択のときは**先頭の名前**が載っている artboard を映す。まとめて選んだ
   * インスタンスは複数の artboard に散らばりうるが、ツリーは 1 枚しか映せないため
   * （`Select all N instances`。映っていない artboard のぶんはキャンバスにだけ枠が出る）。
   * Why not: 複数選択のとき `none` にして先頭の 1 枚へ落とす案は採らない。選んだ結果
   * ツリーが無関係の artboard へ飛ぶことになる。
   *
   * どれを見ているかを状態として持たずここで導出するのは、持つと
   * 「選択のどれもが今見ている artboard に無い」という食い違った状態が表現できて
   * しまうため（rules/coding.md「不正な状態を型で表現できなくする」）。
   *
   * @param selection 選択とドキュメントの出どころ
   * @returns 今見ている artboard。artboard が 1 枚も無ければ `none`
   */
  currentArtboard(selection: DocumentSelection): Option<Artboard> {
    const document = selection.document;
    const owning = Option.flatMap(
      ArrayEx.first(DocumentSelection.names(selection)),
      (name) => DesignDocument.findOwningArtboard(document, name),
    );
    if (owning.some) {
      return owning;
    }
    return ArrayEx.first(document.artboards);
  },

  /**
   * その名前の artboard が今見ている 1 枚か。
   *
   * @param selection 選択とドキュメントの出どころ
   * @param name 今見ている 1 枚かを知りたい artboard の名前
   * @returns 今見ている artboard の名前と一致すれば真
   */
  isCurrentArtboard(selection: DocumentSelection, name: string): boolean {
    const current = DocumentSelection.currentArtboard(selection);
    return current.some && current.value.name === name;
  },
} as const;
