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
 * `number` / `text` は `PropControlInput` と同じ語。`percent` / `degree` / `color` は単位を持つ
 * トークン固有の語。
 *
 * 不透明度と stop の比率は `percent`、角度は `degree` の欄が持つ。
 */
export type TokenControlInput =
  | Readonly<{ kind: "color"; value: Rgb }>
  | Readonly<{ kind: "percent"; value: number }>
  | Readonly<{ kind: "degree"; value: number }>
  | Readonly<{ kind: "number"; value: number }>
  | Readonly<{ kind: "text"; value: string }>;

/**
 * その行が書き戻す先。
 *
 * `kind` は `TokenKind` と1対1ではない。不透明度の行は色の一部を差し替えるだけなので、
 * `colorsAlpha` が書き戻すのは `colors` の値になる。`gradientsAngle` / `gradientsStopRatio` /
 * `gradientsStopColor` / `gradientsStopAlpha` の 4 つも、1 つのグラデーションの角度・stop の
 * 比率・色・不透明度を差し替えるだけなので、書き戻すのは `gradients` の値になる。
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
    }>
  | Readonly<{
      kind: "gradientsStopAlpha";
      gradient: GradientToken;
      stopIndex: number;
    }>;

/**
 * 編集欄の1行。色は2行（RGB と不透明度）、複合の種別はフィールドの数だけ並ぶ。
 *
 * `name` は行の識別子で、1つのトークンの中で一意（複合の種別はフィールド名）。
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

/**
 * 1 つの色に並べる行の綴りと書き戻し先。
 *
 * `hex` は 6 桁を打てるテキスト欄で、stop の行だけが持つ（docs/06-ui.md「`Tokens` の `gradients`」）。
 */
type ColorRows = Readonly<{
  rgb: TokenControlRow;
  alpha: TokenControlRow;
  hex: Option<TokenControlRow>;
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
  /** 比率・見本・hex・不透明度の欄。色が hex として読めなければ比率と色のテキスト欄 */
  fields: readonly TokenControlField[];
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
  angle: TokenControlField;
  stops: readonly GradientStopRow[];
  /** stop の + を押した後の値 */
  afterAdd: TokenValue;
}>;

/** 値の欄（docs/06-ui.md「値の欄」）の形。グラデーションだけが stop の行と +・− を持つ。 */
export type TokenValueFields =
  | Readonly<{ kind: "fields"; fields: readonly TokenControlField[] }>
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
 * @param rows 色そのもの・hex・不透明度の行の綴りと書き戻し先
 * @returns hex として読めればピッカー・（`rows.hex` があれば）hex・不透明度の行、読めなければ
 *   テキスト欄1行
 */
function colorFields(
  color: ColorToken,
  rows: ColorRows,
): readonly TokenControlField[] {
  const rgb = ColorToken.rgbOf(color);
  if (!Option.isSome(rgb)) {
    return [{ ...rows.rgb, input: { kind: "text", value: color } }];
  }
  const hexFields: readonly TokenControlField[] = Option.isSome(rows.hex)
    ? [{ ...rows.hex.value, input: { kind: "text", value: rgb.value } }]
    : [];
  return [
    { ...rows.rgb, input: { kind: "color", value: rgb.value } },
    ...hexFields,
    {
      ...rows.alpha,
      input: {
        kind: "percent",
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
function fieldsOf(
  token: Exclude<Token, { kind: "gradients" }>,
): readonly TokenControlField[] {
  switch (token.kind) {
    case "colors":
      return colorFields(token.value, {
        rgb: {
          name: ScalarFieldName,
          label: ScalarLabel,
          target: { kind: "colors", color: token.value },
        },
        alpha: {
          name: ColorsAlphaFieldName,
          label: AlphaLabel,
          target: { kind: "colorsAlpha", color: token.value },
        },
        hex: Option.none,
      });
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
          ? colorFields(token.value.color, {
              rgb: {
                name: field,
                label: ShadowLabels[field],
                target: { kind: "shadows", shadow: token.value, field },
              },
              alpha: {
                name: ShadowAlphaFieldName,
                label: AlphaLabel,
                target: { kind: "shadowsAlpha", shadow: token.value },
              },
              hex: Option.none,
            })
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
 * stop の行とつまみの識別子。
 *
 * @param stopIndex stop の位置（0 始まり）
 * @returns 1 始まりの配列順を添えた綴り（`stop-1` など）
 */
function stopRowNameOf(stopIndex: number): string {
  return `stop-${stopIndex + 1}`;
}

/**
 * stop 1 件ぶんの行。比率の欄を先頭に置き、見本・hex・不透明度を続ける（docs/06-ui.md「`Tokens` の
 * `gradients`」の「stop の行は `ratio`・見本・hex・`−` の順」）。
 *
 * @param gradient stop を持つグラデーション
 * @param stop 行にする stop
 * @param stopIndex その stop の位置（0 始まり）
 * @returns 比率・見本・hex・不透明度の欄と −。欄の見出しと行の名前は 1 始まりの配列順で数える
 */
function gradientStopRowOf(
  gradient: GradientToken,
  stop: GradientStop,
  stopIndex: number,
): GradientStopRow {
  const n = stopIndex + 1;
  const name = stopRowNameOf(stopIndex);
  const ratioField: TokenControlField = {
    name: `${name}-ratio`,
    label: `stop ${n} の比率`,
    input: { kind: "percent", value: GradientStop.ratioPercentOf(stop) },
    target: { kind: "gradientsStopRatio", gradient, stopIndex },
  };
  const colorTarget: TokenFieldTarget = {
    kind: "gradientsStopColor",
    gradient,
    stopIndex,
  };
  const colorRows = colorFields(stop.color, {
    rgb: {
      name: `${name}-color`,
      label: `stop ${n} の色`,
      target: colorTarget,
    },
    hex: Option.some({
      name: `${name}-hex`,
      label: `stop ${n} の hex`,
      target: colorTarget,
    }),
    alpha: {
      name: `${name}-alpha`,
      label: `stop ${n} の不透明度`,
      target: { kind: "gradientsStopAlpha", gradient, stopIndex },
    },
  });
  return {
    name,
    fields: [ratioField, ...colorRows],
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
 *   編集欄で、見本は色だけが持つ
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
    valueFields: { kind: "fields", fields: fieldsOf(token) },
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
 * @returns 6 桁を差し替えた色。`#rrggbb` として読めなければ `none`
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
 * グラデーションの入力欄へ打たれた文字列を、書き換え後のグラデーションにする。
 *
 * @param target 書き換えるグラデーションと、角度・どの stop の何か
 * @param raw 入力欄に入っている文字列
 * @returns 書き換え後のグラデーション。数値 / 6桁の色として読めないとき、比率・不透明度が
 *   0–100 の外のとき（`GradientToken` / `ColorToken` の `none`）は `none`
 */
function gradientFrom(
  target: Extract<TokenFieldTarget, { kind: `gradients${string}` }>,
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
    case "gradientsStopColor":
      return GradientToken.withStopColor(target.gradient, {
        stopIndex: target.stopIndex,
        nextColorOf: (color) => colorWithRgbFrom(color, raw),
      });
    case "gradientsStopAlpha":
      return GradientToken.withStopColor(target.gradient, {
        stopIndex: target.stopIndex,
        nextColorOf: (color) => colorWithAlphaFrom(color, raw),
      });
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
 * @returns 書き換え後のトークンの値。数値 / 6桁の色として読めないとき、
 *   および値域（ぼかしは 0 以上）を外れるときは `none`
 */
function shadowValueFrom(
  target: Extract<TokenFieldTarget, { kind: "shadows" }>,
  raw: string,
): Option<TokenValue> {
  const { shadow, field } = target;
  if (field === "color") {
    return Option.map(colorWithRgbFrom(shadow.color, raw), (value) => ({
      kind: "shadows",
      value: ShadowToken.withField(shadow, { field, value }),
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
   * @returns 編集欄一式。トークンを選んでいないときは `none`
   */
  forSelection(selection: TokenSelection): Option<TokenControl> {
    return Option.map(TokenSelection.token(selection), tokenControlOf);
  },

  /**
   * 入力欄に入った文字列を、そのトークンの新しい値にする。
   *
   * 書き戻し先は行が持つ `target` から決める。
   *
   * @param target 書き戻し先の種別と、複合の種別ではどのフィールドか
   * @param raw 入力欄に入っている文字列
   * @returns 書き換え後のトークンの値。数値 / 6桁の色として読めないとき、および
   *   値域（docs/04-tokens.md「値の形式」・不透明度と stop の比率は 0–100）を外れるときは `none`
   */
  valueFrom(target: TokenFieldTarget, raw: string): Option<TokenValue> {
    switch (target.kind) {
      case "colors":
        return Option.map(colorWithRgbFrom(target.color, raw), (value) => ({
          kind: "colors",
          value,
        }));
      case "colorsAlpha":
        return Option.map(colorWithAlphaFrom(target.color, raw), (value) => ({
          kind: "colors",
          value,
        }));
      case "shadowsAlpha":
        return Option.map(
          colorWithAlphaFrom(target.shadow.color, raw),
          (value) => ({
            kind: "shadows",
            value: ShadowToken.withField(target.shadow, {
              field: "color",
              value,
            }),
          }),
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
      case "gradientsStopColor":
      case "gradientsStopAlpha":
        return Option.map(gradientFrom(target, raw), (value) => ({
          kind: "gradients",
          value,
        }));
    }
  },
} as const;
