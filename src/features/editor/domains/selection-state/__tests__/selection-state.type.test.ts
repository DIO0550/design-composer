import { expectTypeOf, test } from "vitest";
import type { SelectionState } from "../index";

type MultipleSelection = Extract<SelectionState, { kind: "multiple" }>;

/*
 * 「複数選択は 2 件以上」を成立させているのは `create` の長さの分岐だけで
 * （`noUncheckedIndexedAccess` が無いため要素の型は空の並びでも `string` に見える）、
 * タプルを素の配列へ緩めても実行時のテストは通ってしまう。ここで型を固定する。
 */
test("複数選択は名前を2件以上持つものだけを表せる", () => {
  expectTypeOf<{
    kind: "multiple";
    names: readonly [string, string];
  }>().toExtend<MultipleSelection>();

  expectTypeOf<{
    kind: "multiple";
    names: readonly [string];
  }>().not.toExtend<MultipleSelection>();
});

test("複数選択の名前に長さの分からない並びは渡せない", () => {
  expectTypeOf<{
    kind: "multiple";
    names: readonly string[];
  }>().not.toExtend<MultipleSelection>();
});

test("単一選択は名前を1つだけ持ち、名前の並びは持たない", () => {
  type SingleSelection = Extract<SelectionState, { kind: "single" }>;

  expectTypeOf<SingleSelection>().toEqualTypeOf<
    Readonly<{ kind: "single"; name: string }>
  >();
});
