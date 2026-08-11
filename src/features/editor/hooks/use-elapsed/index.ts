import { useEffect, useState } from "react";
import type { Instant } from "@/domains/instant";
import { Elapsed } from "@/features/editor/domains/elapsed";
import type { Clock } from "@/libs/clock";
import { Option } from "@/utils/Option";

/**
 * 起点からの経過時間を、時計に合わせて 1 秒ごとに進める。
 *
 * 購読を張るのは起点があるあいだだけ。常に張ると、数えるものが無いときまで
 * 毎秒の再レンダーが走る（#183 の決定 B）。
 *
 * @param clock 現在時刻の取得と 1 秒ごとの通知
 * @param since 数え始める時刻。無ければ数えない
 * @returns 起点があるあいだの経過時間。起点が無ければ `none`
 */
export function useElapsed(
  clock: Clock,
  since: Option<Instant>,
): Option<Elapsed> {
  const [now, setNow] = useState<Instant>(() => clock.now());

  /*
   * 依存へ `since` そのものを置かない。`Option.some` は毎回新しいオブジェクトを返すので、
   * レンダーのたびに購読が張り直されて数字が進まなくなる（テストでは落ちない。
   * 代役は張り直された購読にも配るため / ClockFake.subscribedCount で見る）。
   */
  const sinceEpochMs = since.some ? since.value.epochMs : undefined;

  useEffect(() => {
    if (sinceEpochMs === undefined) {
      return;
    }
    /*
     * 購読を始める前に今の時刻へ追いつく。`now` は mount 時のままなので、数え始めた
     * 時点では起点より古く、これが無いと最初の 1 秒だけ負の経過時間が出る。
     */
    setNow(clock.now());
    return clock.subscribeSeconds(() => {
      setNow(clock.now());
    });
  }, [clock, sinceEpochMs]);

  return Option.map(since, (from) => Elapsed.create({ from, to: now }));
}
