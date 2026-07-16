# 04. デザイントークン

tokens セクションの体系を規定する。「見た目に関わる値はすべてトークン参照」（02で決定）のため、トークンは色に限らず見た目の全ドメインを担う。

## 種別

トークン種別は以下の5種で、**閉じた集合**とする（スキーマの `tokenKind` と対応するため、ユーザーが種別を追加することはできない）。

| 種別 | 値の形式 | 参照する prop の例 |
|---|---|---|
| `colors` | hex 文字列 | background, color |
| `spacing` | number（px） | gap, paddingX, paddingY |
| `radius` | number（px） | radius |
| `shadows` | 複合オブジェクト | shadow |
| `typography` | 複合オブジェクト | typography |

```json
"tokens": {
  "colors":  { "primary": "#3b82f6", "gray-900": "#111827" },
  "spacing": { "sm": 8, "md": 16 },
  "radius":  { "md": 8 },
  "shadows": { "sm": { "x": 0, "y": 1, "blur": 3, "color": "#0000001a" } },
  "typography": { "body": { "fontSize": 16, "lineHeight": 1.6, "fontWeight": 400 } }
}
```

## 命名規則

- トークン名は部品名・artboard 名と同一の規則: kebab-case、`[a-z0-9-]`、`/` `#` `.` は予約
- 一意性は種別内で保証する（colors と spacing に同名があってもよい。参照時は tokenKind で引くため衝突しない）

## 値の形式

### colors

- **hex のみ**: `#rrggbb` または alpha 込みの `#rrggbbaa`（小文字に正規化）
- CSS 色文字列（`rgb()` / `hsl()` / 名前色）は許さない
  - 正規形を1つに保つため（同値異表記の併存を防ぎ、AI 生成の表記揺れ・diff の劣化・重複を構造的に排除する）
  - 検証が正規表現1本で済む
- HSL 等での色操作はカラーピッカー（UI側）が担い、**保存時に hex へ正規化する**。保存形式と入力UIは分離する
- 広色域（display-p3 / oklch 等）は将来 formatVersion を上げて対応する

### spacing / radius

- 単位なしの number。px として解釈する（生リテラルの width / height と同じ規則）

### typography

複合オブジェクト。フィールドは以下に固定する。

| フィールド | 型 | 必須 | 内容 |
|---|---|---|---|
| `fontSize` | number | ✔ | px |
| `lineHeight` | number | ✔ | 単位なし倍率（CSS の unitless line-height） |
| `fontWeight` | number | ✔ | 100–900 |
| `fontFamily` | string | - | 省略時はシステムフォントスタック |

### shadows

複合オブジェクト。フィールドは以下に固定する。

| フィールド | 型 | 必須 | 内容 |
|---|---|---|---|
| `x` / `y` | number | ✔ | オフセット px |
| `blur` | number | ✔ | px |
| `spread` | number | - | px、省略時 0 |
| `color` | string | ✔ | **生 hex**（`#rrggbbaa` 可） |

- shadows 内の `color` は colors トークンへの参照ではなく生 hex で持つ
  - 影の色は実務上ほぼ半透明の黒であり、colors パレット（背景・文字用の色一覧）に影専用色を混ぜない
  - トークン間参照（alias）導入時に、参照も許可する形へ拡張できる

## トークン間参照（alias）

- `text-primary` → `gray-900` のようなトークン間参照は**初期仕様では持たない**。将来拡張として予約する（外部 import と同じ扱い）

## スキーマデフォルトとの関係

- スキーマの prop デフォルトがトークン名を指す場合（Text の `typography: "body"` 等）、その名前は初期テンプレートが保証する
- ユーザーがそのトークンを削除した場合、デフォルト解決は dangling 参照となり、通常のバリデーションエラーとして検出される（特別扱いしない）

## 初期トークンセット（デフォルトテーマ）

新規ドキュメントにはデフォルトテーマを必ず同梱する。**トークン縛り切りのため、tokens が空のドキュメントでは見た目の prop を一切設定できない**（空はあり得ない）。初期部品セット（primary-button 等）と合わせて新規ドキュメントテンプレートを構成する。

叩き台:

```json
{
  "colors": {
    "white": "#ffffff",
    "gray-100": "#f3f4f6",
    "gray-300": "#d1d5db",
    "gray-500": "#6b7280",
    "gray-700": "#374151",
    "gray-900": "#111827",
    "primary": "#3b82f6",
    "primary-dark": "#1d4ed8",
    "danger": "#ef4444"
  },
  "spacing": { "xs": 4, "sm": 8, "md": 16, "lg": 24, "xl": 32 },
  "radius": { "sm": 4, "md": 8, "lg": 16, "full": 9999 },
  "shadows": {
    "sm": { "x": 0, "y": 1, "blur": 3, "color": "#0000001a" },
    "md": { "x": 0, "y": 4, "blur": 12, "color": "#00000026" },
    "lg": { "x": 0, "y": 8, "blur": 24, "color": "#00000033" }
  },
  "typography": {
    "heading": { "fontSize": 24, "lineHeight": 1.4, "fontWeight": 700 },
    "subheading": { "fontSize": 18, "lineHeight": 1.5, "fontWeight": 600 },
    "body": { "fontSize": 16, "lineHeight": 1.6, "fontWeight": 400 },
    "caption": { "fontSize": 12, "lineHeight": 1.4, "fontWeight": 400 }
  }
}
```

- Text のスキーマデフォルトは `typography: "body"` / `color: "gray-900"` を指す

## 初期部品セット（テンプレート）

デフォルトテーマと合わせて新規ドキュメントに同梱する部品。binding 記法（publicProps）の実例集を兼ねる。

```json
"components": {
  "primary-button": {
    "publicProps": {
      "label": { "node": "primary-button-label", "prop": "content" }
    },
    "type": "Box",
    "props": {
      "direction": "row", "align": "center", "justify": "center",
      "paddingX": "md", "paddingY": "sm",
      "background": "primary", "radius": "md"
    },
    "children": [
      { "name": "primary-button-label", "type": "Text",
        "props": { "content": "Button", "color": "white" } }
    ]
  },
  "secondary-button": {
    "publicProps": {
      "label": { "node": "secondary-button-label", "prop": "content" }
    },
    "type": "Box",
    "props": {
      "direction": "row", "align": "center", "justify": "center",
      "paddingX": "md", "paddingY": "sm",
      "background": "gray-100", "radius": "md"
    },
    "children": [
      { "name": "secondary-button-label", "type": "Text",
        "props": { "content": "Button" } }
    ]
  },
  "text-input": {
    "publicProps": {
      "placeholder": { "node": "text-input-placeholder", "prop": "content" }
    },
    "type": "Box",
    "props": {
      "paddingX": "md", "paddingY": "sm",
      "background": "gray-100", "radius": "md",
      "widthMode": "fill"
    },
    "children": [
      { "name": "text-input-placeholder", "type": "Text",
        "props": { "content": "Placeholder", "color": "gray-500" } }
    ]
  },
  "card": {
    "publicProps": {
      "title": { "node": "card-title", "prop": "content" },
      "body": { "node": "card-body", "prop": "content" }
    },
    "type": "Box",
    "props": {
      "direction": "column", "gap": "sm",
      "paddingX": "lg", "paddingY": "lg",
      "background": "white", "radius": "lg", "shadow": "sm"
    },
    "children": [
      { "name": "card-title", "type": "Text",
        "props": { "content": "Title", "typography": "subheading" } },
      { "name": "card-body", "type": "Text",
        "props": { "content": "Body text", "color": "gray-700" } }
    ]
  }
}
```

- Text の未指定 props はスキーマデフォルト（`typography: "body"` / `color: "gray-900"`）に従う
- border 系 prop が初期スキーマに無いため、text-input / secondary-button は背景色で領域を表現している。border 追加時（03-schema）に定義を見直す
