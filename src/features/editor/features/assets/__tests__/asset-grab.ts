/*
 * 組み立てそのものは `__stories__/asset-grab.ts` にあり、ここはテスト側の入口として
 * 再輸出だけを行う（`components/context-menu/__tests__/setup.tsx` と同じ形）。テストが
 * `__stories__/` を直接読まずに済ませるための口で、同じ形（`AssetGrab` の組み立て方）が
 * 2 箇所に現れないようにするため（`rules/coding.md`「同じ処理が 2 箇所に現れたら共通化する」）。
 */
export {
  grabbingComponent,
  setupAssetGrab,
} from "@/features/editor/features/assets/__stories__/asset-grab";
