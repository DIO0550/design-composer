# 03. プリミティブスキーマ

プリミティブの語彙と、各プリミティブが持つ props の定義（型・ドメイン・デフォルト）、HTML/CSSへのコンパイル規則、バリデーション仕様を規定する。

## 前提（他仕様からの制約）

- props はフラットなスカラーのみ。1 prop = 1 ドメイン（enum / トークン参照 / 生リテラル）
- 見た目に関わる prop は必ずトークン参照（生リテラル禁止）
- スキーマからプロパティパネルを自動生成する
- artboard は Box のスキーマを流用する（例外を作らない）

## スキーマの記述場所と形式

- スキーマは **core 内の TypeScript 定数（宣言的データ）** として定義する
  - バリデーション・プロパティパネル生成・デフォルト解決は、すべてこの定数を走査する汎用コードとする
  - prop の追加はこの定数への1エントリ追加で完結する（スキーマ情報をコードに散らさない）
  - メタスキーマ相当は TS の型（`satisfies`）で担保する。外部ファイルの読み込み・検証は持たない
- コンパイル規則（Box → flex な div 等）はコードとして実装し、スキーマデータとは分離する
- **プリミティブ語彙は閉じる。ユーザー拡張は許さない**
  - Figma と同じ設計思想（ノード型は固定、拡張はコンポーネント層で行う）
  - 将来スキーマを外部化したくなった場合は、この定数を JSON に吐き出すことで移行できる

## prop 定義のフィールド

スキーマ定数における1 prop の定義は以下のフィールドを持つ。

| フィールド | 内容 |
|---|---|
| `domain` | `enum` / `token` / `literal` |
| `values` | enum 時: 許可される値のリスト |
| `tokenKind` | token 時: 参照するトークン種別（spacing / colors 等） |
| `literalType` | literal 時: `number` / `string` |
| `default` | デフォルト値。省略時は「なし」 |
| `group` | プロパティパネルのセクション（layout / size / appearance 等） |
| `enabledWhen` | 条件付き有効。`{ prop: "...", equals: "..." }` の**単純等値のみ**（条件式言語は作らない） |

- パネルの表示順は定数の定義順をそのまま使う。order フィールドは持たない
- 表示名フィールドは持たない。prop 名をパネル側で機械的に整形して表示する

## プリミティブの初期セット

初期語彙は **Box / Text の2つ**。

判断基準: **部品（命名サブツリー）で作れるものはプリミティブにしない**。

- **Button / Input はプリミティブではなく部品**。初期テンプレートに部品として同梱する
- **Image は保留**。画像資産の参照は1ファイル自己完結の原則と衝突するため、資産管理の問題として 01-file-format の未定義項目に積む

### サイズ指定の原則

- Figma の Hug / Fill / 固定値 に相当するサイズ指定は、**モード（enum）と値（number）の2 prop に分離**する
- `width` / `height` は `widthMode` / `heightMode` が `fixed` のときのみ有効（`enabledWhen`）

### Box

コンテナ。レイアウトと装飾を1本で担う。Figma の Frame + Auto Layout 相当。子を持てる。

| prop | ドメイン | 値 | デフォルト |
|---|---|---|---|
| `direction` | enum | `row` / `column` | `column` |
| `gap` | トークン (spacing) | | なし (0) |
| `paddingX` | トークン (spacing) | 左右 | なし (0) |
| `paddingY` | トークン (spacing) | 上下 | なし (0) |
| `align` | enum | `start` / `center` / `end` / `stretch` | `stretch` |
| `justify` | enum | `start` / `center` / `end` / `space-between` | `start` |
| `widthMode` | enum | `hug` / `fill` / `fixed` | `hug` |
| `width` | 生リテラル (number, px) | `widthMode: fixed` 時のみ有効 | - |
| `heightMode` | enum | `hug` / `fill` / `fixed` | `hug` |
| `height` | 生リテラル (number, px) | `heightMode: fixed` 時のみ有効 | - |
| `background` | トークン (colors) | | なし (透明) |
| `radius` | トークン (radius) | | なし (0) |
| `shadow` | トークン (shadows) | | なし |
| `overflow` | enum | `visible` / `clip` | `visible` |

- padding は Figma の基本操作に合わせ X / Y の2軸。4方向個別は必要になった時点で追加を検討する
- border 系は初期セットに含めない（スキーマへの追加で対応可能）
- artboard は Box スキーマを流用するが、`widthMode` / `heightMode` は `fixed` に固定され、`width` / `height` が必須、`overflow` のデフォルトは `clip`

### Text

テキスト葉ノード。子を持たない。

| prop | ドメイン | 値 | デフォルト |
|---|---|---|---|
| `content` | 生リテラル (string) | | `""` |
| `typography` | トークン (typography) | サイズ・行間・ウェイトの複合トークン | デフォルトトークン |
| `color` | トークン (colors) | | デフォルトトークン |
| `align` | enum | `left` / `center` / `right` | `left` |

- typography は複合トークン（04-tokens で定義）。fontSize / fontWeight を個別 prop にはしない

## HTML/CSS へのコンパイル規則

- **トークンは CSS カスタムプロパティにコンパイル**する。ルート要素に `--{種別}-{名前}: 値` を出力し、ノード側は `var()` で参照する。トークン編集が全ノードへ CSS レベルで波及する
- **ノードはすべて `div` ＋インライン style** で出力する。プレビュー用レンダリングであり production HTML ではないため、セマンティクス・クラス設計は持たない。決定的で診断しやすい出力を優先する

| prop | CSS |
|---|---|
| Box 自体 | `div` + `display: flex` |
| `direction` | `flex-direction` |
| `gap` | `gap: var(--spacing-*)` |
| `paddingX` / `paddingY` | `padding: var(--spacing-*)` （Y X の順で合成） |
| `align` | `align-items` |
| `justify` | `justify-content` |
| `widthMode: hug` | `width: fit-content` |
| `widthMode: fill` | 親の主軸方向なら `flex-grow: 1`、交差軸方向なら `align-self: stretch`（親の `direction` を見て出し分け） |
| `widthMode: fixed` | `width: {n}px` |
| `background` | `background: var(--colors-*)` |
| `radius` | `border-radius: var(--radius-*)` |
| `shadow` | `box-shadow: var(--shadows-*)` |
| `overflow: clip` | `overflow: hidden` |
| Text 自体 | `div` + typography トークン展開（`font-size` / `line-height` / `font-weight`） |
| Text `color` / `align` | `color` / `text-align` |

- height 系は width 系と同じ規則を縦軸に適用する
- `widthMode: fill` の出し分けが唯一親コンテキストに依存するコンパイル

## バリデーション仕様

以下をすべて**エラー**として検出する。警告という中間区分は設けない。

- JSON としてパース不能
- オブジェクトキーの重複（パース前の字句スキャン。01-file-format 参照）
- 未知の `type` / 未知の prop
- ドメイン違反（enum 外の値・literalType 不一致・存在しないトークン名への参照）
- dangling ref（存在しない部品名への参照）
- **部品の循環参照**（ref の展開が自分自身に到達する）
- overrides の未宣言キー（部品の publicProps 宣言に無い名前の上書き）
- binding の不整合（存在しない内部ノード名 / 存在しない prop への binding、ドメイン違反の上書き値）
- 識別子規則違反（命名規則・予約文字）
- ノードの `name` 欠落
- 名前の一意性違反（components キー・artboard 名・全ノード name の単一名前空間内での重複）

### 不正ファイル時の挙動

- **最後に正常だった状態のレンダリングを保持し、エラー一覧を重ねて表示する**
- AI がファイルを直接編集 → アプリが検知 → リロード、というワークフローにおいて、不正な中間状態で画面が失われないことを優先する
