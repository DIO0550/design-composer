import type { ReactElement } from "react";
import type { PropEdit } from "@/domains/dcmp/node";
import type {
  PropControlRow,
  PropControlSection,
} from "@/domains/prop-control";
import { CaseStyle } from "@/utils/CaseStyle";
import { PropRow } from "../prop-row";
import { SectionHeading } from "../section-heading";
import { ShorthandRow } from "../shorthand-row";

/**
 * セクションに並ぶ 1 行。
 *
 * 戻り値を `ReactElement`（`ReactNode` ではない）と書いているのは、行の種類を
 * 足して `case` を足し忘れたときにコンパイルエラーにするため。
 *
 * @returns 行の種類に応じた 1 行
 */
function SectionRow({
  row,
  onEdit,
}: Readonly<{
  row: PropControlRow;
  onEdit: (edit: PropEdit) => void;
}>): ReactElement {
  switch (row.kind) {
    case "prop":
      return <PropRow control={row.control} onEdit={onEdit} />;
    case "shorthand":
      return <ShorthandRow shorthand={row.shorthand} onEdit={onEdit} />;
  }
}

/**
 * 行を並びの中で見分ける識別子。
 *
 * @param row 識別子が欲しい行
 * @returns 1 prop の行は prop 名、束ねた行は shorthand 名
 */
function rowKey(row: PropControlRow): string {
  return row.kind === "prop" ? row.control.prop : row.shorthand.name;
}

/**
 * 見出しでまとめた prop の並び（Layout / Size / Appearance）。UI 案は罫線で区切る。
 *
 * Why not: UI 案が見出しの右端に描く `⋯` は置かない。開いた先のメニューがどこにも
 * 描かれておらず、まとめて未指定へ戻す操作も各 prop の導線（セグメントの再押下・
 * `未指定（既定: …）`・テキストを空にする）で足りているため。
 */
function GroupSection({
  section,
  onEdit,
}: Readonly<{
  section: PropControlSection;
  onEdit: (edit: PropEdit) => void;
}>) {
  return (
    <div className="flex flex-col gap-2 border-gray-200 border-t pt-3 first:border-t-0 first:pt-0">
      <SectionHeading>{CaseStyle.toCapitalCase(section.group)}</SectionHeading>
      {section.rows.map((row) => (
        <SectionRow key={rowKey(row)} row={row} onEdit={onEdit} />
      ))}
    </div>
  );
}

/** 見出しでまとめた prop の並び。編集できる prop が無ければその旨を出す。 */
export function GroupsBody({
  sections,
  onEdit,
}: Readonly<{
  sections: readonly PropControlSection[];
  onEdit: (edit: PropEdit) => void;
}>) {
  if (sections.length === 0) {
    return <p className="text-gray-500">編集できる prop がありません</p>;
  }
  return (
    <div className="flex w-full flex-col gap-3">
      {sections.map((section) => (
        <GroupSection key={section.group} section={section} onEdit={onEdit} />
      ))}
    </div>
  );
}
