import { Fragment, type ReactElement, useEffect, useRef } from "react";
import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import type { Option } from "@/utils/Option";

/**
 * 行の色味。取り消せない操作だけ赤くする（UI 案 docs/Design Composer.html の `Delete`）。
 */
export const ContextMenuTones = {
  Normal: "normal",
  Danger: "danger",
} as const;

/** 行の色味。 */
export type ContextMenuTone = ValueOf<typeof ContextMenuTones>;

/**
 * メニューの 1 行。
 */
export type ContextMenuRow = Readonly<{
  label: string;
  /** 併記するキーボードの割り当て。持たない操作では欄ごと出さない。 */
  shortcut: Option<string>;
  tone: ContextMenuTone;
  /** 今その操作ができるか。できない行は消さずに押せない状態で並べる。 */
  isEnabled: boolean;
  onSelect: () => void;
}>;

/*
 * UI 案 docs/Design Composer.html の `Context menu` が持つ寸法（px）。
 *
 * 高さを実測せず行数から計算するために定数で持つ。**実測（`getBoundingClientRect`）にすると
 * happy-dom が 0 を返す**ので、はみ出す辺での折り返しを確かめる手段が視覚差分だけになる。
 * 下の要素へは class ではなく `style` で渡す — class で書くと同じ数値が 2 箇所になり、
 * 片方だけ変えても計算側は古い値のまま全件緑で出す位置だけが狂う。
 */

/** 器の幅。 */
const MenuWidth = 212;

/** 1 行の高さ。 */
const RowHeight = 26;

/** 区切り線そのものの高さ。 */
const SeparatorLineHeight = 1;

/** 区切り線の上下に空ける余白。 */
const SeparatorGap = 4;

/** 器の上下に空ける余白。 */
const MenuPadding = 5;

/** 器の枠線の太さ（片側ぶん）。 */
const MenuBorderWidth = 1;

/** フォーカスを動かす向き。 */
const FocusSteps = {
  Next: 1,
  Previous: -1,
} as const;

/** フォーカスを動かす向き。 */
type FocusStep = ValueOf<typeof FocusSteps>;

/**
 * メニューが自分で受けるキー。ここに無いキーはページ全体の割り当てへ渡す。
 *
 * space が入るのは、押している間パンの構えになる（`use-space-held` が `document` で拾う）
 * ため。行の活性化そのものは `button` の既定に任せるので、既定動作までは止めない。
 * Enter を入れないのは、ページ全体に Enter の割り当てが無く、渡しても何も起きないから。
 */
const MenuKeys = ["Escape", "ArrowDown", "ArrowUp", " "];

/**
 * 並んだ行ぜんたいの高さ。
 *
 * @param groups 区切りで分かれた行の組
 * @returns 枠線と余白を含めた高さ（px）
 */
function menuHeight(groups: readonly (readonly ContextMenuRow[])[]): number {
  const rowCount = groups.reduce((count, group) => count + group.length, 0);
  const separatorCount = groups.length - 1;
  const edges = (MenuPadding + MenuBorderWidth) * 2;
  const separators = separatorCount * (SeparatorLineHeight + SeparatorGap * 2);
  return edges + rowCount * RowHeight + separators;
}

/**
 * 窓の中へ収めたメニューの左上。ポインタの位置に合わせ、はみ出す辺ではポインタの反対側へ
 * 折り返す。
 *
 * 折り返した先へ入るかは見ない。幅 212px・高さは最も長い並びでも 200px 弱なので、両側へ
 * 折り返しても入らないには窓が 424×390 より小さい必要があり、窓の既定は 800×600
 * （src-tauri/tauri.conf.json。下限は設けていない）。
 *
 * @param at ポインタの位置（窓の左上を原点にした座標）
 * @param height 収めるメニューの高さ
 * @returns `position: fixed` へ渡す左上の座標
 */
function menuPlacement(
  at: Readonly<{ x: number; y: number }>,
  height: number,
): Readonly<{ left: number; top: number }> {
  const window = globalThis.window;
  const fitsToRight = at.x + MenuWidth <= window.innerWidth;
  const fitsBelow = at.y + height <= window.innerHeight;
  return {
    left: fitsToRight ? at.x : at.x - MenuWidth,
    top: fitsBelow ? at.y : at.y - height,
  };
}

/**
 * 次にフォーカスを当てる行の位置。端まで来たら反対の端へ回る。
 *
 * @param rows 押せる行のボタン
 * @param step 動かす向き
 * @returns `rows` の中での位置。どの行にもフォーカスが無ければ向きの側の端
 */
function nextFocusIndex(rows: readonly Element[], step: FocusStep): number {
  const focused = globalThis.document.activeElement;
  const current = focused === null ? -1 : rows.indexOf(focused);
  if (current < 0) {
    return step === FocusSteps.Next ? 0 : rows.length - 1;
  }
  return (current + step + rows.length) % rows.length;
}

/**
 * 押せる行のあいだでフォーカスを動かす。押せる行が 1 つも無ければ何も起きない。
 *
 * 押せる行が 0 件のメニューは実際に出る（空き領域を開いた直後は Paste / Undo / Redo の
 * 3 行がどれも押せない）。**この範囲の判定を落とすと `focus()` が undefined に対して
 * 投げるが、React がハンドラの例外を非同期に報告するため vitest は失敗として拾わない** —
 * 落ちるテストは 1 件も無い。
 *
 * @param menu 行を持つ器
 * @param step 動かす向き
 */
function moveFocus(menu: HTMLElement, step: FocusStep): void {
  const rows = Array.from(
    menu.querySelectorAll<HTMLButtonElement>("button:not([disabled])"),
  );
  const index = nextFocusIndex(rows, step);
  if (!ArrayEx.isIndexInRange(rows, index)) {
    return;
  }
  rows[index].focus();
}

/** 押せない行の色（UI 案 `Context menu` が押せない 3 行をこの色で描いている）。 */
const DisabledRowClass = "text-[#c4c4c4]";

/** 押せる行の色。 */
const EnabledRowClasses = {
  normal: "text-[#1e1e1e]",
  danger: "text-[#d13438]",
} as const satisfies Readonly<Record<ContextMenuTone, string>>;

/**
 * ポインタの位置に開くメニュー（docs/06-ui.md「コンテキストメニュー」）。並ぶものと押せるか
 * どうかは呼び出し側が決め、ここは見せ方・キーボード操作・閉じるきっかけだけを持つ。
 *
 * 開いた時点ではどの行にもフォーカスを当てず器が受け取る（UI 案にも強調された行は無い）。
 *
 * @returns 区切りで分かれた行を縦に並べた器
 */
export function ContextMenu({
  at,
  groups,
  onClose,
}: Readonly<{
  at: Readonly<{ x: number; y: number }>;
  groups: readonly (readonly ContextMenuRow[])[];
  onClose: () => void;
}>): ReactElement {
  const menuRef = useRef<HTMLDivElement>(null);

  /*
   * 開いた時点でキーの届く先をメニューへ移す。`autoFocus` は div では効かない
   * （React が `focus()` を呼ぶのはフォーム要素だけ）。
   * 1 度だけ当てるのは、↑↓ で行へ移したフォーカスを再レンダーで奪い返さないため。
   */
  useEffect(() => {
    menuRef.current?.focus();
  }, []);

  /*
   * 外側の押下だけは `document` で待つ（rules/hooks.md が「要素外クリックの検知」を
   * グローバルな関心事として挙げている）。右クリックの受け口そのものは要素の props で受ける。
   */
  useEffect(() => {
    const closeOnOutside = (event: PointerEvent) => {
      const menu = menuRef.current;
      const isInsideMenu =
        menu !== null &&
        event.target instanceof Node &&
        menu.contains(event.target);
      if (isInsideMenu) {
        return;
      }
      onClose();
    };

    globalThis.document.addEventListener("pointerdown", closeOnOutside);
    return () =>
      globalThis.document.removeEventListener("pointerdown", closeOnOutside);
  }, [onClose]);

  const placement = menuPlacement(at, menuHeight(groups));

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="コンテキストメニュー"
      // 開いた時点のフォーカスの受け皿。Tab の順路には入れない
      tabIndex={-1}
      onKeyDown={(event) => {
        if (!MenuKeys.includes(event.key)) {
          return;
        }
        /*
         * 受けたキーはページ全体の割り当てへ渡さない。Esc は選択解除、↑↓ は選んでいる
         * ノードの座標の移動に割り当ててあり（`use-clear-selection-shortcut` /
         * `use-reposition-shortcut`）、漏らすとメニューを操作しただけでドキュメントが動く。
         * React はルート要素で待つので、ここで止めれば `document` の購読まで上がらない。
         */
        event.stopPropagation();
        if (event.key === "Escape") {
          onClose();
          return;
        }
        // space は行の button が既定の活性化で受けるので、渡さないことだけを行う
        if (event.key === " ") {
          return;
        }
        // 矢印でのスクロールを重ねない
        event.preventDefault();
        moveFocus(
          event.currentTarget,
          event.key === "ArrowDown" ? FocusSteps.Next : FocusSteps.Previous,
        );
      }}
      style={{
        left: placement.left,
        top: placement.top,
        width: MenuWidth,
        paddingBlock: MenuPadding,
      }}
      /*
       * 器のフォーカスの輪を消す。ここへフォーカスを当てるのはキーを受けるためだけで、
       * UI 案（docs/Design Composer.html）はメニューの枠を `1px #e6e6e6` としか描いて
       * いない。押せる行へ移ったことは行側の輪が示す。
       *
       * **`fixed` と `z-20` を落としてもテストは 1 件も落ちない。** インラインの
       * `left` / `top` は `position: static` でも読めるので出す位置のテストが通り続け、
       * happy-dom は重なりも解決しない。気づく手段はストーリーの視覚差分だけ。
       */
      className="fixed z-20 rounded-md border border-[#e6e6e6] bg-white shadow-[0_5px_18px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.06)] outline-none"
    >
      {groups.map((group, groupIndex) => (
        // 組に id が無いので、その組に並ぶ綴りを鍵にする（同じ綴りは 1 つのメニューに 2 度出ない）
        <Fragment key={group.map((row) => row.label).join()}>
          {/* 線は hr で出す（既定の枠線を消して、UI 案の 1px の面にする） */}
          {groupIndex > 0 ? (
            <hr
              style={{
                height: SeparatorLineHeight,
                marginBlock: SeparatorGap,
              }}
              className="border-0 bg-[#f0f0f0]"
            />
          ) : null}
          {group.map((row) => (
            <button
              key={row.label}
              type="button"
              role="menuitem"
              disabled={!row.isEnabled}
              // 行のあいだを動かすのは ↑↓ なので、Tab の順路には入れない
              tabIndex={-1}
              onClick={() => {
                row.onSelect();
                onClose();
              }}
              style={{ height: RowHeight }}
              className={`flex w-full items-center gap-6 px-[10px] text-[11px] ${
                row.isEnabled ? EnabledRowClasses[row.tone] : DisabledRowClass
              }`}
            >
              <span className="flex-1 text-left">{row.label}</span>
              {row.shortcut.some ? (
                // 割り当ては行の色に従わない（押せる行でも淡いまま / UI 案）
                <span className="font-mono text-[#c4c4c4] text-[10px]">
                  {row.shortcut.value}
                </span>
              ) : null}
            </button>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
