import { Px } from "@/domains/px";
import {
  type ColorToken,
  ShadowToken,
  type Token,
  type TokenKind,
  TokenSet,
  type TokenValue,
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
  | Readonly<{ kind: "none" }>;

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
 * 1トークン分の編集欄。値の形式（docs/04-tokens.md「値の形式」）から
 * 入力欄の種類が決まる。
 */
export type TokenControlInput =
  | Readonly<{ kind: "color"; value: ColorToken }>
  | Readonly<{ kind: "length"; value: number }>;

export type TokenControl = Readonly<{
  token: Token;
  input: TokenControlInput;
}>;

/**
 * 長さのプレビューの上限（px）。
 * これを超える長さも同じ幅で頭打ちにする（一覧の行の幅が値で伸び縮みしないため）。
 */
const PREVIEW_MAX_WIDTH_PX = 20;

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
    /*
     * 複合オブジェクトの種別は行に見本を出さない。UI 案（docs/Design Composer.html）が
     * shadows / typography のセクションを畳んだ状態でしか描いておらず、
     * 見本の形を決める拠り所が無いため（#42 の単位 2 で寄せる）。
     */
    case "shadows":
    case "typography":
      return { kind: "none" };
  }
}

/** 行の右端に出す値。種別ごとに、その値を1行で読める形にする。 */
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

export const TokenRow = {
  /**
   * その行を選んで直せるか。
   * 直せるのは値が1つの値で表せる種別だけで、複合オブジェクトの種別は
   * フォームがまだ無い（#42 の単位 2）。
   */
  isEditable(row: TokenRow): boolean {
    return TokenSet.isScalarKind(row.token.kind);
  },
} as const;

export const TokenSection = {
  /**
   * そのセクションへ足すときの指定。編集欄を持たない種別（複合オブジェクト）は
   * 足しても直せないので `none`（#42 の単位 2 でフォームと一緒に開ける）。
   */
  addTemplate(section: TokenSection): Option<TokenTemplate> {
    return TokenSet.isScalarKind(section.kind)
      ? Option.some({ kind: section.kind })
      : Option.none;
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
 * 長さの入力欄に入った文字列を長さとして読む。
 * 数値として読めない入力（空欄・途中まで打った符号）では値を変えない。
 * 読めない値を書き込むとその種別の値の形式が壊れるため（docs/04-tokens.md）。
 */
function lengthFromRaw(raw: string): Option<number> {
  const length = Number(raw);
  return raw !== "" && Number.isFinite(length)
    ? Option.some(length)
    : Option.none;
}

export const TokenControl = {
  /**
   * その種別の入力欄。値が複合オブジェクトの種別は1つの入力欄で表せないので `none`
   * （#42 の単位 2 でフォームを作る）。
   */
  inputOf(token: Token): Option<TokenControlInput> {
    switch (token.kind) {
      case "colors":
        return Option.some({ kind: "color", value: token.value });
      case "spacing":
      case "radius":
        return Option.some({ kind: "length", value: token.value });
      case "shadows":
      case "typography":
        return Option.none;
    }
  },

  /**
   * 選択中のトークンの編集欄（docs/06-ui.md「編集操作の一覧」の tokens 編集）。
   * 選択が無い・入力欄を持たない種別では空になる。
   */
  forSelection(state: EditorState): Option<TokenControl> {
    return Option.flatMap(EditorState.selectedToken(state), (token) =>
      Option.map(TokenControl.inputOf(token), (input) => ({ token, input })),
    );
  },

  /**
   * 入力欄に入った文字列を、そのトークンの新しい値にする。
   *
   * 種別は編集中のトークンから取る。入力欄の種類（色 / 長さ）で決めると
   * 長さの欄が `spacing` と `radius` を区別できず、書き込み先を取り違えるため。
   */
  valueFrom(control: TokenControl, raw: string): Option<TokenValue> {
    const token = control.token;
    switch (token.kind) {
      case "colors":
        return Option.some({ kind: "colors", value: raw });
      case "spacing":
        return Option.map(lengthFromRaw(raw), (value) => ({
          kind: "spacing",
          value,
        }));
      case "radius":
        return Option.map(lengthFromRaw(raw), (value) => ({
          kind: "radius",
          value,
        }));
      case "shadows":
      case "typography":
        return Option.none;
    }
  },
} as const;
