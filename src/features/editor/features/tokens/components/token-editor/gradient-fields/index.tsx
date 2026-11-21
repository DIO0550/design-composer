import type { ReactElement } from "react";
import { Button, ButtonKinds } from "@/components/button";
import { EditContinuities } from "@/domains/session/edit-continuity";
import type { GradientControl } from "@/features/editor/features/tokens/domains/token-control";
import { Option } from "@/utils/Option";
import { ColorField } from "../color-field";
import {
  FieldDensities,
  FieldRow,
  type SetTokenValue,
  type SubmitTokenRawEdit,
  ValueField,
} from "../value-field";

/** stop の行の比率の欄の幅。色の欄が余りを占める。 */
const StopNumberCellClass = "w-[60px] shrink-0";

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
 * @param onEdit 角度・比率・色の欄に打たれた綴りの渡し先
 * @param onSetTokenValue stop の +・− で作った値の渡し先
 * @returns 値の欄一式
 */
export function GradientFields({
  gradient,
  idPrefix,
  tokenKey,
  onEdit,
  onSetTokenValue,
}: Readonly<{
  gradient: GradientControl;
  idPrefix: string;
  tokenKey: string;
  onEdit: SubmitTokenRawEdit;
  onSetTokenValue: SetTokenValue;
}>): ReactElement {
  const fieldIdOf = (field: Readonly<{ name: string }>) =>
    `${idPrefix}-${field.name}`;

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
        onEdit={onEdit}
      />
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-xs">Stops</span>
        <Button
          kind={ButtonKinds.Icon}
          aria-label="stop を追加"
          onClick={() =>
            onSetTokenValue(gradient.afterAdd, EditContinuities.Separate)
          }
        >
          +
        </Button>
      </div>
      {gradient.stops.map((row) => (
        <div
          key={`${tokenKey}/${row.name}`}
          className="flex items-center gap-1"
        >
          <div className={StopNumberCellClass}>
            <label htmlFor={fieldIdOf(row.ratio)} className="sr-only">
              {row.ratio.label}
            </label>
            <ValueField
              id={fieldIdOf(row.ratio)}
              input={row.ratio.input}
              density={FieldDensities.Compact}
              target={row.ratio.target}
              onEdit={onEdit}
            />
          </div>
          <div className="relative min-w-0 flex-1">
            <label htmlFor={fieldIdOf(row.color.caption)} className="sr-only">
              {row.color.caption.label}
            </label>
            <ColorField
              id={fieldIdOf(row.color.caption)}
              color={row.color}
              onEdit={onEdit}
            />
          </div>
          {/* 2 件以下で消さずに押せない状態で並べるのは docs/06-ui.md「`Tokens` の `gradients`」 */}
          <Button
            kind={ButtonKinds.Icon}
            aria-label={row.removeButtonLabel}
            disabled={!Option.isSome(row.afterRemove)}
            onClick={() =>
              Option.map(row.afterRemove, (value) =>
                onSetTokenValue(value, EditContinuities.Separate),
              )
            }
          >
            −
          </Button>
        </div>
      ))}
    </div>
  );
}
