import type { DocumentError } from "@/domains/session/document-error";
import type { DocumentReload } from "@/domains/session/document-reload";
import type { Instant } from "@/domains/unit/instant";
import { Option } from "@/utils/Option";

/**
 * 開いているファイルが、今画面に映っているドキュメントとして読めるか（docs/03-schema.md 「不
 * 正ファイル時の挙動」）。
 */
export type FileValidity = Readonly<{ kind: "valid" }> | InvalidFileValidity;

/**
 * 不正なときの妥当性。
 */
export type InvalidFileValidity = Readonly<{
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
   * 不正が続いている間、起点は**最初に不正になった時刻のまま**にする。拒むたびに採り直すと、
   * 外部エディタで保存し直すたびに数字が 0 へ戻り、「いつから古いか」を答えなくなる。
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
   * ファイルが不正なままか。
   *
   * boolean を返すと、尋ねた側がもう一度 `kind` を見るか、無い前提で値を取り出すことになる。
   *
   * @param validity 見る妥当性
   * @returns 外部変更を拒んだままなら `true`
   */
  isInvalid(validity: FileValidity): validity is InvalidFileValidity {
    return validity.kind === "invalid";
  },

  /**
   * 画面とファイルが食い違い始めた時刻。
   *
   * @param validity 見る妥当性
   * @returns 不正なら食い違い始めた時刻、妥当なら `none`（数える起点が無い）
   */
  since(validity: FileValidity): Option<Instant> {
    return FileValidity.isInvalid(validity)
      ? Option.some(validity.since)
      : Option.none;
  },
} as const;
