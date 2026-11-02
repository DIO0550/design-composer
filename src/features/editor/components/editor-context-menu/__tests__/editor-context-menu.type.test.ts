import { expectTypeOf, test } from "vitest";
import type { ShowableKeyShortcut } from "@/features/editor/components/editor-context-menu";
import { KeyTriggers } from "@/hooks/use-key-shortcut";

/*
 * 行に併記できない割り当てを表に置いた時点で型エラーになることを固定する（`rules/coding.md`
 * 「型レベルの保証が仕様の一部であるとき」）。絞り込みが外れても、いまの表は併記できる
 * 割り当てしか置いていないので、実行時のテストでは気づけない。
 */

test("Shift だけを修飾に持つ割り当ては、併記できる割り当てとして受け付けない", () => {
  const shiftOnly = {
    kind: KeyTriggers.TypedCharacter,
    keys: ["d"],
    withCommandKey: false,
    withShiftKey: true,
  } as const;

  expectTypeOf(shiftOnly).not.toExtend<ShowableKeyShortcut>();
});

test("待ち受けるキーが空の割り当ては、併記できる割り当てとして受け付けない", () => {
  const withoutKeys = {
    kind: KeyTriggers.TypedCharacter,
    keys: [],
    withCommandKey: true,
    withShiftKey: false,
  } as const;

  expectTypeOf(withoutKeys).not.toExtend<ShowableKeyShortcut>();
});

test("物理キーで待つ割り当ては、併記できる割り当てとして受け付けない", () => {
  const physicalKey = {
    kind: KeyTriggers.PhysicalKey,
    codes: ["Digit1"],
    withCommandKey: true,
    withShiftKey: false,
  } as const;

  expectTypeOf(physicalKey).not.toExtend<ShowableKeyShortcut>();
});

test("コマンドキーだけを修飾に持つ割り当ては、併記できる割り当てとして受け付ける", () => {
  const withCommandKey = {
    kind: KeyTriggers.TypedCharacter,
    keys: ["d"],
    withCommandKey: true,
    withShiftKey: false,
  } as const;

  expectTypeOf(withCommandKey).toExtend<ShowableKeyShortcut>();
});

test("コマンドキーと Shift を修飾に持つ割り当ては、併記できる割り当てとして受け付ける", () => {
  const withCommandAndShiftKeys = {
    kind: KeyTriggers.TypedCharacter,
    keys: ["z"],
    withCommandKey: true,
    withShiftKey: true,
  } as const;

  expectTypeOf(withCommandAndShiftKeys).toExtend<ShowableKeyShortcut>();
});

test("修飾を持たない割り当ては、併記できる割り当てとして受け付ける", () => {
  const withoutModifiers = {
    kind: KeyTriggers.TypedCharacter,
    keys: ["Delete"],
    withCommandKey: false,
    withShiftKey: false,
  } as const;

  expectTypeOf(withoutModifiers).toExtend<ShowableKeyShortcut>();
});
