import { Option } from "@/utils/Option";

/**
 * 文字列をキーにした辞書に対する汎用操作。
 *
 * キーが外から来る辞書を `in` や `record[key]` で引くと、`constructor` / `toString` /
 * `__proto__` のような `Object.prototype` 上の名前を「ある」と判定してしまう。引き当ては
 * 自身のキーだけを見るここを通す。
 */
export const RecordEx = {
  /**
   * そのキーを辞書自身が持っているか。
   *
   * @param record 調べる辞書
   * @param key 持っているかを知りたいキー
   * @returns 自身のキーにあれば `true`。プロトタイプ上にしか無い名前は `false`
   */
  has(record: Readonly<Record<string, unknown>>, key: string): boolean {
    // Object.hasOwn は tsconfig の lib(ES2020)に型が無く、hasOwnProperty.call は Biome の
    // useObjectHasOwn が Object.hasOwn へ書き換える
    return Object.getOwnPropertyDescriptor(record, key) !== undefined;
  },

  /**
   * キーで値を引く。
   *
   * @param record 引き先の辞書
   * @param key 引きたいキー
   * @returns そのキーの値。辞書自身がそのキーを持たないとき(プロトタイプ上にしか無い名前を
   *   含む)と、値が `null` / `undefined` のときは `none`
   */
  get<V>(
    record: Readonly<Record<string, V>>,
    key: string,
  ): Option<NonNullable<V>> {
    return RecordEx.has(record, key)
      ? Option.fromNullable(record[key])
      : Option.none;
  },
} as const;
