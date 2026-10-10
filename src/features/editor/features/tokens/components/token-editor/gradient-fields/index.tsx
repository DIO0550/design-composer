import type { ReactElement } from "react";
import type { TokenValue } from "@/domains/dcmp/token";
import {
  EditContinuities,
  type EditContinuity,
} from "@/domains/session/edit-continuity";
import type {
  GradientControl,
  TokenControlField,
  TokenControlInput,
} from "@/features/editor/features/tokens/domains/token-control";
import { Option } from "@/utils/Option";
import { onEditOf, ValueField } from "../value-field";

const StopButtonClass =
  "flex size-6 shrink-0 items-center justify-center rounded text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent";

/** stop の行の数値の欄。字と余白を詰め、単位を欄に寄せる。 */
const StopNumberCellClass =
  "w-[60px] shrink-0 [&>div]:gap-1 [&_input]:px-1 [&_input]:text-xs";

/**
 * stop の行の 1 欄ぶんの幅。数値の欄は幅を決めて両端に置き、色の欄が余りを占める。
 *
 * 1 行に 5 つ並べると右ペインの幅に収まらないので、ピッカーは見本の大きさ（24px 角）へ縮め、
 * 数値の欄は字と余白を詰める。Color のエディタと同じ欄を使うので、この行の中だけで上書きする。
 */
const StopCellClasses = {
  percent: StopNumberCellClass,
  degree: StopNumberCellClass,
  number: StopNumberCellClass,
  color:
    "min-w-0 flex-1 [&_input[type=color]]:h-6 [&_input[type=color]]:w-6 [&>div]:gap-1.5",
  text: "min-w-0 flex-1 [&_input]:px-1 [&_input]:text-xs",
} as const satisfies Readonly<Record<TokenControlInput["kind"], string>>;

/**
 * 階調のバーと、stop ごとのつまみ。つまみはまだ動かせないので、読み上げから外した飾り。
 *
 * @returns 左から右へ塗ったバーと、stop の比率の位置に置いたつまみ
 */
function GradientBar({
  gradient,
}: Readonly<{ gradient: GradientControl }>): ReactElement {
  return (
    <div aria-hidden="true" className="relative h-3 w-full">
      <div
        style={{ backgroundImage: gradient.bar }}
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
 * グラデーションのエディタの値の欄（docs/06-ui.md「Tokens の gradients」）。
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
  onSetTokenValue: (value: TokenValue, continuity: EditContinuity) => void;
}>): ReactElement {
  const fieldIdOf = (field: TokenControlField) => `${idPrefix}-${field.name}`;

  return (
    <div className="flex flex-col gap-3">
      <div
        aria-hidden="true"
        style={{ backgroundImage: gradient.preview }}
        className="h-24 w-full rounded border border-gray-300"
      />
      <GradientBar gradient={gradient} />
      <div className="flex flex-col gap-1">
        <label
          htmlFor={fieldIdOf(gradient.angle)}
          className="text-gray-600 text-xs"
        >
          {gradient.angle.label}
        </label>
        <ValueField
          key={`${tokenKey}/${gradient.angle.name}`}
          id={fieldIdOf(gradient.angle)}
          input={gradient.angle.input}
          onEdit={onEditOf(gradient.angle, onSetTokenValue)}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-600 text-xs">Stops</span>
        <button
          type="button"
          aria-label="stop を追加"
          onClick={() =>
            onSetTokenValue(gradient.add, EditContinuities.Separate)
          }
          className={StopButtonClass}
        >
          +
        </button>
      </div>
      {gradient.stops.map((row) => (
        <div
          key={`${tokenKey}/${row.name}`}
          className="flex items-center gap-1.5"
        >
          {row.fields.map((field) => (
            <div key={field.name} className={StopCellClasses[field.input.kind]}>
              <label htmlFor={fieldIdOf(field)} className="sr-only">
                {field.label}
              </label>
              <ValueField
                id={fieldIdOf(field)}
                input={field.input}
                onEdit={onEditOf(field, onSetTokenValue)}
              />
            </div>
          ))}
          {/* 2 件以下で消さずに押せない状態で並べるのは docs/06-ui.md「Tokens の gradients」 */}
          <button
            type="button"
            aria-label={row.removeLabel}
            disabled={!Option.isSome(row.remove)}
            onClick={() =>
              Option.map(row.remove, (value) =>
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
