import { type ReactElement, useRef, useState } from "react";
import type { Rgb, TokenValue } from "@/domains/dcmp/token";
import {
  EditContinuities,
  type EditContinuity,
} from "@/domains/session/edit-continuity";
import {
  TokenControl,
  type TokenControlField,
  type TokenControlInput,
} from "@/features/editor/features/tokens/domains/token-control";
import { Option } from "@/utils/Option";

const FieldClass = "w-full rounded border border-gray-300 px-2 py-1";

/**
 * 打っている途中の文字列を持ち、確定したときだけ外へ渡す入力欄。確定は入力欄を離れたと
 * きと Enter。
 *
 * 1 打鍵ごとに渡すと、確定形だけを受け付ける値（kebab-case の名前・数値）では途中の文字
 * 列が弾かれて打ち続けられない（`primary-` が弾かれると `-` の次を打てない）。
 *
 * 外の値が変わったときの取り直しは `key` で行う（`ValueField` が現在値を key にする。
 * 名前の欄は呼び出し側がトークンを key にする）。
 * 確定が通らなかった入力では外の値も key も変わらないので下書きが残るが、
 * `type="number"` の欄は数値として読めない間ブラウザが表示を空にするので、画面に文字列
 * として残るのは `type="text"` の欄だけ。
 */
export function DraftField({
  id,
  type,
  value,
  onCommit,
}: Readonly<{
  id: string;
  type: "text" | "number";
  value: string;
  onCommit: (raw: string) => void;
}>) {
  const [draft, setDraft] = useState(value);

  return (
    <input
      id={id}
      type={type}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      className={FieldClass}
    />
  );
}

/**
 * 色はカラーピッカーだけで編集し、保存時に hex（小文字）へ正規化する。並べている hex は
 * 読み取り専用。ピッカーを開いてから次に開くまでに動かした分を 1 つのまとまりとして送る
 * （docs/06-ui.md「編集操作の一覧」の tokens 編集）。
 *
 * 自由入力にすると「途中まで打った不正な hex」を画面に置くことになり、仕様に無い中間状態の
 * エラー表示を発明することになる。
 *
 * @returns カラーピッカーと、読み取り専用の hex
 */
function ColorPickerField({
  id,
  value,
  onEdit,
}: Readonly<{
  id: string;
  value: Rgb;
  onEdit: (raw: string, continuity: EditContinuity) => void;
}>): ReactElement {
  /*
   * 立てるのは送った時点で、履歴へ入ったかは見ない（prop-field の `LiteralInput` と同じ
   * 扱い）。ピッカーは常に #rrggbb を返すので `TokenControl.valueFrom` の `none` には届かない。
   *
   * 下ろすのは開いたとき（click）で、フォーカスではない。ピッカーを閉じてもフォーカスは
   * 入力欄に残るので、開き直しでは focus が発火しない。
   */
  const hasEdited = useRef(false);

  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="color"
        value={value}
        onClick={() => {
          hasEdited.current = false;
        }}
        onChange={(event) => {
          onEdit(
            event.target.value,
            hasEdited.current
              ? EditContinuities.Continued
              : EditContinuities.Separate,
          );
          hasEdited.current = true;
        }}
        className="h-8 w-16 shrink-0 rounded border border-gray-300"
      />
      <span className="font-mono text-gray-600 text-xs">{value}</span>
    </div>
  );
}

/**
 * 単位を欄の外に添えた数値欄。
 *
 * 単位を欄の外に出すのは、値だけを打てるようにするため（単位まで打たせると数値として
 * 読めない下書きが増える）。UI 案（docs/Design Composer.html）が hex の右へ `100%` を
 * 添えているのと同じ並び。
 *
 * @returns 数値欄と、その右に添えた単位
 */
function UnitField({
  id,
  value,
  unit,
  onCommit,
}: Readonly<{
  id: string;
  value: number;
  unit: "%" | "°";
  onCommit: (raw: string) => void;
}>): ReactElement {
  return (
    <div className="flex items-center gap-2">
      <DraftField
        key={value}
        id={id}
        type="number"
        value={String(value)}
        onCommit={onCommit}
      />
      <span className="text-gray-600 text-xs">{unit}</span>
    </div>
  );
}

/**
 * トークンの 1 フィールドの入力欄。形は値の種別で決まる。
 *
 * 下書きを持つ欄は、現在値を key にして外の値（undo / redo・打った値の正規化・並べ直し）に
 * 追随する。確定は 1 回ごとに別のまとまりとして送る。
 *
 * @returns 色ならカラーピッカー、不透明度と比率なら % を、角度なら ° を添えた数値欄、
 *   数値なら数値欄、それ以外はテキスト欄
 */
export function ValueField({
  id,
  input,
  onEdit,
}: Readonly<{
  id: string;
  input: TokenControlInput;
  onEdit: (raw: string, continuity: EditContinuity) => void;
}>): ReactElement {
  const onCommit = (raw: string) => onEdit(raw, EditContinuities.Separate);
  switch (input.kind) {
    case "number":
      return (
        <DraftField
          key={input.value}
          id={id}
          type="number"
          value={String(input.value)}
          onCommit={onCommit}
        />
      );
    case "text":
      return (
        <DraftField
          key={input.value}
          id={id}
          type="text"
          value={input.value}
          onCommit={onCommit}
        />
      );
    case "percent":
      return (
        <UnitField id={id} value={input.value} unit="%" onCommit={onCommit} />
      );
    case "degree":
      return (
        <UnitField id={id} value={input.value} unit="°" onCommit={onCommit} />
      );
    case "color":
      return <ColorPickerField id={id} value={input.value} onEdit={onEdit} />;
  }
}

/**
 * その欄に打たれた文字列を、トークンの新しい値にして送る手続き（`ValueField` の `onEdit`）。
 *
 * 数値として読めない入力と、値域を外れた入力では値を変えない（`TokenControl.valueFrom` の
 * `none`）。名前欄と同じで、通らなかったことは画面に出さず打ち直しに任せる。仕様に無い
 * 中間状態のエラー表示を発明しないため。
 *
 * @param field 打たれた欄
 * @param onSetTokenValue 読めた値と続き方を受け取る先
 * @returns 欄の文字列と続き方を受け取る手続き
 */
export function onEditOf(
  field: TokenControlField,
  onSetTokenValue: (value: TokenValue, continuity: EditContinuity) => void,
): (raw: string, continuity: EditContinuity) => void {
  return (raw, continuity) => {
    Option.map(TokenControl.valueFrom(field.target, raw), (value) =>
      onSetTokenValue(value, continuity),
    );
  };
}
