/**
 * ある瞬間（UNIX epoch からのミリ秒）。
 *
 * 素の `number` にしないのは、秒とミリ秒・時刻と経過時間を取り違えても型が何も
 * 言わないため（rules/coding.md「値の語彙を型で閉じる」）。record にしているので
 * 素の `number` は代入できない。
 *
 * `src/domains/` に置いているのは、`libs/clock` が戻り値に使うため。`libs/` は
 * `features/` を import できないので `features/editor/domains/` には置けない
 * （「ドメインオブジェクトはまず feature 側に置く」とは逆向きの配置になる / #183）。
 */
export type Instant = Readonly<{ epochMs: number }>;

/**
 * 始点と終点の対。
 *
 * 2 つの `Instant` は片方だけでは間隔を決められないため対で名前を付けている
 * （rules/architecture.md「2つの値が常に対で意味を持つなら、対を表す型を作る」）。
 * 位置引数 2 つにすると取り違えても型エラーにならない。
 */
export type InstantSpan = Readonly<{ from: Instant; to: Instant }>;

export const Instant = {
  create(epochMs: number): Instant {
    return { epochMs };
  },

  /**
   * 始点から終点までのミリ秒。
   *
   * @param span 測る間隔
   * @returns 終点 - 始点。終点が始点より前なら負の数（打ち切りは読み手側の規則なのでここではしない）
   */
  millisecondsOf(span: InstantSpan): number {
    return span.to.epochMs - span.from.epochMs;
  },
} as const;
