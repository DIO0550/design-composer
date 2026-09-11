import { Option } from "@/utils/Option";

/**
 * エディタ画面で今どれが選ばれているか（docs/06-ui.md「選択」）。
 */
export type SelectionState =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "single"; name: string }>
  | Readonly<{
      kind: "multiple";
      names: readonly [string, string, ...string[]];
    }>;

export const SelectionState = {
  /** 何も選んでいない状態。 */
  None: { kind: "none" } as const satisfies SelectionState,

  /**
   * 選ばれている名前の並びから状態を作る。
   *
   * 外から `multiple` を直接組み立てるとこの分岐を通らずに 1 件の `multiple` が作れてしまう。
   *
   * @param names 選ばれているものの名前。並びはそのまま保つ
   * @returns 0 件なら未選択、1 件なら単一選択、2 件以上なら複数選択
   */
  create(names: readonly string[]): SelectionState {
    if (names.length === 0) {
      return SelectionState.None;
    }
    const [first, second, ...rest] = names;
    if (names.length === 1) {
      return { kind: "single", name: first };
    }
    return { kind: "multiple", names: [first, second, ...rest] };
  },

  /**
   * 名前 1 つから選択を作る。`singleName` の逆向き。
   *
   * @param name 選ばれた 1 つの名前。選べるものが無ければ `none`
   * @returns 名前があれば単一選択、無ければ未選択
   */
  fromName(name: Option<string>): SelectionState {
    return SelectionState.create(name.some ? [name.value] : []);
  },

  /**
   * 1 つだけ選ばれているときの、その名前。
   *
   * 単一選択を前提とする操作（削除・コピー・prop 編集・リサイズ・部品化・解除）は
   * すべてこれを通す。複数選択で `none` を返すことで、「複数選んでいる間は
   * 単一前提の操作が成立しない」が分岐ではなくこの 1 つの関数で決まる。
   *
   * @param selection 名前の出どころになる選択
   * @returns 単一選択ならその名前。未選択と複数選択では `none`
   */
  singleName(selection: SelectionState): Option<string> {
    return selection.kind === "single"
      ? Option.some(selection.name)
      : Option.none;
  },

  /**
   * 選ばれているものの名前すべて。
   *
   * @param selection 名前の出どころになる選択
   * @returns 選ばれている名前の並び。未選択なら空
   */
  names(selection: SelectionState): readonly string[] {
    switch (selection.kind) {
      case "none":
        return [];
      case "single":
        return [selection.name];
      case "multiple":
        return selection.names;
    }
  },

  /** 選ばれている件数。 */
  count(selection: SelectionState): number {
    return SelectionState.names(selection).length;
  },

  /** その名前が選ばれているか。 */
  includes(selection: SelectionState, name: string): boolean {
    return SelectionState.names(selection).includes(name);
  },
} as const;
