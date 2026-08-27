import { type ReactElement, useId, useState } from "react";
import type { Token, TokenKind, TokenValue } from "@/domains/dcmp/token";
import { TokenSelection } from "@/domains/session/token-selection";
import { TokenUsedBy } from "@/features/tokens/components/token-used-by";
import {
  TokenControl,
  type TokenControlInput,
} from "@/features/tokens/domains/token-control";
import { Option } from "@/utils/Option";

const FieldClass = "w-full rounded border border-gray-300 px-2 py-1";

/** トークンが選ばれていないときに本文へ出す知らせ。 */
const NoSelectionMessage = "トークンが選択されていません";

/**
 * 帯の右端に出す種別の綴り。
 *
 * UI 案（docs/Design Composer.html）に実在するのは `Color` だけで、残る 4 つは
 * ここで決めた。単数形に揃えているのは、帯が指すのが**その 1 件**だから
 * （一覧側の見出しが複数形なのは集合を指すため）。
 *
 * 種別を足して綴りを足し忘れると、ここがコンパイルエラーになる。
 */
const KindLabels = {
  colors: "Color",
  spacing: "Spacing",
  radius: "Radius",
  shadows: "Shadow",
  typography: "Typography",
} as const satisfies Readonly<Record<TokenKind, string>>;

/**
 * 編集しているトークンの見出し（先頭の色見本 + 名前 + 右端に種別）。
 *
 * 先頭の見本を出すのは色だけ。UI 案が描いているのも色の 14×14 のチップだけで、
 * 他の種別の絵は無い。無い絵を思いつきで足さない（rules/ui-verification.md）。
 *
 * UI 案に無い枠線を足しているのは、白や薄い色のトークンが白い帯に溶けて
 * 見本が消えるため（UI 案の見本は `#111827` の 1 例だけで、この場合が出ていない）。
 *
 * Why not: `components/color-swatch` は使わない。UI 案は一覧の 12px の四角と、
 * この帯の 14px の角丸チップを描き分けており、寄せるとどちらかが UI 案から離れる。
 */
function TokenTitle({ token }: Readonly<{ token: Token }>) {
  return (
    <>
      {token.kind === "colors" ? (
        <span
          aria-hidden="true"
          style={{ background: String(token.value) }}
          className="size-3.5 shrink-0 rounded-sm border border-gray-300"
        />
      ) : null}
      {/* 名前が余りを占める。flex の子は既定で内容幅より縮まないため省略には min-w-0 が要る */}
      <h2 className="min-w-0 flex-1 truncate font-semibold text-gray-900 text-sm">
        {token.name}
      </h2>
      <span className="shrink-0 text-gray-400 text-xs">
        {KindLabels[token.kind]}
      </span>
    </>
  );
}

/**
 * 右ペインの帯に出す、いま編集しているトークン
 * （UI 案 docs/Design Composer.html の Tokens 画面）。
 *
 * 帯そのもの（`PaneHeading`）は呼び出し側が置く。どのペインへ着せるかは 3 ペインの
 * 組み立ての判断で、この feature は持たないため。選んでいないときに中身だけを
 * 空にするのはそのためで、帯ごと消すと選択のたびに本文の位置が帯のぶん動く。
 *
 * @returns 見本・名前・種別の綴り。トークンを選んでいなければ何も出さない
 */
function TokenEditorTitle({
  selection,
}: Readonly<{ selection: TokenSelection }>): ReactElement | null {
  const token = TokenSelection.token(selection);

  if (!token.some) {
    return null;
  }
  return <TokenTitle token={token.value} />;
}

/**
 * 打っている途中の文字列を持ち、確定したときだけ外へ渡す入力欄。
 *
 * 1 打鍵ごとに渡すと、確定形だけを受け付ける値（kebab-case の名前・数値）では
 * 途中の文字列が弾かれて打ち続けられない（`primary-` が弾かれると `-` の次を打てない）。
 * 確定は入力欄を離れたときと Enter。
 *
 * 外の値が変わったときの取り直しは `key` で行う（呼び出し側が現在値を key に混ぜる /
 * rules/hooks.md「state リセット目的の Effect 禁止」）。
 *
 * 確定が通らなかった入力（数値として読めない値・規則を満たさない名前）では外の値が
 * 変わらないので key も変わらず、下書きが残ってそのまま打ち続けられる。ただし
 * `type="number"` の欄は下書きが数値として読めない間ブラウザが表示を空にするので、
 * 画面に文字列として残るのは `type="text"` の欄だけ。
 */
function DraftField({
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
 * トークンの 1 フィールドの入力欄。形は値の種別で決まる。
 *
 * @returns 色ならカラーピッカー、不透明度なら % を添えた数値欄、
 *   数値なら数値欄、それ以外はテキスト欄
 */
function ValueField({
  id,
  input,
  onEdit,
}: Readonly<{
  id: string;
  input: TokenControlInput;
  onEdit: (raw: string) => void;
}>): ReactElement {
  switch (input.kind) {
    case "number":
      return (
        <DraftField
          id={id}
          type="number"
          value={String(input.value)}
          onCommit={onEdit}
        />
      );
    case "text":
      return (
        <DraftField id={id} type="text" value={input.value} onCommit={onEdit} />
      );
    case "alphaPercent":
      return (
        <div className="flex items-center gap-2">
          <DraftField
            id={id}
            type="number"
            value={String(input.value)}
            onCommit={onEdit}
          />
          {/*
            単位を欄の外に出すのは、値だけを打てるようにするため（`%` まで
            打たせると数値として読めない下書きが増える）。UI 案（docs/Design
            Composer.html）が hex の右へ `100%` を添えているのと同じ並び。
          */}
          <span className="text-gray-600 text-xs">%</span>
        </div>
      );
    case "color":
      return (
        <div className="flex items-center gap-2">
          {/*
            色はカラーピッカーだけで編集する（#42「colors はカラーピッカーで編集し、
            保存時に hex（小文字）へ正規化する」）。ピッカーが返すのは常に完成した hex なので
            下書きを挟まずそのまま渡す。並べている hex は読み取り専用。
            自由入力にすると「途中まで打った不正な hex」を画面に置くことになり、
            仕様に無い中間状態のエラー表示を発明することになるため。
          */}
          <input
            id={id}
            type="color"
            value={input.value}
            onChange={(event) => onEdit(event.target.value)}
            className="h-8 w-16 rounded border border-gray-300"
          />
          <span className="font-mono text-gray-600 text-xs">{input.value}</span>
        </div>
      );
  }
}

/**
 * 選択中のトークンの編集欄の本文（docs/06-ui.md「編集操作の一覧」の tokens 編集 /
 * UI 案 docs/Design Composer.html の右ペイン）。
 *
 * 何の入力欄を何行出すかは `TokenControl.forSelection` が決めるため、
 * ここには種別名で分岐するコードを置かない。複合オブジェクトの種別
 * （shadows / typography）はフィールドの数だけ行が並ぶ（#126）。
 *
 * @returns 名前の欄・値の入力欄・削除のボタンと、参照元の一覧。
 *   トークンを選んでいなければ、選ばれていないことの知らせ
 */
function TokenEditorBody({
  selection,
  onSetTokenValue,
  onRenameToken,
  onRemoveToken,
}: Readonly<{
  selection: TokenSelection;
  onSetTokenValue: (value: TokenValue) => void;
  onRenameToken: (name: string) => void;
  onRemoveToken: () => void;
}>): ReactElement {
  const nameId = useId();
  const valueId = useId();
  const control = TokenControl.forSelection(selection);

  if (!control.some) {
    return <p className="text-gray-500 text-sm">{NoSelectionMessage}</p>;
  }

  const { token, fields } = control.value;
  /** どのトークンを編集しているか。名前は種別の中でしか一意でないので種別も混ぜる。 */
  const tokenKey = `${token.kind}/${token.name}`;

  return (
    <section aria-label="トークン編集" className="flex flex-col gap-3 text-sm">
      {fields.map((field) => (
        /*
         * 下書きの取り直しの単位。行は `name` で一意に指す。
         *
         * その行自身の値を混ぜるのは、外から値が変わったとき（undo / redo、
         * 打った値の正規化）に入力欄が古いままにならないため。トークン全体では
         * なく行ごとの値なので、ある行を確定しても他の行の下書きは残る。
         */
        <div
          key={`${tokenKey}/${field.name}/${field.input.value}`}
          className="flex flex-col gap-1"
        >
          <label
            htmlFor={`${valueId}-${field.name}`}
            className="text-gray-600 text-xs"
          >
            {field.label}
          </label>
          {/*
            数値として読めない入力と、値域を外れた入力では値を変えない
            （`TokenControl.valueFrom` の `none`）。名前欄と同じで、通らなかった
            ことは画面に出さず打ち直しに任せる。仕様に無い中間状態のエラー表示を
            発明しないため。
          */}
          <ValueField
            id={`${valueId}-${field.name}`}
            input={field.input}
            onEdit={(raw) =>
              Option.map(
                TokenControl.valueFrom(field.target, raw),
                onSetTokenValue,
              )
            }
          />
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <label htmlFor={nameId} className="text-gray-600 text-xs">
          名前
        </label>
        {/*
          規則を満たさない名前・種別の中で重複する名前では改名しない
          （EditorState.renameToken の `none`）。通らなかったときは打った文字列が
          入力欄に残るので、そのまま直せる。
        */}
        <DraftField
          key={`${tokenKey}/name`}
          id={nameId}
          type="text"
          value={token.name}
          onCommit={onRenameToken}
        />
      </div>
      {/* 並びは UI 案（docs/Design Composer.html）どおり、名前欄の下・削除の上 */}
      <TokenUsedBy selection={selection} />
      <button
        type="button"
        onClick={onRemoveToken}
        className="rounded border border-gray-300 px-2 py-1 text-red-600 hover:bg-gray-100"
      >
        Delete token
      </button>
    </section>
  );
}

/**
 * トークンの編集欄。右ペインの帯に出す見出しと、その下の本文の 2 つに分かれる。
 *
 * 1 つの部品にまとめて器（`EditorLayout.RightPane`）ごと返さないのは、器が編集画面の
 * 組み立て（`features/editor`）に属していて、この feature からは import できないため。
 * 呼び出し側が帯と本文それぞれの器に入れる。
 */
export const TokenEditor = {
  Title: TokenEditorTitle,
  Body: TokenEditorBody,
} as const;
