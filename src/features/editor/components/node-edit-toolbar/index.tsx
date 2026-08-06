import { PRIMITIVE_TYPES } from "@/domains/primitive-schema";
import type { NodeTemplate } from "@/features/editor/domains/node-template";

/** 選択の状態から決まる、押せない理由。ボタンの `title` に出して操作の見当を付けさせる。 */
const INSERT_DISABLED_REASON = "子を持てるものを選ぶと追加できます";
const REMOVE_DISABLED_REASON = "artboard 配下のノードを選ぶと削除できます";

function CommandButton({
  label,
  isEnabled,
  disabledReason,
  onClick,
}: Readonly<{
  label: string;
  isEnabled: boolean;
  disabledReason: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isEnabled}
      title={isEnabled ? undefined : disabledReason}
      className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50"
    >
      {label}
    </button>
  );
}

/**
 * 選択位置に対する木の編集操作（docs/06-ui.md「編集操作の一覧」の挿入 / 削除）。
 *
 * プリミティブのボタンは `PRIMITIVE_TYPES` から作る。プリミティブが増えたときに
 * 画面側の一覧が取り残されないようにするため（スキーマと二重管理しない）。
 * 部品インスタンスの挿入は「どの部品か」を選ぶ操作なので、部品一覧側に置く。
 */
export function NodeEditToolbar({
  isInsertEnabled,
  isRemoveEnabled,
  onInsert,
  onRemove,
}: Readonly<{
  isInsertEnabled: boolean;
  isRemoveEnabled: boolean;
  onInsert: (template: NodeTemplate) => void;
  onRemove: () => void;
}>) {
  return (
    <section className="flex flex-wrap items-center gap-1">
      <h2 className="sr-only">編集操作</h2>
      {PRIMITIVE_TYPES.map((type) => (
        <CommandButton
          key={type}
          label={`${type} を追加`}
          isEnabled={isInsertEnabled}
          disabledReason={INSERT_DISABLED_REASON}
          onClick={() => onInsert({ kind: "primitive", type })}
        />
      ))}
      <CommandButton
        label="削除"
        isEnabled={isRemoveEnabled}
        disabledReason={REMOVE_DISABLED_REASON}
        onClick={onRemove}
      />
    </section>
  );
}
