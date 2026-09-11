/**
 * ある瞬間（UNIX epoch からのミリ秒）。
 *
 * record にしているので素の `number` は代入できない。
 *
 * `libs/` は `features/` を import できないので `features/editor/domains/` には置けない（#183）。
 */
export type Instant = Readonly<{ epochMs: number }>;

export const Instant = {
  create(epochMs: number): Instant {
    return { epochMs };
  },
} as const;

/**
 * 始点と終点の対。
 *
 * 2 つの `Instant` は片方だけでは間隔を決められないため対で名前を付けている
 * （rules/architecture.md「2つの値が常に対で意味を持つなら、対を表す型を作る」）。
 * 位置引数 2 つにすると取り違えても型エラーにならない。
 */
export type InstantSpan = Readonly<{ from: Instant; to: Instant }>;

export const InstantSpan = {
  /**
   * 始点から終点までのミリ秒。
   *
   * @param span 測る間隔
   * @returns 終点 - 始点。終点が始点より前なら負の数（打ち切りは読み手側の規則なのでここではしない）
   */
  toMilliseconds(span: InstantSpan): number {
    return span.to.epochMs - span.from.epochMs;
  },
} as const;
