import { type CSSProperties, type ReactElement, useId } from "react";
import type { Token, TokenKind } from "@/domains/dcmp/token";
import type { TokenSelection } from "@/domains/session/token-selection";
import { TokenUsedBy } from "@/features/editor/features/tokens/components/token-used-by";
import {
  TokenControl,
  type TokenPaint,
} from "@/features/editor/features/tokens/domains/token-control";
import { Option } from "@/utils/Option";
import { GradientFields } from "./gradient-fields";
import {
  DraftField,
  FieldDensities,
  FieldRow,
  type SetTokenValue,
} from "./value-field";

/** トークンが選ばれていないときに本文へ出す知らせ。 */
const NoSelectionMessage = "トークンが選択されていません";

/**
 * 帯の右端に出す種別の綴り。
 *
 * UI 案（docs/Design Composer.html）に実在するのは `Color` だけ。`Gradient` は docs/06-ui.md
 * 「`Tokens` の `gradients`」が決めていて、残る 4 つはここで決めた。
 *
 * 種別を足して綴りを足し忘れると、ここがコンパイルエラーになる。
 */
const KindLabels = {
  colors: "Color",
  spacing: "Spacing",
  radius: "Radius",
  shadows: "Shadow",
  typography: "Typography",
  gradients: "Gradient",
} as const satisfies Readonly<Record<TokenKind, string>>;

/**
 * 見出しの先頭の見本を塗る指定。
 *
 * @param paint 単色か階調か
 * @returns 単色なら背景色、階調なら背景画像
 */
function titleSwatchStyleOf(paint: TokenPaint): CSSProperties {
  switch (paint.kind) {
    case "color":
      return { background: paint.color };
    case "gradient":
      return { backgroundImage: paint.value };
  }
}

/**
 * 見出しの先頭の見本。
 *
 * 一覧の `ColorSwatch` / `GradientSwatch` に寄せないのは、大きさが違うため（UI 案の実測で
 * 見出しは 14×14、一覧は 12×12）。
 *
 * @returns 単色なら色、階調なら階調で塗った 14×14 のチップ
 */
function TitleSwatch({ paint }: Readonly<{ paint: TokenPaint }>): ReactElement {
  return (
    <span
      aria-hidden="true"
      style={titleSwatchStyleOf(paint)}
      className="size-3.5 shrink-0 rounded-sm border border-gray-300"
    />
  );
}

/**
 * 編集しているトークンの見出し（先頭の見本 + 名前 + 右端に種別）。
 *
 * 先頭の見本は色と階調だけ。UI 案が描いているのは色の 14×14 のチップだけで、階調は
 * docs/06-ui.md「`Tokens` の `gradients`」が足している。無い絵を思いつきで足さない
 * （rules/ui-verification.md）。
 */
function TokenTitle({
  token,
  paint,
}: Readonly<{ token: Token; paint: Option<TokenPaint> }>) {
  return (
    <>
      {Option.isSome(paint) ? <TitleSwatch paint={paint.value} /> : null}
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
 * 帯そのもの（`PaneHeading`）は呼び出し側が置く。選んでいないときに中身だけを空にするのは
 * そのためで、帯ごと消すと選択のたびに本文の位置が帯のぶん動く。
 *
 * @returns 見本・名前・種別の綴り。トークンを選んでいないときは何も出さない
 */
function TokenEditorTitle({
  selection,
}: Readonly<{ selection: TokenSelection }>): ReactElement | null {
  /* 選択そのものではなく編集欄から引くのは、帯と本文で出る / 出ないを揃えるため。 */
  const control = TokenControl.forSelection(selection);

  if (!Option.isSome(control)) {
    return null;
  }
  return (
    <TokenTitle token={control.value.token} paint={control.value.titlePaint} />
  );
}

/**
 * 選択中のトークンの編集欄の本文（docs/06-ui.md「編集操作の一覧」の tokens 編集 /
 * UI 案 docs/Design Composer.html の右ペイン）。
 *
 * 何の入力欄を何行出すかは `TokenControl.forSelection` が決めるため、ここには種別名で分岐
 * するコードを置かない。分岐するのは編集欄の形（fields / gradient）だけで、種別名では
 * 分岐しない。複合オブジェクトの種別（shadows / typography）はフィールドの数だけ行が並ぶ。
 *
 * @returns 名前の欄・値の入力欄（グラデーションならプレビュー・角度・stop の行）・削除の
 *   ボタンと、参照元の一覧。トークンを選んでいなければ、選ばれていないことの知らせ
 */
function TokenEditorBody({
  selection,
  onSetTokenValue,
  onRenameToken,
  onRemoveToken,
}: Readonly<{
  selection: TokenSelection;
  onSetTokenValue: SetTokenValue;
  onRenameToken: (name: string) => void;
  onRemoveToken: () => void;
}>): ReactElement {
  const nameId = useId();
  const valueId = useId();
  const control = TokenControl.forSelection(selection);

  if (!Option.isSome(control)) {
    return <p className="text-gray-500 text-sm">{NoSelectionMessage}</p>;
  }

  const { token, valueFields } = control.value;
  /** どのトークンを編集しているか。名前は種別の中でしか一意でないので種別も混ぜる。 */
  const tokenKey = `${token.kind}/${token.name}`;

  return (
    <section aria-label="トークン編集" className="flex flex-col gap-3 text-sm">
      {valueFields.kind === "fields" ? (
        valueFields.fields.map((field) => (
          /*
           * 下書きの取り直しの単位。行は `name` で一意に指す。
           *
           * 値の追随は `ValueField` が下書きの欄の key に現在値を入れて行う。行の key に値を
           * 入れるとピッカーが動かすたびに作り直され、undo を 1 件にまとめられない。
           */
          <FieldRow
            key={`${tokenKey}/${field.name}`}
            id={`${valueId}-${field.name}`}
            field={field}
            onSetTokenValue={onSetTokenValue}
          />
        ))
      ) : (
        <GradientFields
          gradient={valueFields.gradient}
          idPrefix={valueId}
          tokenKey={tokenKey}
          onSetTokenValue={onSetTokenValue}
        />
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor={nameId} className="text-gray-600 text-xs">
          名前
        </label>
        {/*
          `TokenSet.rename` が弾く名前では改名しない
          （EditorState.renameToken の `none`）。通らなかったときは打った文字列が
          入力欄に残るので、そのまま直せる。
        */}
        <DraftField
          key={`${tokenKey}/name`}
          id={nameId}
          type="text"
          value={token.name}
          density={FieldDensities.Regular}
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
 * 呼び出し側が帯と本文それぞれの器に入れる。
 */
export const TokenEditor = {
  Title: TokenEditorTitle,
  Body: TokenEditorBody,
} as const;
