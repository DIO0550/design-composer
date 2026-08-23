import type { ReactElement } from "react";
import { DocumentSelection } from "@/domains/document-selection";
import type { PropEdit } from "@/domains/node";
import { SelectionControls } from "@/domains/prop-control";
import { GroupsBody } from "./groups-body";
import { type InstanceActions, InstanceBody } from "./instance-body";
import { SelectionTitle } from "./selection-title";

/*
 * 中身は部品ごとにサブフォルダへ分けてある（`rules/architecture.md`
 * 「複数ファイルへの分割が必要になったら…サブフォルダに分割する」）。
 * ここに残すのは帯と本文の組み立てだけ。
 */

/** インスタンスの節から呼ぶ操作。呼び出し側が組み立てて渡す（定義側の doc を参照）。 */
export type { InstanceActions } from "./instance-body";

/** 束ねた行の綴りを、テストとストーリーが写さずに引けるようにする（定義側の doc を参照）。 */
export { ShorthandLabels } from "./shorthand-row";

/**
 * 帯に出す綴り。英語のままにするのは、同じ帯の右端に出る種別
 * （`selection-title` の `KindLabels`）が UI 案の綴りのままで、
 * 片方だけ訳すと 1 本の帯の中で綴りが混ざるため。
 */
const SelectionLabels = {
  /** 複数選んでいるときに帯へ出す綴り。UI 案に該当の画面が無いので最小の 1 行にする。 */
  multiple: (count: number) => `${count} selected`,
} as const;

/**
 * 選択の種類ごとの本文。
 *
 * 戻り値を `ReactElement`（`ReactNode` ではない）と書いているのは、種類を足して
 * `case` を足し忘れたときにコンパイルエラーにするため（`rules/coding.md`
 * 「列挙した状態の網羅を型で強制する」）。
 *
 * @returns 選択の種類に応じた本文
 */
function SelectionBody({
  controls,
  onEdit,
  instance,
}: Readonly<{
  controls: SelectionControls;
  onEdit: (edit: PropEdit) => void;
  instance: InstanceActions;
}>): ReactElement | null {
  switch (controls.kind) {
    case "instance":
      return (
        <InstanceBody controls={controls} onEdit={onEdit} actions={instance} />
      );
    case "groups":
      return <GroupsBody sections={controls.sections} onEdit={onEdit} />;
    /*
     * 複数選んでいる間は編集欄を 1 つも出さない（docs/06-ui.md「選択」）。
     * 件数は帯が出すので、ここは本文を空にして「選択を解除」だけを残す。
     */
    case "multiple":
      return null;
  }
}

/**
 * 右ペインの帯に出す、いま選んでいるもの
 * （UI 案 docs/Design Composer.html のインスペクタの 44px の帯）。
 *
 * 帯そのもの（`EditorLayout.RightPane.Heading`）は呼び出し側が置く。器は編集画面の
 * 組み立ての一部で、この feature からは触れないため。選んでいないときに中身だけを
 * 空にするのはそのためで、帯ごと消すと選択のたびに本文の位置が帯のぶん動く。
 *
 * 複数選んでいるときに件数を出すのは、1 つの名前も種別も決まらないため
 * （docs/06-ui.md「選択」。本文は編集欄を出さないので、ここが唯一の手がかりになる）。
 *
 * @returns 複数選択なら件数、1 つ選んでいれば名前と種別、何も選んでいなければ空
 */
function PropertyPanelTitle({
  selection,
}: Readonly<{ selection: DocumentSelection }>): ReactElement | null {
  const controls = SelectionControls.forSelection(selection);

  if (controls.some && controls.value.kind === "multiple") {
    return (
      <h2 className="min-w-0 flex-1 truncate font-semibold text-gray-900 text-sm">
        {SelectionLabels.multiple(controls.value.count)}
      </h2>
    );
  }
  const single = DocumentSelection.singleSelection(selection);
  return single.some ? <SelectionTitle selection={single.value} /> : null;
}

/**
 * 帯の下の本文。出すものは「凍結中」「選択あり」「選択なし」の 3 つ。
 *
 * 器（`EditorLayout.RightPane.Body`）は帯と同じく呼び出し側が着せる。
 *
 * 凍結を最初に見るのは、ファイルが不正な間は選択の有無によらず編集させないため
 * （#135。映っているのは最後に正常だった表示で、そこへ加えた編集は今のファイルとは
 * 噛み合わない）。見出しの選択名は残すので、何を選んでいたかは分かる。
 *
 * @returns 凍結中はその旨、選択があれば入力欄、無ければ選択を促す 1 行
 */
function PropertyPanelBody({
  selection,
  isFrozen,
  onEditProp,
  onClearSelection,
  instance,
}: Readonly<{
  selection: DocumentSelection;
  isFrozen: boolean;
  onEditProp: (edit: PropEdit) => void;
  onClearSelection: () => void;
  instance: InstanceActions;
}>): ReactElement {
  if (isFrozen) {
    return <p className="text-[11px] text-gray-400">選択は凍結中</p>;
  }

  const controls = SelectionControls.forSelection(selection);
  if (!controls.some) {
    return <p className="text-gray-500 text-sm">選択されていません</p>;
  }

  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <SelectionBody
        controls={controls.value}
        onEdit={onEditProp}
        instance={instance}
      />
      <button
        type="button"
        onClick={onClearSelection}
        className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
      >
        選択を解除
      </button>
    </div>
  );
}

/**
 * プロパティパネル（docs/06-ui.md「画面構成」。
 * UI 案 docs/Design Composer.html のインスペクタ）。右ペインの帯に出す見出しと、
 * その下の本文の 2 つに分かれる。
 *
 * 1 つの部品にまとめて器（`EditorLayout.RightPane`）ごと返さないのは、器が編集画面の
 * 組み立て（`features/editor`）に属していて、この feature からは import できないため。
 * 呼び出し側が帯と本文それぞれの器に入れる。
 *
 * 帯と本文は**呼び出し側が同じ 1 つの `selection` を両方へ渡す前提**で、同じ純粋関数
 * （`SelectionControls.forSelection`）を通す。別々の選択を渡せば「帯は件数なのに本文はインスタンスの
 * 編集欄」が作れるので、器を着せる側（`rightPaneParts`）で 1 つの値を作って配る。
 *
 * 入力欄はスキーマ定数の走査だけで決まる（`SelectionControls.forSelection`）ため、
 * ここには prop 名で分岐するコードを置かない。
 */
export const PropertyPanel = {
  Title: PropertyPanelTitle,
  Body: PropertyPanelBody,
} as const;
