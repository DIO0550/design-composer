import type { AssetGrab } from "@/features/assets/types/AssetGrab";
import { Option } from "@/utils/Option";

/**
 * ストーリー用の掴む口の 2 状態。
 *
 * テスト用のヘルパー（`__tests__/asset-grab.ts`）とは別に置いているのは、features
 * 間の `__tests__/` を deep import しないため（`rules/architecture.md` は features
 * 間の import を公開 API 経由に限っており、`__tests__/` は公開 API ではない）。
 * `__stories__/` は同じ扱いだが、`SampleAssetsDocument` を editor 側から使う道筋が
 * 既にあるため、ストーリー用のサンプル値の共有場所として使う。
 *
 * `AssetGrab` にフィールドを足す動機は薄い（掴む口以上のものを運ぶ理由が無い）が、
 * もし足したときは Storybook と本番の両方の描画がここで揃うようにする。
 */
export const IdleGrab: AssetGrab = { dragged: Option.none, onGrab: () => {} };

/** その部品を掴んで運んでいる状態。 */
export function grabbingComponent(componentName: string): AssetGrab {
  return {
    dragged: Option.some({ kind: "instance", componentName }),
    onGrab: () => {},
  };
}
