import { TypeGlyph } from "@/components/type-glyph";
import {
  type PrimitiveType,
  PrimitiveTypes,
} from "@/domains/dcmp/primitive-schema";
import { NodeTemplate } from "@/domains/session/node-template";
import type { Option } from "@/utils/Option";

/** 押せないときに `title` へ出す理由。押せない状態を見せるだけだと打つ手が分からない。 */
const PrimitiveInsertDisabledReason = "子を持てるものを選ぶと追加できます";

/**
 * artboard を足すボタンの読み上げ名。UI 案の字面は `#` だけなので、名前は別に与える。
 *
 * `features/sidebar` の `artboard-list` が `+` に与える名前と**同じ綴りにしてある**
 * （同じ操作に別の名前を与えない）。共有の定数にしないのは、表示の綴りのために
 * feature 間へ辺を張ることになるため。片方だけ変えると、同じ操作が 2 つの名前で
 * 読み上げられる。
 */
const AddArtboardLabel = "artboard を追加";

/**
 * 1 スロットぶんの器（UI 案 docs/Design Composer.html は 5 スロットとも
 * `36×32` / `border-radius:6px`）。押せるもの・押せないものが同じ枠に並ぶので、
 * 枠の寸法は 1 箇所に置く。
 */
const SlotClassName = "flex h-8 w-9 items-center justify-center rounded-md";

/**
 * 押せるスロット。`SlotClassName` と分けているのは、`◆` が押せるものではなく
 * hover を持たないため（3 者で共通にできるのは寸法までになる）。
 */
const PressableSlotClassName = `${SlotClassName} hover:bg-gray-100`;

/**
 * artboard を 1 枚足すボタン。
 *
 * Why not: `PrimitiveInsertButton` に相乗りさせない。プリミティブは選択位置へ挿すので
 * 挿せる位置が無ければ押せないが、artboard は選択に依らず常に押せる（`Artboards` の
 * 見出しの `+` と同じ）。押せない理由の `title` も要らない。
 *
 * Why not: 字面を手書きせず `TypeGlyph` を使うので、`#` は UI 案のツールバーの灰
 * （`#5c5c5c`）ではなく種別色の青になる。`□` / `T` が既に同じ乖離を抱えており
 * （#112 の単位で扱う）、ここだけ寄せると同じ列で色の決まり方が 2 通りになる。
 * **この色はテストでは落ちない** — 気づく手段は Storybook の視覚差分だけ。
 */
function AddArtboardButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <button
      type="button"
      // `aria-current` は付けない。付けるとキャンバスの artboard の行として拾われる
      // （`components/__tests__/row-names.ts`）
      aria-label={AddArtboardLabel}
      onClick={onClick}
      className={PressableSlotClassName}
    >
      <TypeGlyph kind="artboard" />
    </button>
  );
}

/** アイコンだけのボタン。`TypeGlyph` は `aria-hidden` なので、名前は `aria-label` で与える。 */
function PrimitiveInsertButton({
  type,
  isEnabled,
  onClick,
}: Readonly<{
  type: PrimitiveType;
  isEnabled: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      aria-label={`${type} を追加`}
      onClick={onClick}
      disabled={!isEnabled}
      title={isEnabled ? undefined : PrimitiveInsertDisabledReason}
      className={`${PressableSlotClassName} disabled:opacity-40 disabled:hover:bg-transparent`}
    >
      <TypeGlyph kind={type} />
    </button>
  );
}

/**
 * インスタンスを運んでいることの表示（UI 案 docs/Design Composer.html は、浮かぶ
 * ツールバーを描いている 4 画面すべてに `◆` を置き、部品を運んでいる画面でだけ
 * `background:#f3ebff` を付けている。Error 画面にはツールバー自体が無い）。
 *
 * ボタンにはしない。`Assets` が browse-only で挿入がドラッグ専用である以上、
 * これを押して挿す経路は UI 案に存在しない（#198）。押せない見た目のまま置くと
 * 「挿せる位置が無いから押せない」と読めてしまうので、操作ではなく状態として描く。
 *
 * @returns 運んでいる間だけ色の付く `◆`
 */
function InstancePlacementIndicator({
  isPlacing,
}: Readonly<{ isPlacing: boolean }>) {
  return (
    <span
      /*
       * 運んでいることは行の強調とドロップ先の提示でも伝わるので、読み上げでは
       * 同じことを 3 回言わせない（`TypeGlyph` を読み上げから外すのと同じ扱い）。
       */
      aria-hidden="true"
      className={`${SlotClassName} text-[#9747ff] ${
        isPlacing ? "bg-[#f3ebff]" : ""
      }`}
    >
      ◆
    </span>
  );
}

/**
 * キャンバスに浮かぶツールバー（UI 案 docs/Design Composer.html / #112 / #316）。
 * artboard を 1 枚足す `#` と、プリミティブを選択位置へ挿す `□` / `T` が並ぶ。
 *
 * UI 案が先頭に置くポインタは持たない（ツールモードの概念が無い）。**`#` を先頭に
 * 置く**のはそのため — UI 案の並びは `ポインタ → # → □ → T` で、実装する 4 つの
 * 相対順序を保つと `#` が先頭になる。`◆` は**ボタンではなく状態表示**（#203）。
 * プリミティブの並びを `PrimitiveTypes` から作るのは、スキーマと二重管理しないため。
 *
 * Why not: `#` を「今のツール」のトグルにはしない。この実装では `□` / `T` が既に
 * 即時挿入のボタンなので、`#` だけをモードにすると 1 列の中で操作モデルが 2 つに割れる。
 *
 * 押せる条件を artboard について持たないのは、**ファイルが不正な間はこのツールバー
 * 自体が出ない**（出し分けはキャンバス下端に積む器が持つ / #128）ため。押せる形のまま
 * 何も起きない経路は無い。
 *
 * 影と丸みはこの部品が持つが、**位置は持たない**。キャンバス下端にはエラー一覧も
 * 並ぶため、順序は両方を積む器（`CanvasDockStack`）が決める（#128）。ここで浮かせると
 * 一覧の上に重なり、ツールバーが一覧を隠す。
 * **形を落としてもテストは落ちない** — happy-dom は Tailwind を解決せず、
 * class 名の assert は実装詳細のテストになる。気づく手段は Storybook の視覚差分だけ。
 */
export function CanvasToolbar({
  isInsertEnabled,
  dragged,
  onAddArtboard,
  onInsert,
}: Readonly<{
  isInsertEnabled: boolean;
  /** 今パレットから運んでいる指定。`◆` を点けるかどうかがこれで決まる。 */
  dragged: Option<NodeTemplate>;
  onAddArtboard: () => void;
  onInsert: (template: NodeTemplate) => void;
}>) {
  /*
   * 点けるのは部品を運んでいるときだけ。`◆` はアプリ全体で「部品 / インスタンス」を
   * 指す記号（`TypeGlyph` の `component`）なので、Box を運んでいる間に点けると
   * 記号が 2 つの意味を持つ。UI 案が点灯を描いているのも部品を運んでいる画面だけ。
   */
  const isPlacingInstance =
    dragged.some && NodeTemplate.isInstance(dragged.value);

  return (
    <section
      /*
       * 中身を動詞で括らない。並ぶのは追加の入口（`#` / `□` / `T`）だけでなく
       * 運んでいることの表示（`◆`）でもあるので、器はモジュール名と同じく場所で呼ぶ。
       *
       * Why not: 名前は「ツールバー」だが `role="toolbar"` にはしない。その role は
       * 矢印キーでスロット間を移る操作（roving tabindex）を約束するもので、ここは
       * 実装しておらず、操作でない `◆` も並びに混ざる。
       */
      aria-label="キャンバスのツールバー"
      className="flex h-11 items-center gap-0.5 rounded-[13px] bg-white px-1.5 shadow-[0_5px_18px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.06)]"
    >
      <AddArtboardButton onClick={onAddArtboard} />
      {Object.values(PrimitiveTypes).map((type) => (
        <PrimitiveInsertButton
          key={type}
          type={type}
          isEnabled={isInsertEnabled}
          onClick={() => onInsert({ kind: "primitive", type })}
        />
      ))}
      {/* UI 案は `◆` の手前に区切り線を置く（プリミティブの追加とは別の並びを表す） */}
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-gray-200" />
      <InstancePlacementIndicator isPlacing={isPlacingInstance} />
    </section>
  );
}
