/**
 * ツリー上の「どの親の何番目の子か」という位置。
 * 親の名前と index は片方だけでは位置が決まらないため1つの型にまとめる。
 */
export type ChildPosition = Readonly<{
  parentName: string;
  index: number;
}>;

export const ChildPosition = {
  /**
   * `removed` にいたノードを取り除いたあとの並びで見た、この位置。
   *
   * 挿入位置は取り除く前の並びを見て決まる（画面に描かれているのはその状態）のに対し、
   * 移動は「取り除いてから挿す」順で行われる。同じ親の中で今より後ろへ動かすときだけ、
   * 自分が抜けたぶんだけ挿入位置が1つ手前になる
   * （`[A,B,C,D]` の `B` を `C` と `D` の間へ → 見た目は 3 だが、
   * `B` を抜いた `[A,C,D]` では 2）。
   */
  afterRemoving(
    position: ChildPosition,
    removed: ChildPosition,
  ): ChildPosition {
    const shifts =
      removed.parentName === position.parentName &&
      removed.index < position.index;
    return shifts ? { ...position, index: position.index - 1 } : position;
  },
} as const;
