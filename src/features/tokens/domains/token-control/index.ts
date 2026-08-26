import type { DesignDocument } from "@/domains/dcmp/design-document";
import {
  type BoxShadowValue,
  ColorToken,
  Rgb,
  type ShadowField,
  ShadowFieldEdit,
  type ShadowNumberField,
  ShadowToken,
  type Token,
  type TokenKind,
  TokenSet,
  TokenValue,
  type TypographyField,
  TypographyFieldEdit,
  TypographyToken,
} from "@/domains/dcmp/token";
import { TokenSelection } from "@/domains/token-selection";
import { Px } from "@/domains/unit/px";
import { Option } from "@/utils/Option";

/*
 * トークン編集 UI はトークンの種別の走査だけで組み立てる（docs/06-ui.md
 * 「編集操作の一覧」の tokens 編集）。種別ごとの見せ方・入力欄の対応表をここに集め、
 * 一覧とエディタのコンポーネント側には種別で分岐するコードを書かない。
 *
 * この導出は `src/domains/` ではなくこの feature に置く。`valueText` や
 * `TokenPreview` の `widthPx` のように**綴りと見せ方そのもの**を持っているため
 * （`rules/architecture.md`「表示のための綴りをドメインへ持ち込まない」）。
 * Why not: 同じ形に見える `src/domains/prop-control` は昇格させてある。あちらが
 * 持つのは値の種別までで、綴りはパネル側にあるという違いによる。
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
 *
 * 色が `ColorToken` ではなく `Rgb` を持つのは、`input[type=color]` が6桁しか
 * 扱えないため。alpha は `alphaPercent` の欄が別に持つ。
 */
export type TokenControlInput =
  | Readonly<{ kind: "color"; value: Rgb }>
  | Readonly<{ kind: "alphaPercent"; value: number }>
  | Readonly<{ kind: "number"; value: number }>
  | Readonly<{ kind: "text"; value: string }>;

/**
 * その行が書き戻す先。書き換え前の値を持つのは、その行が値の一部だけを
 * 差し替えるため（色は RGB と不透明度、複合の種別はフィールド）。
 *
 * 種別で判別する直和にしているのは、「種別 + フィールド名」を並べて持つと
 * shadows のトークンに fontSize を指す組み合わせが型で作れてしまうため。
 * 不透明度を `part: "rgb" | "alpha"` として平らに足さないのも同じ理由で、
 * そちらは影の `x` の不透明度という組み合わせが作れてしまう。
 *
 * `kind` は `TokenKind` と1対1ではない。不透明度の行は色の一部を差し替える
 * だけなので、`colorsAlpha` が書き戻すのは `colors` の値になる。
 */
export type TokenFieldTarget =
  | Readonly<{ kind: "colors"; color: ColorToken }>
  | Readonly<{ kind: "colorsAlpha"; color: ColorToken }>
  | Readonly<{ kind: "spacing" }>
  | Readonly<{ kind: "radius" }>
  | Readonly<{ kind: "shadows"; shadow: ShadowToken; field: ShadowField }>
  | Readonly<{ kind: "shadowsAlpha"; shadow: ShadowToken }>
  | Readonly<{
      kind: "typography";
      typography: TypographyToken;
      field: TypographyField;
    }>;

/**
 * 編集欄の1行。色は2行（RGB と不透明度）、複合の種別はフィールドの数だけ並ぶ。
 *
 * `name` は行の識別子で、1つのトークンの中で一意（複合の種別はフィールド名）。
 * 見出しの文字列とは別に持つのは、表示の文言が偶然衝突しても行の同一性が
 * 壊れないようにするため。
 */
export type TokenControlField = Readonly<{
  name: string;
  label: string;
  input: TokenControlInput;
  target: TokenFieldTarget;
}>;

/**
 * 入力欄が決まる前の行。何の値を載せるかで入力欄が変わる色のために、
 * 綴りと書き戻し先だけを先に決めて渡す。
 */
type TokenControlRow = Omit<TokenControlField, "input">;

/** 1 つのトークンを編集する画面の中身。並べる欄は種別で決まる。 */
export type TokenControl = Readonly<{
  token: Token;
  fields: readonly TokenControlField[];
}>;

/**
 * 長さのプレビューの上限（px）。
 * これを超える長さも同じ幅で頭打ちにする（一覧の行の幅が値で伸び縮みしないため）。
 */
const PreviewMaxWidthPx = 20;

/** 値が1つの種別の行。何のフィールドかを言い分ける必要がない。 */
const ScalarFieldName = "value";
const ScalarLabel = "値";

/** 色に添える不透明度の行。見出しは既存の編集欄に合わせて日本語で書く。 */
const ColorsAlphaFieldName = "alpha";
const ShadowAlphaFieldName = "colorAlpha";
const AlphaLabel = "不透明度";

/** 影のフィールドの見出し。既存の編集欄に合わせて日本語で書く。 */
const ShadowLabels = {
  x: "横のずれ",
  y: "縦のずれ",
  blur: "ぼかし",
  spread: "広がり",
  color: "色",
} as const satisfies Readonly<Record<ShadowField, string>>;

/** 書体のフィールドの見出し。 */
const TypographyLabels = {
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
        widthPx: Math.min(token.value, PreviewMaxWidthPx),
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
  /**
   * トークン一覧に出すセクションの並び。
   * 種別は `TokenSet.kinds()` の順、種別内は TokenSet が持つ定義順を保つ。
   * トークンが1つも無い種別も見出しだけ出す（足す先が画面から消えないため）。
   *
   * @param document トークンの出どころ
   * @returns 種別ごとのセクションの並び。トークンが無い種別も 1 つ並ぶ
   */
  forDocument(document: DesignDocument): readonly TokenSection[] {
    const tokens = document.tokens;
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
 * 影の数値のフィールドを、対応する入力欄の形にする。
 * 色は入力欄が2つに分かれるので `colorFields` の担当。
 *
 * @param shadow 編集対象の影
 * @param field 入力欄にするフィールド
 * @returns そのフィールドの数値欄
 */
function shadowInput(
  shadow: ShadowToken,
  field: ShadowNumberField,
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
  }
}

/**
 * 1 つの色に並べる編集欄。
 *
 * hex として読めない値はピッカーにも不透明度の欄にも載せられないので、
 * 打ち直せるようにテキスト欄1本にする。ピッカーへ渡すとブラウザが黒へ落として
 * しまい、値が壊れていることが画面から分からなくなる。
 *
 * @param color 編集する色
 * @param rgbRow 色そのものの行の綴りと書き戻し先
 * @param alphaRow 不透明度の行の綴りと書き戻し先
 * @returns hex として読めれば色と不透明度の2行、読めなければテキスト欄1行
 */
function colorFields(
  color: ColorToken,
  rgbRow: TokenControlRow,
  alphaRow: TokenControlRow,
): readonly TokenControlField[] {
  const rgb = ColorToken.rgbOf(color);
  if (!rgb.some) {
    return [{ ...rgbRow, input: { kind: "text", value: color } }];
  }
  return [
    { ...rgbRow, input: { kind: "color", value: rgb.value } },
    {
      ...alphaRow,
      input: {
        kind: "alphaPercent",
        value: ColorToken.alphaPercentOf(color),
      },
    },
  ];
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
      return colorFields(
        token.value,
        {
          name: ScalarFieldName,
          label: ScalarLabel,
          target: { kind: "colors", color: token.value },
        },
        {
          name: ColorsAlphaFieldName,
          label: AlphaLabel,
          target: { kind: "colorsAlpha", color: token.value },
        },
      );
    case "spacing":
    case "radius":
      return [
        {
          name: ScalarFieldName,
          label: ScalarLabel,
          input: { kind: "number", value: token.value },
          target: { kind: token.kind },
        },
      ];
    /*
     * 色だけ行が2本になるので `flatMap` で広げる。不透明度の行を色の直後に
     * 置くのは、両方が同じ1つの色を差し替えるため（仕様のフィールド順は保つ）。
     */
    case "shadows":
      return ShadowToken.fields().flatMap((field) =>
        field === "color"
          ? colorFields(
              token.value.color,
              {
                name: field,
                label: ShadowLabels[field],
                target: { kind: "shadows", shadow: token.value, field },
              },
              {
                name: ShadowAlphaFieldName,
                label: AlphaLabel,
                target: { kind: "shadowsAlpha", shadow: token.value },
              },
            )
          : [
              {
                name: field,
                label: ShadowLabels[field],
                input: shadowInput(token.value, field),
                target: { kind: "shadows", shadow: token.value, field },
              },
            ],
      );
    case "typography":
      return TypographyToken.fields().map((field) => ({
        name: field,
        label: TypographyLabels[field],
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
     * ピッカーが返した6桁だけを差し替え、不透明度は不透明度の欄が持つ。
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
    Option.map(ShadowFieldEdit.createNumeric(field, value), (edit) => ({
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
     * ではなく入力欄を知っているここで解釈する（プロパティパネルの `valueFrom`
     * と同じ理由）。
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
    Option.map(TypographyFieldEdit.createNumeric(field, value), (edit) => ({
      kind: "typography",
      value: TypographyToken.withField(typography, edit),
    })),
  );
}

/** 選択中のトークンから編集欄を組み立て、打たれた値をトークンの値へ読み替える。 */
export const TokenControl = {
  /**
   * 選択中のトークンの編集欄（docs/06-ui.md「編集操作の一覧」の tokens 編集）。
   *
   * @param selection ドキュメントと、その中で選ばれているトークン
   * @returns 編集欄一式。トークンを選んでいなければ `none`
   */
  forSelection(selection: TokenSelection): Option<TokenControl> {
    return Option.map(TokenSelection.token(selection), (token) => ({
      token,
      fields: fieldsOf(token),
    }));
  },

  /**
   * 入力欄に入った文字列を、そのトークンの新しい値にする。
   *
   * 書き戻し先は行が持つ `target` から決める。入力欄の種類（色 / 数値）で決めると
   * 数値の欄が `spacing` と `radius` を区別できず、書き込み先を取り違えるため。
   *
   * @param target 書き戻し先の種別と、複合の種別ではどのフィールドか
   * @param raw 入力欄に入っている文字列
   * @returns 書き換え後のトークンの値。数値 / 6桁の色として読めないとき、および
   *   値域（docs/04-tokens.md「値の形式」・不透明度は 0–100）を外れるときは `none`
   */
  valueFrom(target: TokenFieldTarget, raw: string): Option<TokenValue> {
    switch (target.kind) {
      /*
       * ピッカーが返した6桁だけを差し替え、不透明度は残す。影の色と扱いが
       * 揃っているのは、どちらも同じ「生 hex」（docs/04-tokens.md「値の形式」）で、
       * 不透明度をそれぞれの欄が持つようになったため。
       */
      case "colors":
        return Option.map(Rgb.create(raw), (rgb) => ({
          kind: "colors",
          value: ColorToken.withRgb(target.color, rgb),
        }));
      case "colorsAlpha":
        return Option.flatMap(numberFromRaw(raw), (percent) =>
          Option.map(
            ColorToken.withAlphaPercent(target.color, percent),
            (value) => ({ kind: "colors", value }),
          ),
        );
      case "shadowsAlpha":
        return Option.flatMap(numberFromRaw(raw), (percent) =>
          Option.map(
            ColorToken.withAlphaPercent(target.shadow.color, percent),
            (color) => ({
              kind: "shadows",
              value: ShadowToken.withField(target.shadow, {
                field: "color",
                value: color,
              }),
            }),
          ),
        );
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
