import { ArrayEx } from "@/utils/ArrayEx";
import type { Option } from "@/utils/Option";

/**
 * 最近開いたファイルのパスの並び（新しい順。`docs/06-ui.md`「開く前の画面（開始画面）」）。
 * 重複が無いことと上限を超えないことは `create` が保証する。
 */
export type RecentFiles = Readonly<{ paths: readonly string[] }>;

/** 一覧に残す件数の上限（`docs/06-ui.md`「開く前の画面（開始画面）」）。 */
const Limit = 10;

const Empty: RecentFiles = { paths: [] };

export const RecentFiles = {
  /** 1 件も開いていない一覧。 */
  Empty,

  /**
   * 並びから一覧を作る。
   *
   * @param paths 新しい順に並んだパス。重複や上限超えを含んでいてよい
   * @returns 重複を取り除き、上限までに切り詰めた一覧
   */
  create(paths: readonly string[]): RecentFiles {
    return { paths: ArrayEx.distinct(paths).slice(0, Limit) };
  },

  /**
   * 開いたファイルを先頭に持つ一覧。
   *
   * @param recents 開く前の一覧
   * @param path 開いたファイルのパス
   * @returns そのパスを先頭に持つ一覧。既に含まれていれば重複させず先頭へ移す
   */
  withOpened(recents: RecentFiles, path: string): RecentFiles {
    return RecentFiles.create([path, ...recents.paths]);
  },

  /**
   * 前回開いていたファイル。
   *
   * @param recents 見る対象の一覧
   * @returns 一覧の先頭のパス。1 件も開いていなければ `none`
   */
  latest(recents: RecentFiles): Option<string> {
    return ArrayEx.first(recents.paths);
  },
} as const;
