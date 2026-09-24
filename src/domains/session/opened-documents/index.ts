import type { OpenedDocument } from "@/domains/session/opened-document";
import { ArrayEx } from "@/utils/ArrayEx";
import { Option } from "@/utils/Option";

/**
 * 同時に開いているドキュメントの並びと、今見ているもの
 * （docs/06-ui.md「開いているドキュメントの行き来」）。
 *
 * 現在地を別に持たずに並びの中へ埋めるのは、「並びに無いものを見ている」状態を書けなく
 * するため。同じ理由で 0 件も表せない（1 つも開いていないことは、この型を持たないことで
 * 表す）。同じ形の先例として編集履歴（`EditHistory`）がある。
 *
 * パスは並び全体で一意。`open` がその不変条件を保つので、消費側は同じパスのドキュメント
 * が 2 つ並ぶ場合を考えなくてよい。
 */
export type OpenedDocuments = Readonly<{
  before: readonly OpenedDocument[];
  active: OpenedDocument;
  after: readonly OpenedDocument[];
}>;

export const OpenedDocuments = {
  /**
   * 1 つだけ開いた状態。前にも後ろにも並びは無い。
   *
   * @param document 開くドキュメント
   * @returns `document` だけを並べ、それを見ている状態
   */
  create(document: OpenedDocument): OpenedDocuments {
    return { before: [], active: document, after: [] };
  },

  /**
   * 開いているドキュメントを並び順に読む。
   *
   * @param opened 読む相手
   * @returns 開いた順に並んだドキュメント。1 件以上ある
   */
  documents(opened: OpenedDocuments): readonly OpenedDocument[] {
    return [...opened.before, opened.active, ...opened.after];
  },

  /**
   * 今見ているドキュメントの保存先。
   *
   * @param opened 読む相手
   * @returns 今見ているドキュメントのパス
   */
  activePath(opened: OpenedDocuments): string {
    return opened.active.path;
  },

  /**
   * そのパスを既に開いているか。
   *
   * @param opened 探す相手
   * @param path 探すパス
   * @returns 並びのどこかにあれば `true`
   */
  has(opened: OpenedDocuments, path: string): boolean {
    return OpenedDocuments.documents(opened).some(
      (document) => document.path === path,
    );
  },

  /**
   * 見ている先をそのパスへ移す。
   *
   * @param opened 移す相手
   * @param path 移り先のパス
   * @returns そのパスを見ている並び。開いていないパスなら並びは変わらない
   */
  activate(opened: OpenedDocuments, path: string): OpenedDocuments {
    const documents = OpenedDocuments.documents(opened);
    const index = documents.findIndex((document) => document.path === path);
    if (!ArrayEx.isIndexInRange(documents, index)) {
      return opened;
    }
    return {
      before: documents.slice(0, index),
      active: documents[index],
      after: documents.slice(index + 1),
    };
  },

  /**
   * ドキュメントを開いて、それを見ている状態にする。
   *
   * 既に開いているパスなら並びは増やさず、そのドキュメントへ移るだけにする。同じファイル
   * を 2 つ並べると、どちらを書き出すかが決まらない（自動保存も監視もパスで動く）。
   *
   * @param opened 開く相手
   * @param document 開くドキュメント
   * @returns そのドキュメントを見ている並び
   */
  open(opened: OpenedDocuments, document: OpenedDocument): OpenedDocuments {
    if (OpenedDocuments.has(opened, document.path)) {
      return OpenedDocuments.activate(opened, document.path);
    }
    return {
      before: OpenedDocuments.documents(opened),
      active: document,
      after: [],
    };
  },

  /**
   * そのパスのドキュメントを閉じる。
   *
   * 見ているものを閉じたときは後ろへ、後ろが無ければ前へ移る。
   *
   * @param opened 閉じる相手
   * @param path 閉じるパス
   * 開いていないパスも受け取る。タブを閉じた直後に、同じ間に積まれた押下がそのパスで
   * 届くことがあるため。
   *
   * @returns 閉じた後の並び。最後の 1 つを閉じたときだけ `none`。開いていないパスを
   *   渡したときは並びを変えずに返す（`none` にはしない）
   */
  close(opened: OpenedDocuments, path: string): Option<OpenedDocuments> {
    if (opened.active.path !== path) {
      return Option.some({
        before: opened.before.filter((document) => document.path !== path),
        active: opened.active,
        after: opened.after.filter((document) => document.path !== path),
      });
    }

    const next = ArrayEx.first(opened.after);
    if (Option.isSome(next)) {
      return Option.some({
        before: opened.before,
        active: next.value,
        after: ArrayEx.dropFirst(opened.after),
      });
    }

    const previous = ArrayEx.last(opened.before);
    if (Option.isSome(previous)) {
      return Option.some({
        before: ArrayEx.dropLast(opened.before),
        active: previous.value,
        after: [],
      });
    }
    return Option.none;
  },
} as const;
