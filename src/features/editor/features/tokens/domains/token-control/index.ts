import type { DesignDocument } from "@/domains/dcmp/design-document";
import {
  type BoxShadowValue,
  ColorToken,
  GradientStop,
  GradientToken,
  type LinearGradientValue,
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
import { TokenSelection } from "@/domains/session/token-selection";
import { Px } from "@/domains/unit/px";
import { Option } from "@/utils/Option";

/*
 * 一覧とエディタの欄は種別の走査だけで組み立て、コンポーネント側では種別で分岐しない（docs/06-ui.md
 * 「編集操作の一覧」の tokens 編集）。`src/domains/` に置かないのは、綴りと見せ方そのもの（`valueText`・
 * `TokenPreview`）を持つため（`rules/architecture.md`「表示のための綴りをドメインへ持ち込まない」）。
 */

/** 一覧の行に出す値の見せ方。種別ごとに何を見せられるかが違う。 */
export type TokenPreview =
  | Readonly<{ kind: "swatch"; color: ColorToken }>
  | Readonly<{ kind: "bar"; widthPx: number }>
  | Readonly<{ kind: "shadow"; value: BoxShadowValue }>
  | Readonly<{ kind: "letters"; fontWeight: number; fontFamily: string }>
  | Readonly<{ kind: "gradient"; value: LinearGradientValue }>;

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
 * 1行分の入力欄。値の形式（docs/04-tokens.md「値の形式」）から入力欄の種類が決まる。
 * `number` / `text` は `PropControlInput` と同じ語。`percent` / `degree` は単位を持つ
 * トークン固有の語。
 *
 * stop の比率は `percent`、角度は `degree` の欄が持つ。
 */
export type TokenControlInput =
  | Readonly<{ kind: "percent"; value: number }>
  | Readonly<{ kind: "degree"; value: number }>
  | Readonly<{ kind: "number"; value: number }>
  | Readonly<{ kind: "text"; value: string }>;

/**
 * その行が書き戻す先。
 *
 * `kind` は `TokenKind` と1対1ではない。`gradientsAngle` / `gradientsStopRatio` /
 * `gradientsStopColor` の 3 つは、1 つのグラデーションの角度・stop の比率・色を差し替えるだけ
 * なので、書き戻すのは `gradients` の値になる。不透明度は書き戻し先を持たず、箱の `target` から
 * `valueFromAlpha` で引く。
 */
export type TokenFieldTarget =
  | Readonly<{ kind: "colors"; color: ColorToken }>
  | Readonly<{ kind: "spacing" }>
  | Readonly<{ kind: "radius" }>
  | Readonly<{ kind: "shadows"; shadow: ShadowToken; field: ShadowField }>
  | Readonly<{
      kind: "typography";
      typography: TypographyToken;
      field: TypographyField;
    }>
  | Readonly<{ kind: "gradientsAngle"; gradient: GradientToken }>
  | Readonly<{
      kind: "gradientsStopRatio";
      gradient: GradientToken;
      stopIndex: number;
    }>
  | Readonly<{
      kind: "gradientsStopColor";
      gradient: GradientToken;
      stopIndex: number;
    }>;

/** 欄の識別子（1 つのトークンの中で一意。複合の種別はフィールド名）と見出し。 */
type TokenControlCaption = Readonly<{ name: string; label: string }>;

/** 入力欄の種類を `K` に絞った編集欄の1つ。 */
export type TokenControlFieldOf<K extends TokenControlInput["kind"]> =
  TokenControlCaption &
    Readonly<{
      input: Extract<TokenControlInput, { kind: K }>;
      target: TokenFieldTarget;
    }>;

/** 編集欄の1つ。入力欄の種類を絞らない。 */
export type TokenControlField = TokenControlFieldOf<TokenControlInput["kind"]>;

/** 見本・hex・不透明度の箱が書き戻す色 1 つ。影は色のフィールドだけを指す。 */
export type HexColorTarget =
  | Extract<TokenFieldTarget, { kind: "colors" }>
  | (Extract<TokenFieldTarget, { kind: "shadows" }> &
      Readonly<{ field: "color" }>)
  | Extract<TokenFieldTarget, { kind: "gradientsStopColor" }>;

/**
 * hex として読める色を、見本・`#`・6 桁・不透明度の 1 つの箱で打つ欄。
 *
 * Color のエディタと stop の色が持つのは docs/06-ui.md「`Tokens` の `gradients`」の「hex の欄は
 * Color のエディタと同じ」による。影の色は、UI 案に影のエディタが無く colors と同じ
 * `colorControlOf` で組み立てるので同じ箱にする（#1041）。
 */
export type HexColorControl = Readonly<{
  kind: "hex";
  target: HexColorTarget;
  /** 6 桁の欄 */
  caption: TokenControlCaption;
  rgb: Rgb;
  alphaPercent: number;
  /** 箱の左端の見本（ピッカー） */
  picker: TokenControlCaption;
  /** 箱の右端の不透明度の欄 */
  alpha: TokenControlCaption;
}>;

/** 色の位置に入る欄。hex として読めなければ、元の綴りを打ち直すテキスト欄。 */
export type TokenColorControl =
  | HexColorControl
  | Readonly<{
      kind: "text";
      target: HexColorTarget;
      caption: TokenControlCaption;
      value: ColorToken;
    }>;

/** 値の欄に上から並ぶ 1 行（`PropControlRow` と同じ形）。 */
export type TokenControlRow =
  | Readonly<{ kind: "field"; field: TokenControlFieldOf<"number" | "text"> }>
  | Readonly<{ kind: "color"; color: TokenColorControl }>;

/** 1 つの色の箱に付ける識別子と見出し。 */
type ColorCaptions = Readonly<{
  picker: TokenControlCaption;
  hex: TokenControlCaption;
  alpha: TokenControlCaption;
}>;

/** 見出しの先頭に出す見本の塗り。単色か階調か。 */
export type TokenPaint =
  | Readonly<{ kind: "color"; color: ColorToken }>
  | Readonly<{ kind: "gradient"; value: LinearGradientValue }>;

/** 階調のバーに並べる、stop 1 件ぶんのつまみ。 */
export type GradientKnob = Readonly<{
  /** つまみの識別子。同じ stop の行（`GradientStopRow.name`）と同じ綴り */
  name: string;
  color: ColorToken;
  /** バーの左端からの位置（%）。0〜100 の外の比率はバーの端へ寄せてある */
  percent: number;
}>;

/** stop 1 件ぶんの行（docs/06-ui.md「`Tokens` の `gradients`」）。 */
export type GradientStopRow = Readonly<{
  /** 行の識別子。1 つのトークンの中で一意 */
  name: string;
  /** 比率の欄 */
  ratio: TokenControlFieldOf<"percent">;
  /** 見本・hex・不透明度の箱。色が hex として読めなければ色のテキスト欄 */
  color: TokenColorControl;
  /** − を押した後の値。除くと 2 件を下回るなら `none`（押せない状態で並べる） */
  afterRemove: Option<TokenValue>;
  /** − のボタンの読み上げ名 */
  removeButtonLabel: string;
}>;

/** グラデーションのエディタの値の欄（docs/06-ui.md「`Tokens` の `gradients`」）。 */
export type GradientControl = Readonly<{
  /** 96px のプレビューを塗る階調 */
  previewImage: LinearGradientValue;
  /** つまみを並べるバーを塗る階調。角度に依らず左から右へ */
  barImage: LinearGradientValue;
  knobs: readonly GradientKnob[];
  angle: TokenControlFieldOf<"degree">;
  stops: readonly GradientStopRow[];
  /** stop の + を押した後の値 */
  afterAdd: TokenValue;
}>;

/** 値の欄（docs/06-ui.md「値の欄」）の形。グラデーションだけが stop の行と +・− を持つ。 */
export type TokenValueFields =
  | Readonly<{ kind: "rows"; rows: readonly TokenControlRow[] }>
  | Readonly<{ kind: "gradient"; gradient: GradientControl }>;

/** 1 つのトークンを編集する画面の中身。並べる欄は種別で決まる。 */
export type TokenControl = Readonly<{
  token: Token;
  /** 見出しの先頭の見本。色と階調だけが持つ */
  titlePaint: Option<TokenPaint>;
  valueFields: TokenValueFields;
}>;

/**
 * 長さのプレビューの上限（px）。
 * これを超える長さも同じ幅で頭打ちにする（一覧の行の幅が値で伸び縮みしないため）。
 */
const PreviewMaxWidthPx = 20;

/** 値が1つの種別の行。何のフィールドかを言い分ける必要がない。 */
const ScalarFieldName = "value";
const ScalarLabel = "値";

/** 色の箱の不透明度の欄。見出しは既存の編集欄に合わせて日本語で書く。 */
const ColorsAlphaFieldName = "alpha";
const ShadowAlphaFieldName = "colorAlpha";
const AlphaLabel = "不透明度";

/**
 * 色の箱の hex の欄。見出しは UI 案の Color のエディタ（`hex`）と、stop の行の見出し
 * （`stop n の hex`）に合わせる。打てる綴りは `#` の有無を問わない 6 桁と 3 桁（`valueFromHex`）。
 *
 * 影の箱も `hex` にするのは、`色` にするとピッカーの読み上げ名 `色` と重なるため。
 */
const ColorsHexFieldName = "hex";
const ShadowHexFieldName = "colorHex";
const HexLabel = "hex";

/** 影のフィールドの見出し。既存の編集欄に合わせて日本語で書く。 */
const ShadowLabels = {
  x: "横のずれ",
  y: "縦のずれ",
  blur: "ぼかし",
  spread: "広がり",
  color: "色",
} as const satisfies Readonly<Record<ShadowField, string>>;

/** 角度の行の識別子と見出し。 */
const AngleFieldName = "angle";
const AngleLabel = "角度";

/** 書体のフィールドの見出し。 */
const TypographyLabels = {
  fontSize: "サイズ",
  lineHeight: "行間",
  fontWeight: "太さ",
  fontFamily: "フォント",
} as const satisfies Readonly<Record<TypographyField, string>>;

/**
 * 一覧の行に出す見本。種別によって色見本・大きさ・書体・階調と形が変わる。
 *
 * @param token 見本を出したいトークン
 * @returns 種別に応じた見本（色見本 / 長さの帯 / 影 / 書体の見本 / 階調）
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
    case "gradients":
      return { kind: "gradient", value: GradientToken.cssValue(token.value) };
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
    /* CSS の綴りは一覧の幅に収まらない（docs/06-ui.md「`Tokens` の `gradients`」） */
    case "gradients":
      return `${token.value.angle}° · ${token.value.stops.length} stops`;
  }
}

export const TokenSection = {
  /**
   * トークン一覧に出すセクションの並び。種別は `TokenSet.kinds` の順、種別内は TokenSet が持
   * つ定義順を保つ。
   *
   * トークンが1つも無い種別も見出しだけ出す（足す先が画面から消えないため）。
   *
   * @param document トークンの出どころ
   * @returns 全種別のセクションの並び。トークンが無い種別も 1 つ並ぶ
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
 * 色は `colorControlOf` の担当。
 *
 * @param shadow 編集対象の影
 * @param field 入力欄にするフィールド
 * @returns そのフィールドの数値欄
 */
function shadowInput(
  shadow: ShadowToken,
  field: ShadowNumberField,
): Extract<TokenControlInput, { kind: "number" }> {
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
 * 1 つの色の欄。
 *
 * hex として読めない値はピッカーにも hex・不透明度の欄にも載せられないので、
 * 打ち直せるようにテキスト欄1本にする。ピッカーへ渡すとブラウザが黒へ落として
 * しまい、値が壊れていることが画面から分からなくなる。
 *
 * @param color 編集する色
 * @param target 箱が書き戻す色
 * @param captions 見本（読めない色ではテキスト欄）・hex・不透明度の識別子と見出し
 * @returns hex として読めれば見本・hex・不透明度の 1 つの箱、読めなければ見本の見出しで
 *   元の綴りを出すテキスト欄 1 本
 */
function colorControlOf(
  color: ColorToken,
  target: HexColorTarget,
  captions: ColorCaptions,
): TokenColorControl {
  const rgb = ColorToken.rgbOf(color);
  if (!Option.isSome(rgb)) {
    return { kind: "text", target, caption: captions.picker, value: color };
  }
  return {
    kind: "hex",
    target,
    caption: captions.hex,
    rgb: rgb.value,
    alphaPercent: ColorToken.alphaPercentOf(color),
    picker: captions.picker,
    alpha: captions.alpha,
  };
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
): Extract<TokenControlInput, { kind: "number" | "text" }> {
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
 * その種別の値の欄に並べる行。複合の種別はフィールドの定義順を保つ。
 *
 * @param token 編集したいトークン
 * @returns 上から並べる行。単一値の種別は 1 件
 */
function rowsOf(
  token: Exclude<Token, { kind: "gradients" }>,
): readonly TokenControlRow[] {
  switch (token.kind) {
    case "colors":
      return [
        {
          kind: "color",
          color: colorControlOf(
            token.value,
            { kind: "colors", color: token.value },
            {
              picker: { name: ScalarFieldName, label: ScalarLabel },
              hex: { name: ColorsHexFieldName, label: HexLabel },
              alpha: { name: ColorsAlphaFieldName, label: AlphaLabel },
            },
          ),
        },
      ];
    case "spacing":
    case "radius":
      return [
        {
          kind: "field",
          field: {
            name: ScalarFieldName,
            label: ScalarLabel,
            input: { kind: "number", value: token.value },
            target: { kind: token.kind },
          },
        },
      ];
    /* 色の箱を色のフィールドの位置に置くのは、仕様のフィールド順を保つため */
    case "shadows":
      return ShadowToken.fields().map(
        (field): TokenControlRow =>
          field === "color"
            ? {
                kind: "color",
                color: colorControlOf(
                  token.value.color,
                  { kind: "shadows", shadow: token.value, field },
                  {
                    picker: { name: field, label: ShadowLabels[field] },
                    hex: { name: ShadowHexFieldName, label: HexLabel },
                    alpha: { name: ShadowAlphaFieldName, label: AlphaLabel },
                  },
                ),
              }
            : {
                kind: "field",
                field: {
                  name: field,
                  label: ShadowLabels[field],
                  input: shadowInput(token.value, field),
                  target: { kind: "shadows", shadow: token.value, field },
                },
              },
      );
    case "typography":
      return TypographyToken.fields().map((field) => ({
        kind: "field",
        field: {
          name: field,
          label: TypographyLabels[field],
          input: typographyInput(token.value, field),
          target: { kind: "typography", typography: token.value, field },
        },
      }));
  }
}

/**
 * stop の行とつまみの識別子。
 *
 * @param stopIndex stop の位置（0 始まり）
 * @returns 1 始まりの配列順を添えた綴り（`stop-1` など）
 */
function stopRowNameOf(stopIndex: number): string {
  return `stop-${stopIndex + 1}`;
}

/**
 * stop 1 件ぶんの行。比率の欄を先頭に置き、見本・hex・不透明度の箱を続ける（docs/06-ui.md「`Tokens`
 * の `gradients`」の「stop の行は `ratio`・色の欄・`−` の順」）。
 *
 * @param gradient stop を持つグラデーション
 * @param stop 行にする stop
 * @param stopIndex その stop の位置（0 始まり）
 * @returns 比率の欄・色の欄と −。欄の見出しと行の名前は 1 始まりの配列順で数える
 */
function gradientStopRowOf(
  gradient: GradientToken,
  stop: GradientStop,
  stopIndex: number,
): GradientStopRow {
  const n = stopIndex + 1;
  const name = stopRowNameOf(stopIndex);
  return {
    name,
    ratio: {
      name: `${name}-ratio`,
      label: `stop ${n} の比率`,
      input: { kind: "percent", value: GradientStop.ratioPercentOf(stop) },
      target: { kind: "gradientsStopRatio", gradient, stopIndex },
    },
    color: colorControlOf(
      stop.color,
      { kind: "gradientsStopColor", gradient, stopIndex },
      {
        picker: { name: `${name}-color`, label: `stop ${n} の色` },
        hex: { name: `${name}-hex`, label: `stop ${n} の hex` },
        alpha: { name: `${name}-alpha`, label: `stop ${n} の不透明度` },
      },
    ),
    afterRemove: Option.map(
      GradientToken.removeStop(gradient, stopIndex),
      (value) => ({ kind: "gradients", value }),
    ),
    removeButtonLabel: `stop ${n} を削除`,
  };
}

/**
 * グラデーションのエディタの値の欄。
 *
 * @param gradient 編集するグラデーション
 * @param previewImage 96px のプレビューを塗る階調（見出しの見本と同じ値）
 * @returns プレビュー・バーとつまみ・角度の欄・stop の行・+ を押した後の値
 */
function gradientControlOf(
  gradient: GradientToken,
  previewImage: LinearGradientValue,
): GradientControl {
  return {
    previewImage,
    // バーは stop の並びを左から右へ見せるものなので、角度に依らず 90°（左から右）で塗る
    barImage: GradientToken.cssValue({ ...gradient, angle: 90 }),
    knobs: gradient.stops.map((stop, stopIndex) => ({
      name: stopRowNameOf(stopIndex),
      color: stop.color,
      percent: GradientStop.clampedRatioPercentOf(stop),
    })),
    angle: {
      name: AngleFieldName,
      label: AngleLabel,
      input: { kind: "degree", value: gradient.angle },
      target: { kind: "gradientsAngle", gradient },
    },
    stops: gradient.stops.map((stop, stopIndex) =>
      gradientStopRowOf(gradient, stop, stopIndex),
    ),
    afterAdd: { kind: "gradients", value: GradientToken.addStop(gradient) },
  };
}

/**
 * 選んだトークンの編集画面の中身。
 *
 * グラデーションは見出しの見本とプレビューが同じ階調なので、綴りを 1 回だけ作って両方へ渡す。
 *
 * @param token 編集したいトークン
 * @returns 見出しの見本と値の欄。グラデーションなら stop の行を持つ欄、それ以外は上から並べる
 *   行で、見本は色だけが持つ
 */
function tokenControlOf(token: Token): TokenControl {
  if (token.kind === "gradients") {
    const image = GradientToken.cssValue(token.value);
    return {
      token,
      titlePaint: Option.some({ kind: "gradient", value: image }),
      valueFields: {
        kind: "gradient",
        gradient: gradientControlOf(token.value, image),
      },
    };
  }
  return {
    token,
    titlePaint:
      token.kind === "colors"
        ? Option.some({ kind: "color", color: token.value })
        : Option.none,
    valueFields: { kind: "rows", rows: rowsOf(token) },
  };
}

/**
 * 色の入力欄（ピッカー・hex）へ打たれた文字列で、色の 6 桁を差し替える。
 *
 * 差し替えるのは 6 桁だけで、不透明度は残す。不透明度はそれぞれの不透明度の欄が持つ
 * （colors・影の色・stop の色はどれも同じ「生 hex」。docs/04-tokens.md「値の形式」）。
 *
 * @param color 差し替える前の色
 * @param raw 入力欄に入っている文字列
 * @returns 6 桁を差し替えた色。`#` 付きの 6 桁か 3 桁として読めなければ `none`
 */
function colorWithRgbFrom(color: ColorToken, raw: string): Option<ColorToken> {
  return Option.map(Rgb.create(raw), (rgb) => ColorToken.withRgb(color, rgb));
}

/**
 * 不透明度の入力欄へ打たれた文字列で、色の不透明度を差し替える。
 *
 * @param color 差し替える前の色
 * @param raw 入力欄に入っている文字列（%）
 * @returns 不透明度を差し替えた色。数値として読めないとき、0–100 の外のときは `none`
 */
function colorWithAlphaFrom(
  color: ColorToken,
  raw: string,
): Option<ColorToken> {
  return Option.flatMap(numberFromRaw(raw), (percent) =>
    ColorToken.withAlphaPercent(color, percent),
  );
}

/**
 * グラデーションの角度・stop の比率の入力欄へ打たれた文字列を、書き換え後のグラデーションにする。
 * stop の色は `hexColorValueFrom` の担当。
 *
 * @param target 書き換えるグラデーションと、角度か、どの stop の比率か
 * @param raw 入力欄に入っている文字列
 * @returns 書き換え後のグラデーション。数値として読めないとき、比率が 0–100 の外のとき
 *   （`GradientToken` の `none`）は `none`
 */
function gradientFrom(
  target: Extract<
    TokenFieldTarget,
    { kind: "gradientsAngle" | "gradientsStopRatio" }
  >,
  raw: string,
): Option<GradientToken> {
  switch (target.kind) {
    case "gradientsAngle":
      return Option.flatMap(numberFromRaw(raw), (angle) =>
        GradientToken.withAngle(target.gradient, angle),
      );
    case "gradientsStopRatio":
      return Option.flatMap(numberFromRaw(raw), (percent) =>
        GradientToken.withStopRatioPercent(target.gradient, {
          stopIndex: target.stopIndex,
          percent,
        }),
      );
  }
}

/**
 * 箱が指す色 1 つを差し替えて、書き換え後のトークンの値にする。
 *
 * @param target 差し替える色（色トークン・影の色・stop の色）
 * @param nextColorOf 差し替える前の色から、差し替えた後の色を作る
 * @returns 書き換え後のトークンの値。`nextColorOf` が `none` を返したら `none`
 */
function hexColorValueFrom(
  target: HexColorTarget,
  nextColorOf: (color: ColorToken) => Option<ColorToken>,
): Option<TokenValue> {
  switch (target.kind) {
    case "colors":
      return Option.map(nextColorOf(target.color), (value) => ({
        kind: "colors",
        value,
      }));
    case "shadows":
      return Option.map(nextColorOf(target.shadow.color), (value) => ({
        kind: "shadows",
        value: ShadowToken.withField(target.shadow, { field: "color", value }),
      }));
    case "gradientsStopColor":
      return Option.map(
        GradientToken.withStopColor(target.gradient, {
          stopIndex: target.stopIndex,
          nextColorOf,
        }),
        (value) => ({ kind: "gradients", value }),
      );
  }
}

/**
 * 数値の入力欄に入った文字列を数値として読む。数値として読めない入力（空欄・途中まで打っ
 * た符号）では値を変えない。
 *
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
 * @returns 書き換え後のトークンの値。数値 / `#` 付きの 6 桁・3 桁の色として読めないとき、
 *   および値域（ぼかしは 0 以上）を外れるときは `none`
 */
function shadowValueFrom(
  target: Extract<TokenFieldTarget, { kind: "shadows" }>,
  raw: string,
): Option<TokenValue> {
  const { shadow, field } = target;
  if (field === "color") {
    return hexColorValueFrom({ kind: "shadows", shadow, field }, (color) =>
      colorWithRgbFrom(color, raw),
    );
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
   * @returns 編集欄一式。トークンを選んでいないときは `none`
   */
  forSelection(selection: TokenSelection): Option<TokenControl> {
    return Option.map(TokenSelection.token(selection), tokenControlOf);
  },

  /**
   * 入力欄に入った文字列を、そのトークンの新しい値にする。
   *
   * 書き戻し先は行が持つ `target` から決める。色の位置（ピッカー・読めない色のテキスト欄）では
   * `#` を補わない。
   *
   * @param target 書き戻し先の種別と、複合の種別ではどのフィールドか
   * @param raw 入力欄に入っている文字列
   * @returns 書き換え後のトークンの値。数値 / `#` 付きの 6 桁・3 桁の色として読めないとき、
   *   および値域（docs/04-tokens.md「値の形式」・stop の比率は 0–100）を外れるときは `none`
   */
  valueFrom(target: TokenFieldTarget, raw: string): Option<TokenValue> {
    switch (target.kind) {
      case "colors":
      case "gradientsStopColor":
        return hexColorValueFrom(target, (color) =>
          colorWithRgbFrom(color, raw),
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
      case "gradientsAngle":
      case "gradientsStopRatio":
        return Option.map(gradientFrom(target, raw), (value) => ({
          kind: "gradients",
          value,
        }));
    }
  },

  /**
   * 箱の hex の欄へ打たれた文字列で、色の 6 桁を差し替える。不透明度は残す。
   *
   * `#` を省いてよいのは入力欄の約束事なので、`Rgb` ではなく入力欄を知っているここで補う。
   *
   * @param target 箱が書き戻す色
   * @param raw 入力欄に入っている文字列
   * @returns 書き換え後のトークンの値。`#` の有無を問わず 6 桁か 3 桁の hex として読めなければ
   *   `none`（4 桁・8 桁も `none`）
   */
  valueFromHex(target: HexColorTarget, raw: string): Option<TokenValue> {
    const spelled = raw.startsWith("#") ? raw : `#${raw}`;
    return hexColorValueFrom(target, (color) =>
      colorWithRgbFrom(color, spelled),
    );
  },

  /**
   * 箱の不透明度の欄へ打たれた文字列で、色の不透明度を差し替える。
   *
   * @param target 箱が書き戻す色
   * @param raw 入力欄に入っている文字列（%）
   * @returns 書き換え後のトークンの値。数値として読めないとき、0–100 の外のときは `none`
   */
  valueFromAlpha(target: HexColorTarget, raw: string): Option<TokenValue> {
    return hexColorValueFrom(target, (color) => colorWithAlphaFrom(color, raw));
  },

  /**
   * 箱の hex の欄に出す綴り。`#` は欄の外に添えるので除く。
   *
   * @param control hex として読めた色の箱
   * @returns 小文字の 6 桁（`#` 無し）
   */
  hexDigitsOf(control: HexColorControl): string {
    return control.rgb.slice(1);
  },
} as const;
