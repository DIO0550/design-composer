import type { AssetGrab } from "@/features/assets/types/AssetGrab";
import { Option } from "@/utils/Option";

/**
 * ストーリー用の掴む口の 2 状態。
 *
 * 外の feature（`features/sidebar` の左ペイン）へは、ストーリー用の公開口（`__stories__/index.ts`）
 * から出す。
 */
export const IdleGrab: AssetGrab = { dragged: Option.none, onGrab: () => {} };

/** その部品を掴んで運んでいる状態。 */
export function grabbingComponent(componentName: string): AssetGrab {
  return {
    dragged: Option.some({ kind: "instance", componentName }),
    onGrab: () => {},
  };
}
