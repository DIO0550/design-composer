import type { Instant } from "@/domains/instant";
import type { DocumentError } from "@/features/editor/domains/document-error";
import type { DocumentReload } from "@/features/editor/domains/document-reload";
import { Option } from "@/utils/Option";

/**
 * 開いているファイルが、今画面に映っているドキュメントとして読めるか
 * （docs/03-schema.md「不正ファイル時の挙動」）。
 *
 * 不正なときだけ、拒んだ理由と「いつから食い違っているか」を持つ。エラー一覧と起点を
 * 別々のフィールドで並べないのは、「エラーが空なのに起点がある」「エラーがあるのに
 * 起点が無い」が表現できてしまうため（rules/coding.md「正しい状態だけを列挙する」）。
 *
 * `errors` を非空タプルで縛らないのは `DocumentReload` と同じ理由（テキストの解釈の失敗が
 * 空配列を返さないことは型に出ておらず、縛ると起こらない空配列の分岐を書く羽目になる）。
 *
 * 名前を隣の `DocumentSaveState` に揃えないのは、あちらが「保存という操作の状態」なのに対し
 * こちらは操作ではなく「ファイルが妥当かどうか」だから。
 */
export type FileValidity =
  | Readonly<{ kind: "valid" }>
  | Readonly<{
      kind: "invalid";
      errors: readonly DocumentError[];
      since: Instant;
    }>;

/** 妥当な状態は情報を持たないので、生成せず 1 つを共有する。 */
const valid: FileValidity = { kind: "valid" };

export const FileValidity = {
  valid,

  /**
   * 取り込み結果を反映した妥当性。
   *
   * 不正が続いている間、起点は**最初に不正になった時刻のまま**にする。映っている描画が
   * 差し替わっていない以上、ファイルと食い違い始めた時刻も動かないため。2 度目の拒否で
   * 採り直すと、外部エディタで保存し直すたびに数字が 0 へ戻り「いつから古いか」を
   * 答えなくなる（#183 の決定 A'）。
   *
   * @param previous 反映する前の妥当性
   * @param reload 外部変更を取り込んだ結果
   * @param at この取り込みを受け取った時刻
   * @returns 取り込めたなら妥当な状態、拒んだなら理由と起点を持つ不正な状態
   */
  withReload(
    previous: FileValidity,
    reload: DocumentReload,
    at: Instant,
  ): FileValidity {
    switch (reload.kind) {
      case "reloaded":
        return valid;
      case "rejected":
        return {
          kind: "invalid",
          errors: reload.errors,
          since: previous.kind === "invalid" ? previous.since : at,
        };
    }
  },

  /**
   * 画面とファイルが食い違い始めた時刻。
   *
   * @param validity 見る妥当性
   * @returns 不正なら食い違い始めた時刻、妥当なら `none`（数える起点が無い）
   */
  since(validity: FileValidity): Option<Instant> {
    return validity.kind === "invalid"
      ? Option.some(validity.since)
      : Option.none;
  },
} as const;
