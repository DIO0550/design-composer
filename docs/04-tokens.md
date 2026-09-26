# 04. デザイントークン

tokens セクションの体系を規定する。「見た目に関わる値のうち、トークン種別を持つものはトークン参照」（02で決定）のため、トークンは色に限らず見た目の広い範囲を担う。種別に載らない見た目の値（不透明度）だけはノードの prop が生リテラルで持つ（03-schema「不透明度」）。

## 種別

トークン種別は以下の6種で、**閉じた集合**とする（スキーマの `tokenKind` と対応するため、ユーザーが種別を追加することはできない）。

| 種別 | 値の形式 | 参照する prop の例 |
|---|---|---|
| `colors` | hex 文字列 | background, color |
| `spacing` | number（px） | gap, paddingTop / paddingRight / paddingBottom / paddingLeft |
| `radius` | number（px） | radius |
| `shadows` | 複合オブジェクト | shadow |
| `typography` | 複合オブジェクト | typography |
| `gradients` | 複合オブジェクト | background |

```json
"tokens": {
  "colors":  { "primary": "#3b82f6", "gray-900": "#111827" },
  "spacing": { "sm": 8, "md": 16 },
  "radius":  { "md": 8 },
  "shadows": { "sm": { "x": 0, "y": 1, "blur": 3, "color": "#0000001a" } },
  "typography": { "body": { "fontSize": 16, "lineHeight": 1.6, "fontWeight": 400 } },
  "gradients": { "brand": { "shape": "linear", "angle": 90, "stops": [{ "color": "#3b82f6", "ratio": 0 }, { "color": "#1d4ed8", "ratio": 1 }] } }
}
```

## 命名規則

- トークン名は部品名・artboard 名と同一の規則: kebab-case、`[a-z0-9-]`、`/` `#` `.` は予約
- 一意性は種別内で保証する（colors と spacing に同名があってもよい。参照時は prop のスキーマが指す種別で引くため衝突しない）
- **例外は塗り用の 2 種別。** `background` が colors と gradients の両方を指せる（03-schema「塗り」）ので、この 2 種別に同名があると裸の名前でどちらを指すか決まらない。`colors.primary` を持つドキュメントに `gradients.primary` は置けない
  - **`background` がその名前を指しているかに依らず**バリデーションエラーにする（03-schema「バリデーション仕様」）。指された時点で初めて不正になる形にすると、原因はトークン側にあるのにノードの編集で壊れる
  - **追加・改名のときも相手の種別の名前と突き合わせる。** 編集から不正なドキュメントを作れる状態を残さない

## 値の形式

### colors

- **hex のみ**: `#rrggbb` または alpha 込みの `#rrggbbaa`（小文字に正規化）
- CSS 色文字列（`rgb()` / `hsl()` / 名前色）は許さない
  - 正規形を1つに保つため（同値異表記の併存を防ぎ、AI 生成の表記揺れ・diff の劣化・重複を構造的に排除する）
  - 検証が正規表現1本で済む
- **3 桁・4 桁の短縮形（`#rgb` / `#rgba`）は読み込み時に 6 桁・8 桁へ展開する。** 各桁を重ねるだけで同じ色に決まるので、エラーにせず正規形へ倒す（影・グラデーションの中の色も同じ）
- それ以外で hex として読めない値はバリデーションエラーにする（03-schema「バリデーション仕様」）。値域違反（下記「値域の扱い」）は形式が合っていて値だけがずれているのに対し、hex でない値は正規形が定義できず、上の「正規形を1つに保つ」が崩れる
- HSL 等での色操作はカラーピッカー（UI側）が担い、**保存時に hex へ正規化する**。保存形式と入力UIは分離する
- 広色域（display-p3 / oklch 等）は将来 formatVersion を上げて対応する

### spacing / radius

- 単位なしの number。px として解釈する（生リテラルの width / height と同じ規則）
- 長さなので **0 以上**（負は取らない）

### typography

複合オブジェクト。フィールドは以下に固定する。

| フィールド | 型 | 必須 | 内容 |
|---|---|---|---|
| `fontSize` | number | ✔ | px。0 より大きい |
| `lineHeight` | number | ✔ | 単位なし倍率（CSS の unitless line-height）。0 より大きい |
| `fontWeight` | number | ✔ | 100–900 |
| `fontFamily` | string | - | 省略時はシステムフォントスタック |

- `fontWeight` は **100–900 の範囲**であって「100 刻みの 9 値」ではない。可変フォントの `450` も取りうる

### shadows

複合オブジェクト。フィールドは以下に固定する。

| フィールド | 型 | 必須 | 内容 |
|---|---|---|---|
| `x` / `y` | number | ✔ | オフセット px。負も取る |
| `blur` | number | ✔ | px。0 以上（CSS の blur-radius は負を取れない） |
| `spread` | number | - | px、省略時 0。負も取る |
| `color` | string | ✔ | **生 hex**（`#rrggbbaa` 可） |

- shadows 内の `color` は colors トークンへの参照ではなく生 hex で持つ
- hex として読めない `color` は、colors トークンと違いバリデーションエラーにしない（03-schema「バリデーション仕様」は colors の値だけを見る）
  - 影の色は実務上ほぼ半透明の黒であり、colors パレット（背景・文字用の色一覧）に影専用色を混ぜない
  - トークン間参照（alias）導入時に、参照も許可する形へ拡張できる

### gradients

複合オブジェクト。フィールドは以下に固定する。

| フィールド | 型 | 必須 | 内容 |
|---|---|---|---|
| `shape` | string | ✔ | 色を並べる形。`"linear"` のみ（radial / conic は持たない） |
| `angle` | number | ✔ | 色が変わっていく向き。度、時計回りで、`0` が下から上（CSS の `linear-gradient` と同じ向き。03-schema「回転」の `rotation` と違い `0` は無回転ではない） |
| `stops` | array | ✔ | 色の変わり目。配列の並びがそのまま CSS の stop の並びになる |

`stops` の 1 件は以下を持つ。

| フィールド | 型 | 必須 | 内容 |
|---|---|---|---|
| `color` | string | ✔ | **生 hex**（`#rrggbb` / `#rrggbbaa`。小文字に正規化） |
| `ratio` | number | ✔ | 0〜1。`0` が始点、`1` が終点 |

- hex として読めない stop の `color` は、colors トークンと違いバリデーションエラーにしない（03-schema「バリデーション仕様」は colors の値だけを見る）
- `stops` の色は colors トークンへの参照ではなく生 hex で持つ。参照は下記「トークン間参照（alias）」に当たり、階調のための中間色を colors パレット（背景・文字用の色一覧）に混ぜないのは `shadows` の `color` と同じ
- **`ratio` に `position` は使わない。** 03-schema「配置の指定」が prop 名を CSS の `position` に揃えなかったのと同じで、この仕様は既に「位置」の語を別の意味に使っている
- **`shape` は取りうる値が `"linear"` の 1 つでもフィールドとして置く。** radial / conic を足すときに「未指定なら linear」の特例を作らないため。`type` は `.dcmp` でノードのプリミティブ名を指し（02-data-model「ノード」）、`kind` は 03-schema「prop 定義のフィールド」の `enabledWhen` が条件の種類に使っているので、どちらも避ける
- CSS へは `--gradients-{名前}: linear-gradient({angle}deg, {color} {ratio×100}%, …)` として出す。`angle` は CSS と同じ向きなので変換しない。`ratio×100` は小数 4 桁で丸める（二進小数の誤差が綴りに出るのを防ぐ。`0.007` は `0.7%`）
- **`ratio` が 0〜1 の外にある / `stops` が 2 件に満たないファイルも、読み込みでは弾かない**（下記「値域の扱い」）。そのまま CSS へ出して解釈はブラウザに委ねる（03-schema「HTML/CSS へのコンパイル規則」が `opacity` の範囲外で採っているのと同じ）。編集で受け取るところでは `ratio` を 0〜1、`stops` を 2 件以上に保つ
- **トークンの値が可変長の並びを持つのは gradients だけ。** 02-data-model「値の形: フラットなスカラーのみ」が配列を許さないのは props の制約で、トークンの値にはかからない
- どの版から読み書きできるかは 01-file-format「formatVersion」の表が持つ。新しい種別は minor の追加的変更にあたる

### 値域の扱い

- 値域は**編集で受け取るところ**で課す。範囲外の入力は値を変えず、画面には何も出さない（数値として読めない入力と同じ扱い）
- **読み込みでは値域を見ない。** 既に書かれている範囲外の値はそのまま読む。値域違反はバリデーションエラーにもしない（「警告という中間区分は設けない」ため、トークン 1 つの値域違反でファイル全体が不正になってしまう / 03-schema.md）
- hex でない colors トークンは値域ではなく**形式**の違反で、バリデーションエラーにする（上記「colors」）

## トークン間参照（alias）

- `text-primary` → `gray-900` のようなトークン間参照は**初期仕様では持たない**。将来拡張として予約する（外部 import と同じ扱い）

## スキーマデフォルトとの関係

- スキーマの prop デフォルトがトークン名を指す場合（Text の `typography: "body"` 等）、その名前は初期テンプレートが保証する
- ユーザーがそのトークンを削除した場合、デフォルト解決は dangling 参照となり、通常のバリデーションエラーとして検出される（特別扱いしない）
- トークンの参照箇所を数えるときも、スキーマデフォルトで効いている参照を 1 件として数える（検証が dangling を報告する範囲と同じ）

## 初期トークンセット（デフォルトテーマ）

新規ドキュメントにはデフォルトテーマを必ず同梱する。**トークン縛り切りのため、tokens が空のドキュメントでは色・余白・角丸・フォント・影・グラデーションを一切設定できない**（空はあり得ない。種別を持たない不透明度だけは設定できるが、それだけでは見た目を作れない）。初期部品セット（primary-button 等）と合わせて新規ドキュメントテンプレートを構成する。

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
  },
  "gradients": {
    "brand": {
      "shape": "linear",
      "angle": 90,
      "stops": [
        { "color": "#3b82f6", "ratio": 0 },
        { "color": "#2563eb", "ratio": 0.5 },
        { "color": "#1d4ed8", "ratio": 1 }
      ]
    }
  }
}
```

- スキーマデフォルトが指すトークン名は、Text の `typography: "body"` / `color: "gray-900"` と、Ellipse の `background: "gray-300"`（03-schema）

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
      "layout": "row", "align": "center", "justify": "center",
      "paddingTop": "sm", "paddingRight": "md", "paddingBottom": "sm", "paddingLeft": "md",
      "background": "primary",
      "radiusTopLeft": "md", "radiusTopRight": "md", "radiusBottomRight": "md", "radiusBottomLeft": "md"
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
      "layout": "row", "align": "center", "justify": "center",
      "paddingTop": "sm", "paddingRight": "md", "paddingBottom": "sm", "paddingLeft": "md",
      "background": "gray-100",
      "radiusTopLeft": "md", "radiusTopRight": "md", "radiusBottomRight": "md", "radiusBottomLeft": "md"
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
      "paddingTop": "sm", "paddingRight": "md", "paddingBottom": "sm", "paddingLeft": "md",
      "background": "gray-100",
      "radiusTopLeft": "md", "radiusTopRight": "md", "radiusBottomRight": "md", "radiusBottomLeft": "md",
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
      "layout": "column", "gap": "sm",
      "paddingTop": "lg", "paddingRight": "lg", "paddingBottom": "lg", "paddingLeft": "lg",
      "background": "white", "shadow": "sm",
      "radiusTopLeft": "lg", "radiusTopRight": "lg", "radiusBottomRight": "lg", "radiusBottomLeft": "lg"
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
