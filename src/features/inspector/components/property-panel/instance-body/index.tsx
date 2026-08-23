import { TypeGlyph } from "@/components/type-glyph";
import type { PropEdit } from "@/domains/node";
import { PropControl, type SelectionControls } from "@/domains/prop-control";
import { ControlOffsetClass } from "../label-width";
import { PropRow } from "../prop-row";
import { SectionHeading } from "../section-heading";

/*
 * インスタンスの節の綴りは UI 案 docs/Design Composer.html の `Assets · Instance`
 * 画面から採る。日本語にしないのは、同じ画面の `Public props` / `Assets` /
 * `Components` が既に UI 案の綴りのままで、片方だけ訳すと節の名前が混ざるため。
 */
const InstanceLabels = {
  from: "from",
  publicProps: "Public props",
  instance: "Instance",
  goToSource: "Go to source component",
  selectAllInstances: (count: number) => `Select all ${count} instances`,
  detach: "Detach instance",
  detachNote:
    "Detach bakes overrides into a real tree and auto-renames inner nodes.",
  overridden: "overridden",
  footnote:
    "Only declared publicProps are editable. New declarations come from AI or JSON editing.",
} as const;

/** 解除できないときに、ボタンの `title` へ出す理由（挿入ボタンと同じ扱い）。 */
const DetachDisabledReason = "参照先の部品が見つからないため解除できません";

/** まとめて選んでも選択が変わらないときに、ボタンの `title` へ出す理由。 */
const SelectAllInstancesDisabledReason =
  "このインスタンスしか無いため、まとめて選んでも選択は変わりません";

/** インスタンスの節から呼ぶ操作。常に対で要るので 1 つにまとめて受け取る。 */
export type InstanceActions = Readonly<{
  goToSource: () => void;
  selectAllInstances: () => void;
  detach: () => void;
}>;

/**
 * 上書きしている公開 prop に添える、既定値の知らせ
 * （UI 案の `overridden · default "Button"`）。
 *
 * 既定を持たない公開 prop もありうる（binding 先の prop にスキーマの `default` が
 * 無く、部品側も値を設定していない場合）ので、そのときは `overridden` だけを出す。
 */
function OverriddenNote({ control }: Readonly<{ control: PropControl }>) {
  const defaultValue = control.defaultValue;

  return (
    <p className={`text-gray-400 text-xs ${ControlOffsetClass}`}>
      {InstanceLabels.overridden}
      {defaultValue.some ? (
        <>
          {" · default "}
          {/* 値そのものと地の文を見分けられるよう、UI 案と同じく等幅で出す */}
          <span className="font-mono text-gray-600">
            "{String(defaultValue.value)}"
          </span>
        </>
      ) : null}
    </p>
  );
}

/** 公開 prop 1 件の行。上書きしているときだけ既定値の知らせが下に付く。 */
function PublicPropRow({
  control,
  onEdit,
}: Readonly<{ control: PropControl; onEdit: (edit: PropEdit) => void }>) {
  return (
    <div className="flex flex-col gap-1">
      <PropRow control={control} onEdit={onEdit} />
      {PropControl.hasValue(control) ? (
        <OverriddenNote control={control} />
      ) : null}
    </div>
  );
}

/**
 * インスタンスを選んだときの本文（UI 案 docs/Design Composer.html の
 * `Assets · Instance` の右ペイン）。
 *
 * `group` の見出しを出さないのは、公開 prop の `group` が binding 先の
 * プリミティブのものだから（出すと部品の内部構造が漏れる）。
 */
export function InstanceBody({
  controls,
  onEdit,
  actions,
}: Readonly<{
  controls: Extract<SelectionControls, { kind: "instance" }>;
  onEdit: (edit: PropEdit) => void;
  actions: InstanceActions;
}>) {
  const { source, publicProps } = controls;
  const isSelectAllInstancesEnabled = controls.sourceInstanceCount > 1;

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="flex items-center gap-1.5 text-gray-400 text-xs">
        {InstanceLabels.from}
        <span className="flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 font-medium text-[#7a34d6]">
          <TypeGlyph kind="component" />
          {source}
        </span>
      </p>

      <section className="flex flex-col gap-2">
        <SectionHeading
          trailing={
            <span className="text-gray-400 text-xs">{publicProps.length}</span>
          }
        >
          {InstanceLabels.publicProps}
        </SectionHeading>
        {publicProps.map((control) => (
          <PublicPropRow key={control.prop} control={control} onEdit={onEdit} />
        ))}
      </section>

      <section className="flex flex-col gap-2 border-gray-200 border-t pt-3">
        <SectionHeading>{InstanceLabels.instance}</SectionHeading>
        <button
          type="button"
          onClick={actions.goToSource}
          className="rounded border border-gray-300 px-2 py-1 text-left text-sm hover:bg-gray-100"
        >
          {InstanceLabels.goToSource}
        </button>
        {/*
          UI 案は `Go to source component` と `Detach instance` の間に置いている。
          1 つしか無いときに押せなくするのは、押しても選択が変わらないため
          （`isDetachable` と同じ扱い）。
        */}
        <button
          type="button"
          onClick={actions.selectAllInstances}
          disabled={!isSelectAllInstancesEnabled}
          title={
            isSelectAllInstancesEnabled
              ? undefined
              : SelectAllInstancesDisabledReason
          }
          className="rounded border border-gray-300 px-2 py-1 text-left text-sm hover:bg-gray-100 disabled:opacity-50"
        >
          {InstanceLabels.selectAllInstances(controls.sourceInstanceCount)}
        </button>
        <button
          type="button"
          onClick={actions.detach}
          disabled={!controls.isDetachable}
          title={controls.isDetachable ? undefined : DetachDisabledReason}
          className="rounded border border-gray-300 px-2 py-1 text-left text-sm hover:bg-gray-100 disabled:opacity-50"
        >
          {InstanceLabels.detach}
        </button>
        <p className="text-gray-400 text-xs">{InstanceLabels.detachNote}</p>
      </section>

      <p className="border-gray-200 border-t pt-3 text-gray-400 text-xs">
        {InstanceLabels.footnote}
      </p>
    </div>
  );
}
