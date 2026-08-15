import { Px } from "@/domains/px";
import {
  type BoxShadowValue,
  ColorToken,
  Rgb,
  type ShadowField,
  ShadowFieldEdit,
  ShadowToken,
  type Token,
  type TokenKind,
  TokenSet,
  TokenValue,
  type TypographyField,
  TypographyFieldEdit,
  TypographyToken,
} from "@/domains/token";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { TokenTemplate } from "@/features/editor/domains/token-template";
import { Option } from "@/utils/Option";

/*
 * トークン編集 UI はトークンの種別の走査だけで組み立てる（docs/06-ui.md
 * 「編集操作の一覧」の tokens 編集）。種別ごとの見せ方・入力欄の対応表をここに集め、
 * 一覧とエディタのコンポーネント側には種別で分岐するコードを書かない。
 *
 * 「入力欄」「行」「プレビュー」はエディタ画面の語彙なので、この導出は
 * `src/domains/` ではなく feature 側に置く（`prop-control` と同じ理由。
 * `Token` に `controlInput()` を生やすと core が UI の表現を知ることになる）。
 */

/** 一覧の行に出す値の見せ方。種別ごとに何を見せられるかが違う。 */
export type TokenPreview =
  | Readonly<{ kind: "swatch"; color: ColorToken }>
  | Readonly<{ kind: "bar"; widthPx: number }>
  | Readonly<{ kind: "shadow"; value: BoxShadowValue }>
  | Readonly<{ kind: "letters"; fontWeight: number; fontFamily: string }>;

/** 一覧の1行。 */
export type TokenRow = Readonly<{
  token: Token;
  preview: TokenPreview;
  valueText: string;
}>;

/** 一覧の1セクション（種別ごとのまとまり / UI 案 docs/Design Composer.html）。 */
export type TokenSection = Readonly<{
  kind: TokenKind;
  rows: readonly TokenRow[];
}>;

/**
 * 1行分の入力欄。値の形式（docs/04-tokens.md「値の形式」）から
 * 入力欄の種類が決まる。語彙は `PropControlInput` に揃える。
 */
export type TokenControlInput =
  | Readonly<{ kind: "color"; value: ColorToken }>
  | Readonly<{ kind: "number"; value: number }>
  | Readonly<{ kind: "text"; value: string }>;

/**
 * その行が書き戻す先。値が1つの種別は種別だけ、複合オブジェクトの種別は
 * 書き換え前の値とフィールドを対で持つ。
 *
 * 種別で判別する直和にしているのは、「種別 + フィールド名」を並べて持つと
 * shadows のトークンに fontSize を指す組み合わせが型で作れてしまうため。
 */
export type TokenFieldTarget =
  | Readonly<{ kind: "colors" }>
  | Readonly<{ kind: "spacing" }>
  | Readonly<{ kind: "radius" }>
  | Readonly<{ kind: "shadows"; shadow: ShadowToken; field: ShadowField }>
  | Readonly<{
      kind: "typography";
      typography: TypographyToken;
      field: TypographyField;
    }>;

/**
 * 編集欄の1行。値が1つの種別は1行、複合の種別はフィールドの数だけ並ぶ。
 *
 * `name` は行の識別子で、1つのトークンの中で一意（複合の種別はフィールド名、
 * 値が1つの種別は行が1本しかない）。見出しの文字列とは別に持つのは、
 * 表示の文言が偶然衝突しても行の同一性が壊れないようにするため。
 */
export type TokenControlField = Readonly<{
  name: string;
  label: string;
  input: TokenControlInput;
  target: TokenFieldTarget;
}>;

/** 1 つのトークンを編集する画面の中身。並べる欄は種別で決まる。 */
export type TokenControl = Readonly<{
  token: Token;
  fields: readonly TokenControlField[];
}>;

/**
 * 長さのプレビューの上限（px）。
 * これを超える長さも同じ幅で頭打ちにする（一覧の行の幅が値で伸び縮みしないため）。
 */
const PREVIEW_MAX_WIDTH_PX = 20;

/** 値が1つの種別の行。1本しかないので、何のフィールドかを言い分ける必要がない。 */
const SCALAR_FIELD_NAME = "value";
const SCALAR_LABEL = "値";

/** 影のフィールドの見出し。既存の編集欄に合わせて日本語で書く。 */
const SHADOW_LABELS = {
  x: "横のずれ",
  y: "縦のずれ",
  blur: "ぼかし",
  spread: "広がり",
  color: "色",
} as const satisfies Readonly<Record<ShadowField, string>>;

/** 書体のフィールドの見出し。 */
const TYPOGRAPHY_LABELS = {
  fontSize: "サイズ",
  lineHeight: "行間",
  fontWeight: "太さ",
  fontFamily: "フォント",
} as const satisfies Readonly<Record<TypographyField, string>>;

/**
 * 一覧の行に出す見本。種別によって色見本・大きさ・書体と形が変わる。
 *
 * @param token 見本を出したいトークン
 * @returns 種別に応じた見本（色見本 / 長さの帯 / 影 / 書体の見本）
 */
function previewOf(token: Token): TokenPreview {
  switch (token.kind) {
    case "colors":
      return { kind: "swatch", color: token.value };
    case "spacing":
    case "radius":
      return {
        kind: "bar",
        widthPx: Math.min(token.value, PREVIEW_MAX_WIDTH_PX),
      };
    case "shadows":
      return { kind: "shadow", value: ShadowToken.cssValue(token.value) };
    /*
     * 書体の見本は太さと書体だけを見せる。fontSize / lineHeight を効かせると
     * 行の高さが値で伸び縮みするため（長さの見本を頭打ちにしているのと同じ理由）。
     * 既定値の解決はここで済ませ、表示側へは解決済みの値だけを渡す。
     */
    case "typography":
      return {
        kind: "letters",
        fontWeight: token.value.fontWeight,
        fontFamily: TypographyToken.fontFamilyOf(token.value),
      };
  }
}

/**
 * 行の右端に出す値。種別ごとに、その値を1行で読める形にする。
 *
 * @param token 値を読みたいトークン
 * @returns 1行で読める値の文字列
 */
function valueTextOf(token: Token): string {
  switch (token.kind) {
    case "colors":
      return token.value;
    case "spacing":
    case "radius":
      return Px.create(token.value);
    case "shadows":
      return ShadowToken.cssValue(token.value);
    case "typography":
      return `${Px.create(token.value.fontSize)} / ${token.value.lineHeight} / ${token.value.fontWeight}`;
  }
}

export const TokenSection = {
  /** そのセクションへ足すときの指定。 */
  addTemplate(section: TokenSection): TokenTemplate {
    return { kind: section.kind };
  },

  /**
   * トークン一覧に出すセクションの並び。
   * 種別は `TokenSet.kinds()` の順、種別内は TokenSet が持つ定義順を保つ。
   * トークンが1つも無い種別も見出しだけ出す（足す先が画面から消えないため）。
   */
  forDocument(state: EditorState): readonly TokenSection[] {
    const tokens = EditorState.document(state).tokens;
    return TokenSet.kinds().map((kind) => ({
      kind,
      rows: TokenSet.tokensOf(tokens, kind).map((token) => ({
        token,
        preview: previewOf(token),
        valueText: valueTextOf(token),
      })),
    }));
  },
} as const;

/**
 * 影の 1 フィールドを、対応する入力欄の形にする。
 *
 * @param shadow 編集対象の影
 * @param field 入力欄にするフィールド
 * @returns 色は色欄、それ以外は数値欄
 */
function shadowInput(
  shadow: ShadowToken,
  field: ShadowField,
): TokenControlInput {
  switch (field) {
    case "x":
      return { kind: "number", value: shadow.x };
    case "y":
      return { kind: "number", value: shadow.y };
    case "blur":
      return { kind: "number", value: shadow.blur };
    case "spread":
      return { kind: "number", value: ShadowToken.spreadOf(shadow) };
    case "color":
      return { kind: "color", value: shadow.color };
  }
}

/**
 * 書体の 1 フィールドを、対応する入力欄の形にする。
 *
 * @param token 編集対象の書体トークン
 * @param field 入力欄にするフィールド
 * @returns fontFamily はテキスト欄、それ以外は数値欄
 */
function typographyInput(
  token: TypographyToken,
  field: TypographyField,
): TokenControlInput {
  switch (field) {
    case "fontSize":
      return { kind: "number", value: token.fontSize };
    case "lineHeight":
      return { kind: "number", value: token.lineHeight };
    case "fontWeight":
      return { kind: "number", value: token.fontWeight };
    /*
     * 省略されている fontFamily は空欄で出す。既定のシステムフォントスタックを
     * 入れると、触っていない値が確定でファイルへ書き込まれる。
     */
    case "fontFamily":
      return { kind: "text", value: token.fontFamily ?? "" };
  }
}

/**
 * その種別の編集欄の並び。複合の種別はフィールドの定義順を保つ。
 *
 * @param token 編集したいトークン
 * @returns 上から並べる編集欄。単一値の種別は 1 件
 */
function fieldsOf(token: Token): readonly TokenControlField[] {
  switch (token.kind) {
    case "colors":
      return [
        {
          name: SCALAR_FIELD_NAME,
          label: SCALAR_LABEL,
          input: { kind: "color", value: token.value },
          target: { kind: "colors" },
        },
      ];
    case "spacing":
    case "radius":
      return [
        {
          name: SCALAR_FIELD_NAME,
          label: SCALAR_LABEL,
          input: { kind: "number", value: token.value },
          target: { kind: token.kind },
        },
      ];
    case "shadows":
      return ShadowToken.fields().map((field) => ({
        name: field,
        label: SHADOW_LABELS[field],
        input: shadowInput(token.value, field),
        target: { kind: "shadows", shadow: token.value, field },
      }));
    case "typography":
      return TypographyToken.fields().map((field) => ({
        name: field,
        label: TYPOGRAPHY_LABELS[field],
        input: typographyInput(token.value, field),
        target: { kind: "typography", typography: token.value, field },
      }));
  }
}

/**
 * 数値の入力欄に入った文字列を数値として読む。
 * 数値として読めない入力（空欄・途中まで打った符号）では値を変えない。
 * 読めない値を書き込むとその種別の値の形式が壊れるため（docs/04-tokens.md）。
 *
 * @param raw 入力欄に入っている文字列
 * @returns 有限の数値として読めた場合のみ `some`
 */
function numberFromRaw(raw: string): Option<number> {
  const value = Number(raw);
  return raw !== "" && Number.isFinite(value)
    ? Option.some(value)
    : Option.none;
}

/**
 * 影の入力欄へ打たれた文字列を、書き換え後のトークンの値にする。
 *
 * @param target 書き換える影と、そのどのフィールドか
 * @param raw 入力欄に入っている文字列
 * @returns 書き換え後のトークンの値。数値 / 6桁の色として読めないとき、
 *   および値域（ぼかしは 0 以上）を外れるときは `none`
 */
function shadowValueFrom(
  target: Extract<TokenFieldTarget, { kind: "shadows" }>,
  raw: string,
): Option<TokenValue> {
  const { shadow, field } = target;
  if (field === "color") {
    /*
     * 影の色だけは、ピッカーが返した6桁に元の alpha を戻す。影の色は半透明が
     * 常用される（docs/04-tokens.md「影の色は実務上ほぼ半透明の黒」）ので、
     * 引き継がないと色を選び直すだけで影が不透明になる。
     *
     * 6桁として読めない入力で値を変えないのは数値の欄と同じ扱い（`Rgb.create`
     * の `none`）。ピッカーは常に6桁を返すので、通常の操作では通らない枝。
     */
    return Option.map(Rgb.create(raw), (rgb) => ({
      kind: "shadows",
      value: ShadowToken.withField(shadow, {
        field,
        value: ColorToken.withRgb(shadow.color, rgb),
      }),
    }));
  }
  return Option.flatMap(numberFromRaw(raw), (value) =>
    Option.map(ShadowFieldEdit.create(field, value), (edit) => ({
      kind: "shadows",
      value: ShadowToken.withField(shadow, edit),
    })),
  );
}

/**
 * 書体の入力欄へ打たれた文字列を、書き換え後のトークンの値にする。
 *
 * @param target 書き換える書体トークンと、そのどのフィールドか
 * @param raw 入力欄に入っている文字列
 * @returns 書き換え後のトークンの値。数値として読めないとき、および値域
 *   （太さ 100–900・サイズと行間は正の数）を外れるときは `none`
 */
function typographyValueFrom(
  target: Extract<TokenFieldTarget, { kind: "typography" }>,
  raw: string,
): Option<TokenValue> {
  const { typography, field } = target;
  if (field === "fontFamily") {
    /*
     * 空欄を「指定しない」と読むのは入力欄の約束事なので、`TypographyFieldEdit`
     * ではなく入力欄を知っているここで解釈する（`PropControl.editFrom` と同じ理由）。
     */
    return Option.some({
      kind: "typography",
      value: TypographyToken.withField(typography, {
        field,
        value: raw === "" ? Option.none : Option.some(raw),
      }),
    });
  }
  return Option.flatMap(numberFromRaw(raw), (value) =>
    Option.map(TypographyFieldEdit.create(field, value), (edit) => ({
      kind: "typography",
      value: TypographyToken.withField(typography, edit),
    })),
  );
}

/** 選択中のトークンから編集欄を組み立て、打たれた値をトークンの値へ読み替える。 */
export const TokenControl = {
  /**
   * 選択中のトークンの編集欄（docs/06-ui.md「編集操作の一覧」の tokens 編集）。
   * 選択が無いときは空になる。
   */
  forSelection(state: EditorState): Option<TokenControl> {
    return Option.map(EditorState.selectedToken(state), (token) => ({
      token,
      fields: fieldsOf(token),
    }));
  },

  /**
   * 入力欄に入った文字列を、そのトークンの新しい値にする。
   *
   * 書き戻し先は行が持つ `target` から決める。入力欄の種類（色 / 数値）で決めると
   * 数値の欄が `spacing` と `radius` を区別できず、書き込み先を取り違えるため。
   */
  valueFrom(target: TokenFieldTarget, raw: string): Option<TokenValue> {
    switch (target.kind) {
      /*
       * 色の種別ではピッカーが返した hex をそのまま値にする。影の色（下記）と
       * 違って alpha を引き継がないのは、パレットの色は不透明が既定で、
       * 引き継ぐと alpha 付きの色を不透明へ戻す手段が画面から無くなるため。
       * どちらの種別も alpha を直接編集する欄は UI 案に無い（#142）。
       */
      case "colors":
        return Option.map(Rgb.create(raw), (rgb) => ({
          kind: "colors",
          value: rgb,
        }));
      /*
       * 長さの 2 種別は値域も書き戻し方も同じなので枝を分けない。分けると、
       * 一方だけ検証を通し忘れても型もテストも通ってしまう。
       */
      case "spacing":
      case "radius":
        return Option.flatMap(numberFromRaw(raw), (value) =>
          TokenValue.createNumeric(target.kind, value),
        );
      case "shadows":
        return shadowValueFrom(target, raw);
      case "typography":
        return typographyValueFrom(target, raw);
    }
  },
} as const;
