import type { ReactElement } from "react";
import { EditContinuities } from "@/domains/session/edit-continuity";
import type {
  GradientControl,
  TokenControlField,
  TokenControlInput,
} from "@/features/editor/features/tokens/domains/token-control";
import { Option } from "@/utils/Option";
import {
  changeRawOf,
  FieldDensities,
  FieldRow,
  type SetTokenValue,
  ValueField,
} from "../value-field";

const StopButtonClass =
  "flex size-6 shrink-0 items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent";

/** stop の行の数値の欄の幅。 */
const StopNumberCellClass = "w-[60px] shrink-0";

/**
 * stop の行の 1 欄ぶんの幅。数値の欄は幅を決めて両端に置き、ピッカーは見本の大きさのまま、
 * hex（読めない色はそのテキスト欄）が余りを占める。
 */
const StopCellClasses = {
  percent: StopNumberCellClass,
  degree: StopNumberCellClass,
  number: StopNumberCellClass,
  color: "shrink-0",
  text: "min-w-0 flex-1",
} as const satisfies Readonly<Record<TokenControlInput["kind"], string>>;

/**
 * 階調のバーと、stop ごとのつまみ。
 *
 * 値は隣の欄が読み上げるので、バーとつまみは飾りとして読み上げから外す。ドラッグを入れる
 * #1037 で見直す。
 *
 * 読み上げから外しているので、描かれていることに気づく手段は Storybook の視覚差分だけ。
 *
 * @returns 左から右へ塗ったバーと、stop の比率の位置に置いたつまみ
 */
function GradientBar({
  gradient,
}: Readonly<{ gradient: GradientControl }>): ReactElement {
  return (
    <div aria-hidden="true" className="relative h-3 w-full">
      <div
        style={{ backgroundImage: gradient.barImage }}
        className="h-3 w-full rounded-sm border border-gray-300"
      />
      {gradient.knobs.map((knob) => (
        <span
          key={knob.name}
          style={{ left: `${knob.percent}%`, backgroundColor: knob.color }}
          className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 size-3 rounded-full border-2 border-white shadow"
        />
      ))}
    </div>
  );
}

/**
 * グラデーションのエディタの値の欄（docs/06-ui.md「`Tokens` の `gradients`」）。
 * 96px のプレビュー → バーとつまみ → 角度 → `Stops` の見出しと + → stop の行の順に並べる。
 *
 * @param idPrefix 欄の id の頭。欄の `name` を添えて label と結ぶ
 * @param tokenKey 編集しているトークン。行の key に混ぜ、別のトークンへ移ったら作り直す
 * @returns 値の欄一式
 */
export function GradientFields({
  gradient,
  idPrefix,
  tokenKey,
  onSetTokenValue,
}: Readonly<{
  gradient: GradientControl;
  idPrefix: string;
  tokenKey: string;
  onSetTokenValue: SetTokenValue;
}>): ReactElement {
  const fieldIdOf = (field: TokenControlField) => `${idPrefix}-${field.name}`;

  return (
    <div className="flex flex-col gap-3">
      {/* 読み上げから外しているので、描かれていることに気づく手段は Storybook の視覚差分だけ */}
      <div
        aria-hidden="true"
        style={{ backgroundImage: gradient.previewImage }}
        className="h-24 w-full rounded border border-gray-300"
      />
      <GradientBar gradient={gradient} />
      <FieldRow
        key={`${tokenKey}/${gradient.angle.name}`}
        id={fieldIdOf(gradient.angle)}
        field={gradient.angle}
        onSetTokenValue={onSetTokenValue}
      />
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-xs">Stops</span>
        <button
          type="button"
          aria-label="stop を追加"
          onClick={() =>
            onSetTokenValue(gradient.afterAdd, EditContinuities.Separate)
          }
          className={StopButtonClass}
        >
          +
        </button>
      </div>
      {gradient.stops.map((row) => (
        <div
          key={`${tokenKey}/${row.name}`}
          className="flex items-center gap-1"
        >
          {row.fields.map((field) => (
            <div key={field.name} className={StopCellClasses[field.input.kind]}>
              <label htmlFor={fieldIdOf(field)} className="sr-only">
                {field.label}
              </label>
              <ValueField
                id={fieldIdOf(field)}
                input={field.input}
                density={FieldDensities.Compact}
                onChangeRaw={changeRawOf(field, onSetTokenValue)}
              />
            </div>
          ))}
          {/* 2 件以下で消さずに押せない状態で並べるのは docs/06-ui.md「`Tokens` の `gradients`」 */}
          <button
            type="button"
            aria-label={row.removeButtonLabel}
            disabled={!Option.isSome(row.afterRemove)}
            onClick={() =>
              Option.map(row.afterRemove, (value) =>
                onSetTokenValue(value, EditContinuities.Separate),
              )
            }
            className={StopButtonClass}
          >
            −
          </button>
        </div>
      ))}
    </div>
  );
}
