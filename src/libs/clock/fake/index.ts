import { Instant } from "@/domains/unit/instant";
import type { Clock } from "../index";

/**
 * 時計の代役。進めるのは呼び出し側で、勝手には進まない。
 */
export type ClockFake = Readonly<{
  /** 手で進める時計。 */
  clock: Clock;
  /**
   * 時計を進め、購読者へ知らせる。
   *
   * 何秒進めても知らせるのは 1 度だけ。
   */
  advanceSeconds(seconds: number): void;
  /**
   * 今この時計を購読しているものがあるか。
   *
   * 解除漏れは購読側からは見えないので、`DocumentIpcFake.isWatching` と同じく
   * 代役の側から見えるようにしている。
   */
  isSubscribed(): boolean;
  /**
   * これまでに購読が張られた回数。
   *
   * 張り直しは値の上では見えない（張り直された購読も次の `advanceSeconds` で配られる）ため、
   * 回数を数えられるようにしている。
   */
  subscribedCount(): number;
}>;

const MillisecondsPerSecond = 1000;

export const ClockFake = {
  create(startEpochMs = 0): ClockFake {
    const listeners = new Set<() => void>();
    let epochMs = startEpochMs;
    let subscribedCount = 0;

    return {
      clock: {
        now() {
          return Instant.create(epochMs);
        },

        subscribeSeconds(listener) {
          subscribedCount += 1;
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
      },

      advanceSeconds(seconds) {
        epochMs += seconds * MillisecondsPerSecond;
        for (const listener of listeners) {
          listener();
        }
      },

      isSubscribed() {
        return listeners.size > 0;
      },

      subscribedCount() {
        return subscribedCount;
      },
    };
  },
} as const;
