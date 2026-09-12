import {
  Children,
  createContext,
  type ElementType,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import type { ValueOf } from "@/types/ValueOf";
import { ArrayEx } from "@/utils/ArrayEx";
import { KeyName, KeyNames } from "@/utils/KeyName";
import { Option } from "@/utils/Option";

/**
 * 行の色味。取り消せない操作だけ赤くする（UI 案 docs/Design Composer.html の `Delete`）。
 */
export const ContextMenuTones = {
  Normal: "normal",
  Danger: "danger",
} as const;

/** 行の色味。 */
type ContextMenuTone = ValueOf<typeof ContextMenuTones>;

/*
 * UI 案 docs/Design Composer.html の `Context menu` が持つ寸法（px）。
 *
 * 高さは実測せず行数から出す。`getBoundingClientRect` は happy-dom が 0 を返すので、実測に
 * すると折り返しを確かめる手段が視覚差分だけになる。要素へは class ではなく `style` で渡す
 * — class に書くと同じ数値が 2 箇所になり、片方だけ変えても全件緑のまま位置が狂う。
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
 * Enter を入れないのは、ページ全体に Enter の割り当てが無く渡しても何も起きないため。
 */
const MenuKeys: readonly KeyName[] = [
  KeyNames.Escape,
  KeyNames.ArrowDown,
  KeyNames.ArrowUp,
  KeyNames.Space,
];

/** 行から器へ触れるもの。 */
type ContextMenuControl = Readonly<{ close: () => void }>;

const ContextMenuControlContext = createContext<Option<ContextMenuControl>>(
  Option.none,
);

/**
 * 囲っている器。閉じる手を context で配るのは、`onClose` を行ごとに渡させると片方だけ
 * 書き忘れた行が作れるため。
 *
 * @returns 囲っている `ContextMenu`
 * @throws `ContextMenu` の外で呼ばれたとき（配置ミスなので隠さずに落とす）
 */
function useContextMenuControl(): ContextMenuControl {
  const control = useContext(ContextMenuControlContext);
  if (!control.some) {
    throw new Error("ContextMenu.Item は ContextMenu の内側でのみ使える");
  }
  return control.value;
}

/**
 * `children` の中から、その階層に並んでいる `type` の要素だけを集める。`Fragment` と配列は
 * 中へ降りる。
 *
 * @param children 集める対象
 * @param type 集めたい要素の型
 * @returns 見つかった要素。1 つも無ければ空
 */
function collectElements(
  children: ReactNode,
  type: ElementType,
): readonly ReactElement[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child)) {
      return [];
    }
    if (child.type === Fragment) {
      return collectElements(childrenOf(child), type);
    }
    return child.type === type ? [child] : [];
  });
}

/**
 * 要素が抱えている中身。
 *
 * @param element 中身を取り出す要素
 * @returns その要素の `children`。持っていなければ `undefined`
 */
function childrenOf(element: ReactElement): ReactNode {
  return (element as ReactElement<{ children?: ReactNode }>).props.children;
}

/**
 * 組に並ぶ行の綴りをつないだもの。
 *
 * @param list 組
 * @returns その組に並ぶ行の綴り。行が無ければ空
 */
function rowLabels(list: ReactElement): string {
  return collectElements(childrenOf(list), ContextMenuItem)
    .map((item) => (item as ReactElement<{ label: string }>).props.label)
    .join();
}

/**
 * 並んだ組ぜんたいの高さ。
 *
 * @param lists 器が描く組（`collectElements` が集めたもの）
 * @returns 枠線と余白を含めた高さ（px）
 */
function menuHeight(lists: readonly ReactElement[]): number {
  const rowCount = lists.reduce(
    (count, list) =>
      count + collectElements(childrenOf(list), ContextMenuItem).length,
    0,
  );
  const separatorCount = Math.max(lists.length - 1, 0);
  const edges = (MenuPadding + MenuBorderWidth) * 2;
  const separators = separatorCount * (SeparatorLineHeight + SeparatorGap * 2);
  return edges + rowCount * RowHeight + separators;
}

/**
 * 窓の中へ収めたメニューの左上。ポインタの位置に合わせ、はみ出す辺ではポインタの反対側へ
 * 折り返す。
 *
 * 折り返した先へ入るかは見ない。両側へ折り返しても入らないのは窓が 424×390 より小さいとき
 * で、既定は 800×600（src-tauri/tauri.conf.json。下限は設けていない）。
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
 * 範囲の判定を落とすと `focus()` が undefined に対して投げるが、React がハンドラの例外を
 * 非同期に報告するため**落ちるテストは 1 件も無い**。
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
 * 区切りで区切られる 1 組の行。中身に `ContextMenu.Item` を並べる。自分では DOM を持たない
 * （UI 案 `Context menu` も組ごとの器を持たず、行と区切りを並列に置いている）。
 *
 * 並べるのは器が高さに数えるのと同じ並び（`collectElements` の結果）。素通しにすると、器が
 * 見つけられない行が「出るのに高さへ入らない」状態になる。
 *
 * @returns 受け取った中身のうち行だけ
 */
function ContextMenuList({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return <>{collectElements(children, ContextMenuItem)}</>;
}

/**
 * メニューの 1 行。押すと `onSelect` を呼んでから器を閉じる。
 *
 * @returns 綴りと、持っていれば併記する割り当てを並べた行
 */
function ContextMenuItem({
  label,
  shortcut,
  tone,
  isEnabled,
  onSelect,
}: Readonly<{
  label: string;
  /** 併記するキーボードの割り当て。持たない操作では欄ごと出さない。 */
  shortcut: Option<string>;
  tone: ContextMenuTone;
  /** 今その操作ができるか。できない行は消さずに押せない状態で並べる。 */
  isEnabled: boolean;
  onSelect: () => void;
}>): ReactElement {
  const { close } = useContextMenuControl();

  return (
    <button
      type="button"
      role="menuitem"
      disabled={!isEnabled}
      // 行のあいだを動かすのは ↑↓ なので、Tab の順路には入れない
      tabIndex={-1}
      onClick={() => {
        onSelect();
        close();
      }}
      style={{ height: RowHeight }}
      className={`flex w-full items-center gap-6 px-[10px] text-[11px] ${
        isEnabled ? EnabledRowClasses[tone] : DisabledRowClass
      }`}
    >
      <span className="flex-1 text-left">{label}</span>
      {shortcut.some ? (
        // 割り当ては行の色に従わない（押せる行でも淡いまま / UI 案）
        <span className="font-mono text-[#c4c4c4] text-[10px]">
          {shortcut.value}
        </span>
      ) : null}
    </button>
  );
}

/**
 * ポインタの位置に開くメニュー（docs/06-ui.md「コンテキストメニュー」）。中身は呼び出し側が
 * `ContextMenu.List` と `ContextMenu.Item` で組む。
 *
 * 開いた時点ではどの行にもフォーカスを当てず器が受け取る（UI 案にも強調された行は無い）。
 *
 * @returns 組のあいだに区切りを挟んで縦に並べた器
 */
function ContextMenuRoot({
  at,
  children,
  onClose,
}: Readonly<{
  at: Readonly<{ x: number; y: number }>;
  children: ReactNode;
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

  const lists = collectElements(children, ContextMenuList);
  const placement = menuPlacement(at, menuHeight(lists));

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="コンテキストメニュー"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (!KeyName.isOneOf(MenuKeys, event)) {
          return;
        }
        // 漏らすとメニューを操作しただけで、同じキーの割り当てがドキュメントを動かす
        event.stopPropagation();
        if (event.key === KeyNames.Escape) {
          onClose();
          return;
        }
        // space は行の button が既定の活性化で受けるので、渡さないことだけを行う
        if (event.key === KeyNames.Space) {
          return;
        }
        // 矢印でのスクロールを重ねない
        event.preventDefault();
        moveFocus(
          event.currentTarget,
          event.key === KeyNames.ArrowDown
            ? FocusSteps.Next
            : FocusSteps.Previous,
        );
      }}
      style={{
        left: placement.left,
        top: placement.top,
        width: MenuWidth,
        paddingBlock: MenuPadding,
      }}
      /*
       * `outline-none` は器のフォーカスの輪を消すため（UI 案 docs/Design Composer.html は
       * メニューの枠を `1px #e6e6e6` としか描いていない）。
       *
       * **`fixed` と `z-20` を落としてもテストは 1 件も落ちない。** インラインの
       * `left` / `top` は `position: static` でも読めるうえ、happy-dom は重なりも解決
       * しないため。気づく手段は視覚差分だけ。
       */
      className="fixed z-20 rounded-md border border-[#e6e6e6] bg-white shadow-[0_5px_18px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.06)] outline-none"
    >
      <ContextMenuControlContext.Provider
        value={Option.some({ close: onClose })}
      >
        {lists.map((list, index) => (
          /*
           * 鍵は組に並ぶ行の綴りから作る。`Children.toArray` が振る鍵はその階層の中でだけ
           * 一意で、`Fragment` を降りて集めると兄弟から同じ鍵の組が来る。**重なっても
           * 落ちるテストは 1 件も無い**（React が `console.error` で警告するだけ）。
           */
          <Fragment key={rowLabels(list)}>
            {index > 0 ? (
              <hr
                style={{
                  height: SeparatorLineHeight,
                  marginBlock: SeparatorGap,
                }}
                className="border-0 bg-[#f0f0f0]"
              />
            ) : null}
            {list}
          </Fragment>
        ))}
      </ContextMenuControlContext.Provider>
    </div>
  );
}

/** ポインタの位置に開くメニュー。中身は呼び出し側が children で組む。 */
export const ContextMenu = Object.assign(ContextMenuRoot, {
  List: ContextMenuList,
  Item: ContextMenuItem,
});
