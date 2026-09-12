import { type ReactElement, type ReactNode, useState } from "react";
import { DropLine } from "@/components/drop-line";
import { type RowProps, useReorderDrag } from "@/hooks/use-reorder-drag";
import type { ValueOf } from "@/types/ValueOf";
import { Option } from "@/utils/Option";
import { type DropSide, ReorderDrag } from "@/utils/ReorderDrag";
import { SetEx } from "@/utils/SetEx";

/** 1 段ぶんの字下げ幅と、行の左端の余白（px）。 */
const IndentWidthPx = 12;
const RowPaddingPx = 8;

/**
 * 開閉の三角を置く枠。子を持たない行でも同じ幅を空けて、中身の左端を兄弟と揃える
 * （UI 案 docs/Design Composer.html も子を持たない行に空の枠を置いている）。
 *
 * UI 案の実測値は 9px で、この 10px はそれと 1px ずれている。揃えると見た目が
 * 動いて視覚差分になるため、ここでは直さず別の機会に扱う。
 */
const BranchToggleSlotStyle = { width: "10px" };

/**
 * 入れ子に並ぶ 1 行。子も同じ形なので、木がそのまま入れ子で表せる。
 *
 * `name` は木の中で一意であることを前提にしている。重なると、同じ名前の枝が
 * まとめて畳まれ、React の `key` も重なる。一意性を保証できるのは行の元になっている
 * ものを持っている側だけなので、器では確かめない。
 */
export type NestedRow = Readonly<{
  /** 行を指す名前。開閉の状態と、開閉・並べ替えの読み上げ名に使う。 */
  name: string;
  /**
   * 三角と並べ替えの間に置く中身。何を描くかは呼び出し側が決める。
   */
  content: ReactNode;
  /**
   * 今の選択に含まれているか。行全体の色に出る。
   *
   * ここが無視されても落ちるテストは無い（色は class にしか出ない）。
   * 気づく手段は Storybook の視覚差分（`DocumentTree` の `NodeSelected`）だけ。
   */
  isSelected: boolean;
  children: readonly NestedRow[];
}>;

/**
 * 並びが何を映しているか。
 *
 * `Filtered` は「条件で絞った後の並び」で、器の振る舞いが 2 つ変わる — 畳みを見ないことと、
 * 掴む口を配らないこと。1 つの事実から決まるので真偽値 2 つに割らない
 * （rules/components.md「真偽値 props よりも状態を表す列挙を優先する」）。
 */
export const NestedRowModes = {
  Full: "full",
  Filtered: "filtered",
} as const;

/** 並びが何を映しているか。 */
export type NestedRowMode = ValueOf<typeof NestedRowModes>;

/**
 * 同じ親の中での位置。親の名前と index は片方だけでは位置が決まらないため 1 つの型にま
 * とめる。
 */
export type NestedRowPosition = Readonly<{
  parentName: string;
  index: number;
}>;

/**
 * どの行でも同じ値（今の開閉と、行から起こせる操作）。
 * 行ごとに変わる値（行そのもの・位置・深さ）と混ぜず、まとめて 1 つで受け渡す。
 */
type BranchControl = Readonly<{
  /** 畳んでいる枝の名前。畳んだ側を持つので、初めて描いたときは空になる。 */
  collapsedNames: ReadonlySet<string>;
  mode: NestedRowMode;
  onReorder: (from: NestedRowPosition, toIndex: number) => void;
  onToggleBranch: (name: string) => void;
}>;

/**
 * 枝を開閉する三角（UI 案 docs/Design Composer.html の `▾` / `▸`）。
 *
 * 行の中身とは別のボタンにする。
 *
 * 開いているかどうかは `aria-expanded` が伝える。
 *
 * @returns 押すと開閉が入れ替わる三角のボタン
 */
function BranchToggle({
  name,
  isExpanded,
  onToggle,
}: Readonly<{
  name: string;
  isExpanded: boolean;
  onToggle: () => void;
}>): ReactElement {
  return (
    <button
      type="button"
      aria-label={`${name} の開閉`}
      aria-expanded={isExpanded}
      onClick={onToggle}
      style={BranchToggleSlotStyle}
      /*
       * 列の幅は中身の左端を揃えるための 10px だが、それだけでは押す的が小さすぎる。
       * 疑似要素で当たり判定だけを外へ広げ、行の組み方（列幅）は変えない。
       */
      className="relative shrink-0 text-[9px] text-gray-400 before:absolute before:-inset-1.5 before:content-['']"
    >
      {isExpanded ? "▾" : "▸"}
    </button>
  );
}

/**
 * 1 行と、開いていればその下にぶら下がる子の並び。
 * 字下げ・開閉の列・選択の色といった行の組み立てをここ 1 箇所に集める。
 *
 * 字下げ幅は深さで決まる値でクラス名に固定できないため、インラインスタイルで与える。
 *
 * @returns 1 行と、開いていればその下に続く子の並び
 */
function RowBranch({
  row,
  depth,
  rowProps,
  isHeld,
  dropSide,
  control,
}: Readonly<{
  row: NestedRow;
  depth: number;
  /** 掴む口と、ポインタが入ったことを伝える口。絞った並びでは配られないので不在 */
  rowProps: Option<RowProps>;
  /** 今掴まれている行か。掴んでいる間は淡くする */
  isHeld: boolean;
  /** 落ちる先ならどちら側に線を引くか。落ちる先でなければ不在 */
  dropSide: Option<DropSide>;
  control: BranchControl;
}>): ReactElement {
  const hasChildren = row.children.length > 0;
  /*
   * 絞った並びでは畳みを見ない。畳んだ枝の中の一致が出ないと、絞り込みが
   * 「見えている範囲の絞り込み」になって探す操作として働かないため
   * （docs/06-ui.md「絞り込み」）。
   */
  const isFiltered = control.mode === NestedRowModes.Filtered;
  const isExpanded = isFiltered || !control.collapsedNames.has(row.name);
  /*
   * 絞っている間は三角を出さない。出すと、押しても見た目が変わらないまま畳んだ側の名前
   * だけが書き換わり、絞り込みを解いたときに元と違う畳み方で現れる（docs/06-ui.md
   * 「絞り込み」は畳んだ状態そのものは書き換えないと定めている）。
   */
  const showsToggle = hasChildren && !isFiltered;
  /*
   * 子の並びを出す条件。子がいない行は畳めないので常に「開いている」側に倒れるが、
   * 出すものが無いので空の <ul> を作らないよう子の有無も見る。
   */
  const showsChildren = hasChildren && isExpanded;

  return (
    <>
      <div
        style={{
          paddingInlineStart: `${RowPaddingPx + depth * IndentWidthPx}px`,
        }}
        /* 落ちる先の線を行の縁へ重ねるので、行を位置の基準にする（relative） */
        className={`relative flex items-center gap-1.5 rounded py-1 pr-1 ${
          // 押せる範囲を示す hover と、選択の色を重ねない（選択中はホバーで灰にしない）
          row.isSelected ? "bg-blue-100 text-blue-900" : "hover:bg-gray-100"
        } ${isHeld ? "opacity-40" : ""}`}
        {...(rowProps.some ? rowProps.value : {})}
      >
        {showsToggle ? (
          <BranchToggle
            name={row.name}
            isExpanded={isExpanded}
            onToggle={() => control.onToggleBranch(row.name)}
          />
        ) : (
          // 三角の出ない行にも同じ幅を空け、中身の左端を兄弟と揃える
          // （これを消しても落ちるテストは無く、視覚差分でしか気づけない）
          <span
            aria-hidden="true"
            style={BranchToggleSlotStyle}
            className="shrink-0"
          />
        )}
        {row.content}
        {dropSide.some ? <DropLine side={dropSide.value} /> : null}
      </div>
      {showsChildren ? (
        <RowList
          rows={row.children}
          parentName={row.name}
          depth={depth + 1}
          control={control}
        />
      ) : null}
    </>
  );
}

/**
 * 同じ親を持つ行の並び。子も同じ形なので枝を通して自分自身へ戻る。
 *
 * **ドラッグの状態をこの階層ごとに持つ。** 1 つの `<ul>` = 1 つの親の子の並びなので、掴
 * んだ群だけが落ちる先を持ち、別の親の行の上で離しても移動が起きない（`onReorder` が並
 * びの外を指さない）。
 *
 * @returns 行を 1 段ぶん並べた `<ul>`
 */
function RowList({
  rows,
  parentName,
  depth,
  control,
}: Readonly<{
  rows: readonly NestedRow[];
  parentName: string;
  depth: number;
  control: BranchControl;
}>): ReactElement {
  const { drag, rowProps, groupProps } = useReorderDrag((move) =>
    control.onReorder({ parentName, index: move.fromIndex }, move.toIndex),
  );
  /*
   * 絞った並びでは掴む口を配らない。`useReorderDrag` が持つのは並びの中の index だけ
   * なので、絞った並びの index をそのまま送ると**別のノードが動く**（型は通り、
   * 絞り込み中に掴むケースが無ければテストも緑のまま壊れる）。
   * docs/06-ui.md「絞り込み」がドラッグを止めると定めているのもこのため。
   *
   * 止めるのは掴む口だけでよい。掴んでいなければ `groupProps` が受ける離しも並びの外へ
   * 出たことも移動を起こさないので、器の側では止めない。
   */
  const isReorderable = control.mode === NestedRowModes.Full;

  return (
    <ul {...groupProps()}>
      {rows.map((row, index) => (
        <li key={row.name}>
          <RowBranch
            row={row}
            depth={depth}
            rowProps={
              isReorderable ? Option.some(rowProps(index)) : Option.none
            }
            isHeld={ReorderDrag.isHeld(drag, index)}
            dropSide={ReorderDrag.dropSideAt(drag, index)}
            control={control}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * 入れ子の行を並べ、枝の開閉と、同じ親の中での並べ替えができる器。行に何を描くかは持た
 * ず、字下げ・開閉の列と、行がどの並びのどこにいるかだけを持つ。
 *
 * 並べ替えは行を掴んで運ぶ（`useReorderDrag`）。掴む口を配るのも、移動先を「同じ親の中
 * の位置」として読み替えるのも階層ごとの `RowList` で、ここが渡すのは移動を受け取る口だ
 * け。
 *
 * 畳んだ**側**の名前を持つので、初めて描いたときは全部が開いた状態になり、後から増えた
 * 行が畳まれた状態で現れることもない。絞った並び（`mode`）では畳みを見ず、三角と掴む口も
 * 出さない。
 *
 * @returns 行の並び。行が 1 つも無ければ `null`（空の `<ul>` を作らない）
 */
export function NestedRowList({
  rows,
  parentName,
  mode,
  onReorder,
}: Readonly<{
  rows: readonly NestedRow[];
  /** 最上段の行の親の名前。その行自体は描かず、並べ替えの位置にだけ出る。 */
  parentName: string;
  mode: NestedRowMode;
  onReorder: (from: NestedRowPosition, toIndex: number) => void;
}>): ReactElement | null {
  const [collapsedNames, setCollapsedNames] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  if (rows.length === 0) {
    return null;
  }

  const control: BranchControl = {
    collapsedNames,
    mode,
    onReorder,
    onToggleBranch: (name) =>
      setCollapsedNames((current) => SetEx.toggle(current, name)),
  };

  return (
    <RowList rows={rows} parentName={parentName} depth={0} control={control} />
  );
}
