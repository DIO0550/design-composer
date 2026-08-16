import { type PrimitiveType, PrimitiveTypes } from "@/domains/primitive-schema";
import { TypeGlyph } from "@/features/editor/components/type-glyph";
import { NodeTemplate } from "@/features/editor/domains/node-template";
import type { Option } from "@/utils/Option";

/** 押せないときに `title` へ出す理由。押せない状態を見せるだけだと打つ手が分からない。 */
const InsertDisabledReason = "子を持てるものを選ぶと追加できます";

/** アイコンだけのボタン。`TypeGlyph` は `aria-hidden` なので、名前は `aria-label` で与える。 */
function InsertButton({
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
      title={isEnabled ? undefined : InsertDisabledReason}
      className="flex h-8 w-9 items-center justify-center rounded-md hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <TypeGlyph kind={type} />
    </button>
  );
}

/**
 * インスタンスを運んでいることの表示（UI 案 docs/Design Composer.html は 5 画面すべてに
 * `◆` を置き、部品を運んでいる画面でだけ `background:#f3ebff` を付けている）。
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
      className={`flex h-8 w-9 items-center justify-center rounded-md text-[#9747ff] ${
        isPlacing ? "bg-[#f3ebff]" : ""
      }`}
    >
      ◆
    </span>
  );
}

/**
 * キャンバスに浮かぶツールバー（UI 案 docs/Design Composer.html / #112）。
 *
 * UI 案が並べるポインタ・`#`（artboard）は置かない。順にツールモードの概念が無い /
 * artboard の追加が未実装（#43）が理由（`ArtboardList` が UI 案の `+` を出していないのと
 * 同じ判断）。`◆` は**ボタンではなく状態表示**として置く（#203）。
 * 並びを `PrimitiveTypes` から作るのは、スキーマと二重管理しないため。
 *
 * 影と丸みはこの部品が持つが、**位置は持たない**。キャンバス下端にはエラー一覧も
 * 並ぶため、順序は両方を積む器（`CanvasDockStack`）が決める（#128）。ここで浮かせると
 * 一覧の上に重なり、ツールバーが一覧を隠す。
 * **形を落としてもテストは落ちない** — happy-dom は Tailwind を解決せず、
 * class 名の assert は実装詳細のテストになる。気づく手段は Storybook の視覚差分だけ。
 */
export function NodeInsertToolbar({
  isInsertEnabled,
  dragged,
  onInsert,
}: Readonly<{
  isInsertEnabled: boolean;
  /** 今パレットから運んでいる指定。`◆` を点けるかどうかがこれで決まる。 */
  dragged: Option<NodeTemplate>;
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
      aria-label="挿入"
      className="flex h-11 items-center gap-0.5 rounded-[13px] bg-white px-1.5 shadow-[0_5px_18px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.06)]"
    >
      {PrimitiveTypes.map((type) => (
        <InsertButton
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
