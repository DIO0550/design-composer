import type { NodeTemplate } from "@/domains/node-template";
import type { AssetGrab } from "@/features/assets/types/AssetGrab";
import { Option } from "@/utils/Option";

/**
 * パレットの行へ渡す掴む口。
 * パレット（`AssetsPanel`）とその中の 2 つの一覧（`ComponentList` / `PrimitiveList`）、
 * 部品化のフッター（`CreateComponent` は使わないが行の描画テストが要る）のテストが
 * どれも同じ形の値を要るため、feature 直下に置いて共有する。
 *
 * `features/editor` 側の消費者（左ペインのストーリー 1 箇所）はこの helper には
 * 依らず、`AssetGrab` の値を直接組む。features 間で `__tests__/` を deep import
 * しないようにするため。
 *
 * 既定は「何も掴んでいない・掴んでも何も起きない」で、確かめたいものだけを渡す。
 *
 * @param overrides 差し替えたい口だけ
 * @returns 掴む口
 */
export function setupAssetGrab(overrides: Partial<AssetGrab> = {}): AssetGrab {
  return { dragged: Option.none, onGrab: () => {}, ...overrides };
}

/** その部品を掴んでいる状態。 */
export function grabbingComponent(componentName: string): AssetGrab {
  return setupAssetGrab({
    dragged: Option.some<NodeTemplate>({ kind: "instance", componentName }),
  });
}
