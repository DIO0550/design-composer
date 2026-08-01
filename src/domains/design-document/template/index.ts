import type { ComponentSet } from "@/domains/component";
import type { TokenSet } from "@/domains/token";

/**
 * デフォルトテーマ（docs/04-tokens.md「初期トークンセット」）。
 *
 * トークン縛り切りのため、tokens が空のドキュメントでは見た目の prop を
 * 一切設定できない。そのため新規ドキュメントに必ず同梱する。
 */
const DEFAULT_THEME: TokenSet = {
  colors: {
    white: "#ffffff",
    "gray-100": "#f3f4f6",
    "gray-300": "#d1d5db",
    "gray-500": "#6b7280",
    "gray-700": "#374151",
    "gray-900": "#111827",
    primary: "#3b82f6",
    "primary-dark": "#1d4ed8",
    danger: "#ef4444",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, lg: 16, full: 9999 },
  shadows: {
    sm: { x: 0, y: 1, blur: 3, color: "#0000001a" },
    md: { x: 0, y: 4, blur: 12, color: "#00000026" },
    lg: { x: 0, y: 8, blur: 24, color: "#00000033" },
  },
  typography: {
    heading: { fontSize: 24, lineHeight: 1.4, fontWeight: 700 },
    subheading: { fontSize: 18, lineHeight: 1.5, fontWeight: 600 },
    body: { fontSize: 16, lineHeight: 1.6, fontWeight: 400 },
    caption: { fontSize: 12, lineHeight: 1.4, fontWeight: 400 },
  },
};

/**
 * 初期部品セット（docs/04-tokens.md「初期部品セット」）。
 *
 * デフォルトテーマと合わせて新規ドキュメントに同梱する。
 * publicProps による binding 記法の実例集も兼ねる。
 * 見た目の prop はすべてデフォルトテーマのトークンを参照する。
 *
 * border 系 prop が初期スキーマに無いため、text-input / secondary-button は
 * 背景色で領域を表現している（border 追加時に見直す）。
 */
const INITIAL_COMPONENTS: ComponentSet = {
  "primary-button": {
    publicProps: {
      label: { node: "primary-button-label", prop: "content" },
    },
    type: "Box",
    props: {
      direction: "row",
      align: "center",
      justify: "center",
      paddingX: "md",
      paddingY: "sm",
      background: "primary",
      radius: "md",
    },
    children: [
      {
        name: "primary-button-label",
        type: "Text",
        props: { content: "Button", color: "white" },
      },
    ],
  },
  "secondary-button": {
    publicProps: {
      label: { node: "secondary-button-label", prop: "content" },
    },
    type: "Box",
    props: {
      direction: "row",
      align: "center",
      justify: "center",
      paddingX: "md",
      paddingY: "sm",
      background: "gray-100",
      radius: "md",
    },
    children: [
      {
        name: "secondary-button-label",
        type: "Text",
        props: { content: "Button" },
      },
    ],
  },
  "text-input": {
    publicProps: {
      placeholder: { node: "text-input-placeholder", prop: "content" },
    },
    type: "Box",
    props: {
      paddingX: "md",
      paddingY: "sm",
      background: "gray-100",
      radius: "md",
      widthMode: "fill",
    },
    children: [
      {
        name: "text-input-placeholder",
        type: "Text",
        props: { content: "Placeholder", color: "gray-500" },
      },
    ],
  },
  card: {
    publicProps: {
      title: { node: "card-title", prop: "content" },
      body: { node: "card-body", prop: "content" },
    },
    type: "Box",
    props: {
      direction: "column",
      gap: "sm",
      paddingX: "lg",
      paddingY: "lg",
      background: "white",
      radius: "lg",
      shadow: "sm",
    },
    children: [
      {
        name: "card-title",
        type: "Text",
        props: { content: "Title", typography: "subheading" },
      },
      {
        name: "card-body",
        type: "Text",
        props: { content: "Body text", color: "gray-700" },
      },
    ],
  },
};

/**
 * 新規ドキュメントに同梱する雛形（docs/04-tokens.md「新規ドキュメントテンプレート」）。
 *
 * デフォルトテーマと初期部品セットは片方だけでは成立しない
 * （部品の見た目の prop はテーマのトークンを参照する）ため1つの型にまとめる。
 *
 * 部品が参照するトークンが揃っているか（スキーマの prop デフォルトが指す
 * Text の `typography` / `color` を含む）は型では縛らない。
 * 参照の整合はドキュメント全体の規則なので `DesignDocument.collectErrors` が
 * dangling-token として報告する担当で、docs/04-tokens.md も
 * 「通常のバリデーションエラーとして検出される（特別扱いしない）」としている。
 */
export type DocumentTemplate = Readonly<{
  tokens: TokenSet;
  components: ComponentSet;
}>;

/**
 * 仕様が定める既定の雛形。取りうる雛形は今のところこれ1つなので、
 * 生成の手続きではなく定数として公開する（`FormatVersion.CURRENT` と同じ形）。
 */
const DEFAULT: DocumentTemplate = {
  tokens: DEFAULT_THEME,
  components: INITIAL_COMPONENTS,
};

export const DocumentTemplate = {
  DEFAULT,
} as const;
