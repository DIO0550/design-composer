import type { AssetGrab } from "@/features/editor/features/assets/types/AssetGrab";
import { Option } from "@/utils/Option";

/**
 * その部品を掴んで運んでいる状態。
 *
 * @param componentName 掴んで運んでいる部品の名前
 * @returns その部品を運んでいる掴む口
 */
export function grabbingComponent(componentName: string): AssetGrab {
  return {
    dragged: Option.some({ kind: "instance", componentName }),
    onGrab: () => {},
  };
}

/**
 * パレットの行へ渡す掴む口を、既定に上書きを足して組み立てる。
 *
 * 既定は「何も掴んでいない・掴んでも何も起きない」で、確かめたいものだけを渡す。
 *
 * @param overrides 差し替えたい口だけ
 * @returns 掴む口
 */
export function setupAssetGrab(overrides: Partial<AssetGrab> = {}): AssetGrab {
  return { dragged: Option.none, onGrab: () => {}, ...overrides };
}
