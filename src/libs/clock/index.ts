import { Instant } from "@/domains/instant";

/**
 * 現在時刻の取得と、一定間隔の通知。
 *
 * `libs/` に置くのは、時刻とタイマーがプロセス外・制御不能な境界だから
 * （rules/testing.md「代替してよいのはプロセス外・制御不能な境界のみ:
 * `libs/` が包む外部 I/O（…時刻、乱数）」）。テストとストーリーは `fake/` の
 * 手で進める時計に差し替える。
 */
export type Clock = Readonly<{
  now(): Instant;
  /**
   * 1 秒ごとに呼ぶ購読を始める。
   *
   * @param listener 1 秒ごとに呼ぶもの
   * @returns 購読を解除する関数
   */
  subscribeSeconds(listener: () => void): () => void;
}>;

const MillisecondsPerSecond = 1000;

export const Clock = {
  create(): Clock {
    return {
      now() {
        return Instant.create(Date.now());
      },

      subscribeSeconds(listener) {
        const timer = setInterval(listener, MillisecondsPerSecond);
        return () => {
          clearInterval(timer);
        };
      },
    };
  },
} as const;
