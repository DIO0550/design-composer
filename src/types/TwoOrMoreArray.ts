/**
 * 1 件目と 2 件目が必ずある、読み取り専用の並び。
 *
 * `NonEmptyArray` と同じく、件数を長さではなく構造（2 件目の位置）で持つので、0 件・1 件の
 * 配列リテラルは代入できない。`NonEmptyArray` へはそのまま渡せる。
 */
export type TwoOrMoreArray<T> = readonly [T, T, ...T[]];
