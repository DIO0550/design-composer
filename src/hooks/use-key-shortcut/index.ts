import { useEffect } from "react";
import { ElementEx } from "@/utils/ElementEx";

/**
 * ページ全体で受けるキーの組み合わせ。
 *
 * `keys` を並びで持つのは、同じ操作に複数のキーを割り当てる流儀があるため
 * （削除の Delete / Backspace）。
 * `withCommandKey` は Windows の Ctrl と macOS の Command の両方を指す。
 * どちらの流儀でも同じ操作ができるよう、2 つを同じ修飾として扱う。
 * `withShiftKey` は Shift の有無で別の操作になる割り当て（undo と redo）を
 * 区別するために要る。
 *
 * 割り当てるキーとフックを分けているのは、押されたかの判定に React が要らないため
 * （フック側はページ全体で受けることと購読の解除だけを持つ）。
 */
export type KeyShortcut = Readonly<{
  keys: readonly string[];
  withCommandKey: boolean;
  withShiftKey: boolean;
}>;

export const KeyShortcut = {
  /**
   * そのキー操作がこの組み合わせにあたるか。
   *
   * 修飾キーの有無まで一致を要求する。緩めると Cmd+C が
   * 「修飾なしの c」に割り当てたショートカットまで叩いてしまうため。
   */
  matches(shortcut: KeyShortcut, event: KeyboardEvent): boolean {
    // 大小を無視して比べる。Shift を押している間 `event.key` は打たれる文字、
    // つまり "z" ではなく "Z" になるため、そのまま比べると
    // Cmd+Shift+Z がどの割り当てにも当たらない。
    const matchesKey = shortcut.keys.some(
      (key) => key.toLowerCase() === event.key.toLowerCase(),
    );
    const matchesCommandKey =
      (event.ctrlKey || event.metaKey) === shortcut.withCommandKey;
    const matchesShiftKey = event.shiftKey === shortcut.withShiftKey;

    return matchesKey && matchesCommandKey && matchesShiftKey;
  },
} as const;

/**
 * 1 件の割り当て。待ち受ける組み合わせと、押されたときに呼ぶ手続きの対。
 *
 * 対で持つのは、同じ操作の別名（削除の Delete / Backspace）ではなく**別々の操作**を
 * まとめて張るため。`KeyShortcut.keys` は前者しか表せないので、矢印 4 方向のように
 * 押したキーで呼ぶ相手が変わるものは、こちらを並べて渡す。
 */
export type KeyShortcutBinding = Readonly<{
  shortcut: KeyShortcut;
  onPress: () => void;
}>;

/**
 * その割り当てが、フォーカスのある要素に食われるか。
 *
 * 文字を打ち込める場所では、どの割り当ても通さない。Backspace のような編集キーを
 * 割り当てたときに入力欄の文字が消せなくなるため（修飾キーを伴う割り当ても、
 * 打ち込んでいる最中に走ると驚きになるので同じ扱いにする）。
 *
 * 選択欄で通さないのは修飾キーを伴わない割り当てだけ。`<select>` は矢印で値が変わる
 * ので素のキーは食われるが、`⌘Z` のような操作まで止めると、prop を選び直した直後に
 * 戻せなくなる。
 *
 * @param shortcut 見ている割り当て
 * @param target キー操作の発火元
 * @returns フォーカスのある要素が受け取るなら `true`
 */
function isConsumedByTarget(
  shortcut: KeyShortcut,
  target: EventTarget | null,
): boolean {
  if (ElementEx.isTextEditable(target)) {
    return true;
  }
  return !shortcut.withCommandKey && ElementEx.isSelectControl(target);
}

/**
 * ページ全体のキーボードショートカットを、複数まとめて張る。
 * 押されたキーに当たった割り当てのうち、先に並んでいる 1 件だけを呼ぶ。
 *
 * 押す対象が特定の要素ではなく画面のどこにフォーカスがあっても効く操作なので、
 * 要素の `onKeyDown` では受けられず `document` に張る（rules/hooks.md の
 * 「本質的にグローバルな関心事」）。1 回の購読で複数を見るのは、割り当ての数だけ
 * フックを呼ぶとフックの数が呼び出し側の表の長さで変わってしまうため。
 *
 * フォーカスのある要素がそのキーを自分で受け取る間は無視する（`isConsumedByTarget`）。
 * この扱いはどの割り当てにも共通なので、割り当ての側ではなくここが持つ。
 *
 * 当たった押下では既定動作を止める。**割り当てに一致した時点でその押下はアプリの操作**
 * なので、矢印のスクロールのようなブラウザ側の動きを重ねない。
 *
 * Why not: 矢印の割り当てだけを止める形にしない。デスクトップアプリなので、割り当て済みの
 * キーにブラウザの既定動作（`⌘C` の選択文字のコピー等）を残す意味が薄く、割り当てごとに
 * 出し分けると「どれが既定を止めるか」を各割り当てが覚えることになる。
 *
 * 購読は毎 render 張り直す。`bindings` を呼び出し側が毎回組み立てるためで、
 * 安定させたいなら `useMemo` で受け渡す（`onPress` を `useCallback` で包むだけでは効かない）。
 *
 * @param bindings 待ち受ける割り当ての並び
 */
export function useKeyShortcuts(bindings: readonly KeyShortcutBinding[]): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const bound = bindings.find(
        ({ shortcut }) =>
          KeyShortcut.matches(shortcut, event) &&
          !isConsumedByTarget(shortcut, event.target),
      );
      if (bound === undefined) {
        return;
      }
      event.preventDefault();
      bound.onPress();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [bindings]);
}

/**
 * ページ全体のキーボードショートカット。指定した組み合わせが押されたら `onPress` を呼ぶ。
 * 割り当てが 1 件だけの `useKeyShortcuts`。
 *
 * @param shortcut 待ち受けるキーの組み合わせ
 * @param onPress その組み合わせが押されたときに呼ぶ手続き
 */
export function useKeyShortcut(
  shortcut: KeyShortcut,
  onPress: () => void,
): void {
  useKeyShortcuts([{ shortcut, onPress }]);
}
