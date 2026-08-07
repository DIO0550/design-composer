import type { ReactNode } from "react";
import { PRIMITIVE_TYPES } from "@/domains/primitive-schema";
import type { NodeTemplate } from "@/features/editor/domains/node-template";

/** 選択の状態から決まる、押せない理由。ボタンの `title` に出して操作の見当を付けさせる。 */
const INSERT_DISABLED_REASON = "子を持てるものを選ぶと追加できます";
const COPY_DISABLED_REASON = "artboard 配下のノードを選ぶとコピーできます";
const PASTE_DISABLED_REASON = "コピーしてから子を持てるものを選ぶと貼れます";
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
 * プリミティブごとの追加ボタン。
 *
 * 一覧は `PRIMITIVE_TYPES` から作る。プリミティブが増えたときに画面側の一覧が
 * 取り残されないようにするため（スキーマと二重管理しない）。
 * 部品インスタンスの挿入は「どの部品か」を選ぶ操作なので、部品一覧側に置く。
 */
function InsertCommands({
  isEnabled,
  onInsert,
}: Readonly<{
  isEnabled: boolean;
  onInsert: (template: NodeTemplate) => void;
}>) {
  return (
    <>
      {PRIMITIVE_TYPES.map((type) => (
        <CommandButton
          key={type}
          label={`${type} を追加`}
          isEnabled={isEnabled}
          disabledReason={INSERT_DISABLED_REASON}
          onClick={() => onInsert({ kind: "primitive", type })}
        />
      ))}
    </>
  );
}

function CopyCommand({
  isEnabled,
  onCopy,
}: Readonly<{ isEnabled: boolean; onCopy: () => void }>) {
  return (
    <CommandButton
      label="コピー"
      isEnabled={isEnabled}
      disabledReason={COPY_DISABLED_REASON}
      onClick={onCopy}
    />
  );
}

function PasteCommand({
  isEnabled,
  onPaste,
}: Readonly<{ isEnabled: boolean; onPaste: () => void }>) {
  return (
    <CommandButton
      label="貼り付け"
      isEnabled={isEnabled}
      disabledReason={PASTE_DISABLED_REASON}
      onClick={onPaste}
    />
  );
}

function RemoveCommand({
  isEnabled,
  onRemove,
}: Readonly<{ isEnabled: boolean; onRemove: () => void }>) {
  return (
    <CommandButton
      label="削除"
      isEnabled={isEnabled}
      disabledReason={REMOVE_DISABLED_REASON}
      onClick={onRemove}
    />
  );
}

/**
 * 選択位置に対する木の編集操作（docs/06-ui.md「編集操作の一覧」の挿入 / 削除 /
 * コピー & ペースト）。
 *
 * 操作ごとに「押せるか」と「押されたら何をするか」が対で要るため、
 * 操作の数だけ props を並べず children で合成する（rules/components.md）。
 */
export function NodeEditToolbar({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <section className="flex flex-wrap items-center gap-1">
      <h2 className="sr-only">編集操作</h2>
      {children}
    </section>
  );
}

NodeEditToolbar.Insert = InsertCommands;
NodeEditToolbar.Copy = CopyCommand;
NodeEditToolbar.Paste = PasteCommand;
NodeEditToolbar.Remove = RemoveCommand;
