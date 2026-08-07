import { useId, useState } from "react";
import type { TokenValue } from "@/domains/token";
import type { EditorState } from "@/features/editor/domains/editor-state";
import {
  TokenControl,
  type TokenControlInput,
} from "@/features/editor/domains/token-control";
import { Option } from "@/utils/Option";

const FIELD_CLASS = "w-full rounded border border-gray-300 px-2 py-1";

/** 種別ごとの見出し（UI 案 docs/Design Composer.html の `COLOR TOKEN`）。 */
const HEADINGS = {
  colors: "COLOR TOKEN",
  spacing: "SPACING TOKEN",
  radius: "RADIUS TOKEN",
  shadows: "SHADOW TOKEN",
  typography: "TYPOGRAPHY TOKEN",
} as const;

/**
 * 打っている途中の文字列を持ち、確定したときだけ外へ渡す入力欄。
 *
 * 1 打鍵ごとに渡すと、確定形だけを受け付ける値（kebab-case の名前・数値）では
 * 途中の文字列が弾かれて打ち続けられない（`primary-` が弾かれると `-` の次を打てない）。
 * 確定は入力欄を離れたときと Enter。
 *
 * 外の値が変わったときの取り直しは `key` で行う（呼び出し側が現在値を key にする /
 * rules/hooks.md「state リセット目的の Effect 禁止」）。
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
      className={FIELD_CLASS}
    />
  );
}

function ValueField({
  id,
  input,
  onEdit,
}: Readonly<{
  id: string;
  input: TokenControlInput;
  onEdit: (raw: string) => void;
}>) {
  if (input.kind === "length") {
    return (
      <DraftField
        id={id}
        type="number"
        value={String(input.value)}
        onCommit={onEdit}
      />
    );
  }

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

/**
 * 選択中のトークンの編集欄（docs/06-ui.md「編集操作の一覧」の tokens 編集 /
 * UI 案 docs/Design Composer.html の右ペイン）。
 *
 * 何の入力欄を出すかは種別の対応表だけで決まる（`TokenControl.forSelection`）ため、
 * ここには種別名で分岐するコードを置かない。
 */
export function TokenEditor({
  state,
  onSetTokenValue,
  onRenameToken,
  onRemoveToken,
}: Readonly<{
  state: EditorState;
  onSetTokenValue: (value: TokenValue) => void;
  onRenameToken: (name: string) => void;
  onRemoveToken: () => void;
}>) {
  const nameId = useId();
  const valueId = useId();
  const control = TokenControl.forSelection(state);

  if (!control.some) {
    return (
      <section className="text-sm">
        <h2 className="mb-2 font-semibold text-gray-500 text-xs uppercase">
          トークン
        </h2>
        <p className="text-gray-500">選択されていません</p>
      </section>
    );
  }

  const { token, input } = control.value;
  /** 下書きの取り直しの単位。名前は種別の中でしか一意でないので種別も混ぜる。 */
  const tokenKey = `${token.kind}/${token.name}`;

  return (
    <section aria-label="トークン編集" className="flex flex-col gap-3 text-sm">
      <h2 className="font-semibold text-gray-500 text-xs uppercase">
        {HEADINGS[token.kind]}
      </h2>
      <div className="flex flex-col gap-1">
        <label htmlFor={valueId} className="text-gray-600 text-xs">
          値
        </label>
        <ValueField
          key={`${tokenKey}/value`}
          id={valueId}
          input={input}
          onEdit={(raw) =>
            Option.map(
              TokenControl.valueFrom(control.value, raw),
              onSetTokenValue,
            )
          }
        />
      </div>
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
