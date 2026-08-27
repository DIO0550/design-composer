import { Instant } from "@/domains/unit/instant";

/** 数え始めた時刻。終点はここから進めた時刻を作る。 */
export const From = Instant.create(1_700_000_000_000);

/**
 * 数え始めてから `milliseconds` ミリ秒だけ進んだ時刻。
 *
 * @param milliseconds 起点から進める量。負なら起点より前の時刻になる
 */
export function afterMilliseconds(milliseconds: number): Instant {
  return Instant.create(From.epochMs + milliseconds);
}

/**
 * 数え始めてから `seconds` 秒だけ進んだ時刻。
 *
 * @param seconds 起点から進める量
 */
export function afterSeconds(seconds: number): Instant {
  return afterMilliseconds(seconds * 1000);
}
