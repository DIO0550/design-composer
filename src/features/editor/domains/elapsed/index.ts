import { InstantSpan } from "@/domains/instant";
import type { ValueOf } from "@/types/ValueOf";

/** 経過時間を読むときの単位。 */
export const ElapsedUnits = {
  Seconds: "seconds",
  Minutes: "minutes",
  Hours: "hours",
} as const;

export type ElapsedUnit = ValueOf<typeof ElapsedUnits>;

/**
 * 経過時間を 1 つの単位で読んだもの（UI 案 docs/Design Composer.html の Error 画面の
 * `4s ago` / #183）。
 *
 * 単位と数までしか持たないのは、`4s` の `s` や `ago` が表示の綴りだから
 * （rules/architecture.md「表示のための綴りをドメインへ持ち込まない」）。
 * 綴りは `editor-top-bar` が持つ。
 */
export type Elapsed = Readonly<{ unit: ElapsedUnit; count: number }>;

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export const Elapsed = {
  /**
   * 間隔を、繰り上がる手前の単位で読む。
   *
   * 60 秒で分へ、60 分で時間へ繰り上げ、端数は切り捨てる。切り上げないのは
   * 「4.9 秒経過」を `5s` と読ませないため（経過時間は「少なくとも N」で読む）。
   * 複合表記（`1m 5s`）にしないのは、UI 案が持つのが単一単位の `4s` だけで、
   * 桁を増やすと 11px の 1 行が伸びて隣と場所を取り合うため。
   *
   * @param span 数え始めた時刻と、今の時刻
   * @returns 繰り上がる手前の単位で読んだ経過時間。終点が始点より前なら 0 秒
   *   （時計が巻き戻る・起点が未来になる状況で負の数を出さない）
   */
  create(span: InstantSpan): Elapsed {
    const milliseconds = Math.max(0, InstantSpan.toMilliseconds(span));
    const seconds = Math.floor(milliseconds / MILLISECONDS_PER_SECOND);
    if (seconds < SECONDS_PER_MINUTE) {
      return { unit: ElapsedUnits.Seconds, count: seconds };
    }

    const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
    if (minutes < MINUTES_PER_HOUR) {
      return { unit: ElapsedUnits.Minutes, count: minutes };
    }

    return {
      unit: ElapsedUnits.Hours,
      count: Math.floor(minutes / MINUTES_PER_HOUR),
    };
  },
} as const;
