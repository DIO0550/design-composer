import type { NodeTemplate } from "@/features/editor/domains/node-template";
import type { AssetGrab } from "@/features/editor/types/AssetGrab";
import { Option } from "@/utils/Option";

/**
 * パレットの行へ渡す掴む口。
 * パレット（components/assets-panel）とその中の 2 つの一覧、左ペイン
 * （components/left-pane）のどれもが同じものを要るため、feature 直下に置いて共有する。
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
