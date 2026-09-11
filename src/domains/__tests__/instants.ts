import { Instant } from "@/domains/unit/instant";

/**
 * 外部変更を受け取った時刻。起点そのものを見ない観点でも取り込みには時刻が要るので、同
 * じ値をそれぞれに書かず共有する。
 *
 * 特定のドメインだけが要る時刻は、そのモジュールの `__tests__/setup.ts` に置く。
 */
export const ReceivedAt = Instant.create(0);
