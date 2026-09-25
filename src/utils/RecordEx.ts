import { Option } from "@/utils/Option";

/** 素のオブジェクトを辞書として引く汎用操作。プロトタイプ上の名前は「無い」として扱う。 */
export const RecordEx = {
  /**
   * そのキーを辞書が自前で持っているか。
   *
   * @param record 引き先の辞書
   * @param key 引きたいキー
   * @returns `record` 自身がそのキーを持っていれば true
   */
  has(record: Readonly<Record<string, unknown>>, key: string): boolean {
    // `hasOwnProperty.call` は Biome の修正で lib（ES2020）の型に無い `Object.hasOwn` へ書き換わる。
    return Object.getOwnPropertyDescriptor(record, key) !== undefined;
  },

  /**
   * キーで辞書の値を引く。
   *
   * @param record 引き先の辞書
   * @param key 引きたいキー
   * @returns そのキーの値。`record` 自身がそのキーを持っていないとき（プロトタイプ上にだけ
   *   あるときを含む）と、値が `null` / `undefined` のときは `none`
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
