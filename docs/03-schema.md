# 03. プリミティブスキーマ

プリミティブの語彙と、各プリミティブが持つ props の定義（型・ドメイン・デフォルト）、HTML/CSSへのコンパイル規則、バリデーション仕様を規定する。

## 前提（他仕様からの制約）

- props はフラットなスカラーのみ。1 prop = 1 ドメイン（enum / トークン参照 / 生リテラル）
- 見た目に関わる prop のうち、トークン種別を持つものは必ずトークン参照（生リテラル禁止）。種別を持たない見た目の値（不透明度）は生リテラル（02-data-model「値のドメイン: 3種類」）
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
| `range` | `literalType: number` 時: 取りうる値の範囲（両端を含む）。`{ min: 0, max: 1 }`。宣言しない prop は範囲では弾かれない |
| `default` | デフォルト値。省略時は「なし」 |
| `group` | プロパティパネルのセクション（layout / size / appearance 等） |
| `enabledWhen` | 条件付き有効。`{ kind: "equals", prop: "...", equals: "..." }` / `{ kind: "notEquals", prop: "...", notEquals: "..." }` の**単純な等値・不等値のみ**（条件式言語は作らない）。見るのは**同じノードの** prop だけ |
| `shorthand` | 4 つの longhand の 1 つであることの宣言。padding は辺で `{ name: "padding", side: "top" }`、radius は隅で `{ name: "radius", corner: "topLeft" }` |

- パネルの表示順は定数の定義順をそのまま使う。order フィールドは持たない
- 表示名フィールドは持たない。prop 名をパネル側で機械的に整形して表示する

## プリミティブの初期セット

初期語彙は **Box / Text / Ellipse の3つ**。

判断基準は2つとも**除外の条件**で書く。**部品（命名サブツリー）で作れるものはプリミティブにしない**。**props がフラットなスカラーだけでは形が決まらないものもプリミティブにしない**（02-data-model「値の形: フラットなスカラーのみ」）。どちらにも当たらないものが候補で、そこから先は個別の判断になる。

- **Button / Input はプリミティブではなく部品**。1つ目に当たる。初期テンプレートに部品として同梱する
- **Image は保留**。どちらの条件にも当たらない（部品では作れず、参照は相対パスの文字列1つ）が、画像資産の参照は1ファイル自己完結の原則と衝突するため、資産管理の問題として 01-file-format の未定義項目に積む
- **Ellipse はプリミティブにする**。どちらの条件にも当たらない。矩形は Box で代用でき、正円も幅 = 高さの Box の 4 隅に大きな角丸を与えれば作れるが、**幅 ≠ 高さの楕円は Box では作れない**（角丸が指す radius トークンの値は px の number なので `50%` を表せない / 04-tokens「値の形式」）。楕円は幅と高さだけで形が決まるので、既存のサイズ指定の語彙のまま持てる
- **Vector は持たない**。2つ目に当たる。頂点の並び＝配列を props に載せることになる
- **Line も持たない**。こちらはどちらの条件にも当たらない（線の形は位置・長さ・角度で決まり、角度も number 1 つ）。持たないのは、**薄い Box に `rotation` を書けば任意の向きの線になる**ため（下記「回転」）。Box では作れない幅 ≠ 高さの楕円を持つ Ellipse と対になる個別の判断

### 配置の指定

すべてのノードが、親の中でどう置かれるかを 5 prop で持つ。サイズ指定と同じく**モード（enum）と値（number）を分離**する。

| prop | ドメイン | 値 | デフォルト |
|---|---|---|---|
| `placement` | enum | `flow` / `absolute` | `flow` |
| `x` | 生リテラル (number, px) | 親の左辺からの距離。`placement: absolute` 時のみ有効 | `0` |
| `y` | 生リテラル (number, px) | 親の上辺からの距離。`placement: absolute` 時のみ有効 | `0` |
| `constraintX` | enum | 横方向の追従（下記）。`placement: absolute` 時のみ有効 | `min` |
| `constraintY` | enum | 縦方向の追従（下記）。`placement: absolute` 時のみ有効 | `min` |

- `placement: absolute` のノードはフローから外れるため、`widthMode` / `heightMode` の `fill` は効かない（宣言を出力しない）
- 座標は**親からの相対**。ノードが無限キャンバス上の絶対座標を持つことはない（02-data-model「基本原則」）。**同じ綴りの `x` / `y` が artboard 自身にもある**が、そちらはキャンバス上の絶対位置で別のもの（01-file-format「artboards」）
- prop 名を CSS の `position` に揃えないのは、この仕様が既に「どの親の何番目の子か」の意味で位置の語を使っているため。CSS の綴りとの対応はコンパイル規則が持つ（`widthMode` → `width` と同じ）
- artboard は Box スキーマを流用するが、**この 5 prop は受け付けない**。artboard は親 Box を持たないので、親からの相対で置かれるこの 5 prop では位置も追従も決まらないため（キャンバス上の位置は artboard 自身の `x` / `y` が持つ）

#### 親のリサイズへの追従（`constraintX` / `constraintY`）

**親（artboard / Box）の長さを変える編集をしたとき、絶対配置の子の座標と長さを書き換える。** 1 軸ぶんの規則は次の通り（`P` は変更前の親の長さ、`P'` は変更後）。

| 値 | 位置 | 長さ |
|---|---|---|
| `min` | 変えない | 変えない |
| `max` | `x + (P' - P)`（終端からの距離を保つ） | 変えない |
| `center` | `x + (P' - P) / 2`（中心からのずれを保つ） | 変えない |
| `stretch` | 変えない | `width + (P' - P)`（両端からの距離を保つ） |
| `scale` | `x * P' / P` | `width * P' / P` |

- **長さを書き換えるのは、その軸のモードが `fixed` のときだけ。** `hug` / `fill` の子には書ける長さが無いので位置だけが追従する（Text は長さの prop を持たないので、`stretch` / `scale` でも位置だけが動く）
- **親の長さが変更の前後どちらかで決まらないとき（親が `hug` / `fill`）は追従しない。** 差分も倍率も出せないため（`width` を消して `hug` へ戻す編集も、変更後が決まらないので追従しない）
- **`P` が 0 のときは `scale` の倍率が決まらないので追従しない**
- 追従で長さが変わった子は、その子の絶対配置の子も追従する（親のサイズが変わったことに変わりはないため）
- **これは編集時の規則で、コンパイル結果には出ない。** ファイルに載るのは追従後の `x` / `y` / `width` / `height` そのもので、CSS は下の表のとおり `left` / `top` を出すだけ（親のリサイズのたびに全体をコンパイルし直すので、CSS 側で追従を表現しても同じ `x` から作り直されて `min` と区別が付かない）

### 表示 / 非表示

すべてのノードが、描かれるかどうかを 1 prop で持つ。Figma のレイヤーごとの表示 / 非表示にあたる。

| prop | ドメイン | 値 | デフォルト |
|---|---|---|---|
| `visibility` | enum | `visible` / `hidden` | `visible` |

- **非表示のノードは並びからも外れる。** 隠した子の分の隙間は残らないので、コンパイル規則は場所を残す CSS の `visibility: hidden` ではなく `display: none` を出す（下記「HTML/CSS へのコンパイル規則」）
- 非表示にしても子は消えない。親を非表示にすれば子孫もまとめて描かれなくなる
- artboard は Box スキーマを流用するが、**この prop は受け付けない**。artboard を隠すとは、要素の外側にキャンバスが描く見出しとリサイズハンドル（06-ui「キャンバス直接操作」）ごと隠すことで、それを出すかどうかは**まだ決めていない**。決まるまでは書けても効かない状態を作らず、受け付けない側に倒す

### 不透明度

Box と Ellipse が、透け具合を 1 prop で持つ（Text は持たない）。

| prop | ドメイン | 値 | デフォルト |
|---|---|---|---|
| `opacity` | 生リテラル (number, 0〜1) | 0 が完全に透明、1 が不透明 | `1` |

- **見た目の値だが生リテラルにする。** 対応するトークン種別が無く（04-tokens の 5 種）、種別を増やすかはこの prop だけの判断にできないため（02-data-model「値のドメイン: 3種類」）
- **トークンが持つ色の不透明度（`#rrggbbaa` の alpha。トークン編集では 0〜100 の % で出す）とは別の値。** こちらはノードの prop としてファイルに載る値なので、CSS の `opacity` と同じ 0〜1 で持つ
- 取りうる範囲は `range` で宣言し、外れた値はバリデーションエラーにする（下記「バリデーション仕様」）
- artboard は Box スキーマを流用するので**この prop を受け付ける**（受け付けないと決めた「配置の指定」の 5 prop・「表示 / 非表示」と違い、除く理由が無い）

### 回転

すべてのノードが、自分がどれだけ回るかを 1 prop で持つ。Figma の `relativeTransform` が含む回転にあたる。

| prop | ドメイン | 値 | デフォルト |
|---|---|---|---|
| `rotation` | 生リテラル (number, 度) | 時計回りの角度。中心を軸に回る | `0` |

- **`placement` に依らず効く。** フローの子に書いた座標は読み捨てられる（上記「配置の指定」）が、回転は並びの中の子でも効くので、絶対配置の子だけが持つ形にはしない
- **回転はノードの占める領域を変えない。** 並びの中での場所も、親の `hug` が決める長さも、回る前の矩形のまま決まる（CSS の `transform` がレイアウトに影響しないのと同じ）
- **取りうる範囲は宣言しない。** 1 周を超える角度も「1 周と◯度」として意味が決まるため（上記「prop 定義のフィールド」の `range` は宣言しない prop を範囲では弾かない）
- **見た目の値ではなく構造値なので生リテラルでよい**（02-data-model「値のドメイン: 3種類」）。対応するトークン種別が無いのは `opacity` と同じだが、こちらは幅・高さと同じ幾何の値
- artboard は Box スキーマを流用するが、**この prop は受け付けない**。枠の見出しとリサイズハンドルは枠の外側に描かれる（06-ui「キャンバス直接操作」）ので、枠だけが回るとそれらとずれる。`opacity` を受け付けるのと違うのは、回転が幾何を動かすため

### サイズ指定の原則

- Figma の Hug / Fill / 固定値 に相当するサイズ指定は、**モード（enum）と値（number）の2 prop に分離**する
- `width` / `height` は `widthMode` / `heightMode` が `fixed` のときのみ有効（`enabledWhen`）
- **`widthMode` / `heightMode` の `fill` は、`layout` が `row` / `column` の親の子にだけ書ける。** `free` の親の子に書いたものはバリデーションエラー（下記「バリデーション仕様」）。親の prop を見る条件なので `enabledWhen` では表せない
- **モードとして `hug` を持つかはプリミティブごとに違う。** 子を持たないプリミティブは中身から決まる長さが無いので `hug` を持たない

### Box

コンテナ。レイアウトと装飾を1本で担う。Figma の Frame + Auto Layout 相当。子を持てる。

| prop | ドメイン | 値 | デフォルト |
|---|---|---|---|
| `placement` / `x` / `y` / `constraintX` / `constraintY` | | 上記「配置の指定」 | |
| `rotation` | | 上記「回転」 | |
| `layout` | enum | `row` / `column` / `free` | `column` |
| `wrap` | enum | `nowrap` / `wrap`。`layout` が `free` 以外のときのみ有効 | `nowrap` |
| `gap` | トークン (spacing) | `layout` が `free` 以外のときのみ有効 | なし (0) |
| `paddingTop` | トークン (spacing) | 上 | なし (0) |
| `paddingRight` | トークン (spacing) | 右 | なし (0) |
| `paddingBottom` | トークン (spacing) | 下 | なし (0) |
| `paddingLeft` | トークン (spacing) | 左 | なし (0) |
| `align` | enum | `start` / `center` / `end` / `stretch`。`layout` が `free` 以外のときのみ有効 | `stretch` |
| `justify` | enum | `start` / `center` / `end` / `space-between`。`layout` が `free` 以外のときのみ有効 | `start` |
| `widthMode` | enum | `hug` / `fill` / `fixed` | `hug` |
| `width` | 生リテラル (number, px) | `widthMode: fixed` 時のみ有効 | - |
| `heightMode` | enum | `hug` / `fill` / `fixed` | `hug` |
| `height` | 生リテラル (number, px) | `heightMode: fixed` 時のみ有効 | - |
| `background` | トークン (colors) | | なし (透明) |
| `radiusTopLeft` | トークン (radius) | 左上 | なし (0) |
| `radiusTopRight` | トークン (radius) | 右上 | なし (0) |
| `radiusBottomRight` | トークン (radius) | 右下 | なし (0) |
| `radiusBottomLeft` | トークン (radius) | 左下 | なし (0) |
| `shadow` | トークン (shadows) | | なし |
| `overflow` | enum | `visible` / `clip` | `visible` |
| `opacity` | | 上記「不透明度」 | |
| `visibility` | | 上記「表示 / 非表示」 | |

- `layout: free` の Box は**子を並べない**。Figma の `layoutMode: NONE` にあたり、中身は `placement: absolute` の子を座標で置くための器になる。間隔・揃え・折り返し（`gap` / `align` / `justify` / `wrap`）は並びが無いので効かない
- padding は 4 方向個別、角丸は 4 隅個別。ドキュメントが持つのは 4 つの値だけで、プロパティパネルでの畳み方（padding は Figma と同じ垂直 / 水平、角丸は 4 隅まとめて 1 欄）は表示の都合なので持たない
  - ただし**「その prop がどの shorthand のどの位置の longhand か」はスキーマが `shorthand` で宣言する**。これは prop 自身の性質（`paddingTop` は padding の上辺、`radiusTopLeft` は radius の左上である）であって、今そのパネルが畳んでいるかという画面の状態ではない。パネルはこの宣言を使って 4 prop を 1 行にまとめ、畳むかどうかは画面側だけで決める
  - **畳んだ欄の単位が padding と角丸で違う**のは、`border-radius` の 2 値が対角（左上 + 右下 / 右上 + 左下）を指し、垂直 / 水平にあたる組が隅には無いため
- border 系は初期セットに含めない（スキーマへの追加で対応可能）
- artboard は Box スキーマを流用するが、`widthMode` / `heightMode` は `fixed` に固定され、`width` / `height` が必須、`overflow` のデフォルトは `clip`

### Text

テキスト葉ノード。子を持たない。

| prop | ドメイン | 値 | デフォルト |
|---|---|---|---|
| `placement` / `x` / `y` / `constraintX` / `constraintY` | | 上記「配置の指定」 | |
| `rotation` | | 上記「回転」 | |
| `content` | 生リテラル (string) | | `""` |
| `typography` | トークン (typography) | サイズ・行間・ウェイトの複合トークン | デフォルトトークン |
| `color` | トークン (colors) | | デフォルトトークン |
| `align` | enum | `left` / `center` / `right` | `left` |
| `visibility` | | 上記「表示 / 非表示」 | |

- typography は複合トークン（04-tokens で定義）。fontSize / fontWeight を個別 prop にはしない

### Ellipse

楕円。子を持たない。**円は幅 = 高さの楕円**として表す（Figma と同じ持ち方）。

| prop | ドメイン | 値 | デフォルト |
|---|---|---|---|
| `placement` / `x` / `y` / `constraintX` / `constraintY` | | 上記「配置の指定」 | |
| `rotation` | | 上記「回転」 | |
| `widthMode` | enum | `fill` / `fixed` | `fixed` |
| `width` | 生リテラル (number, px) | `widthMode: fixed` 時のみ有効 | `100` |
| `heightMode` | enum | `fill` / `fixed` | `fixed` |
| `height` | 生リテラル (number, px) | `heightMode: fixed` 時のみ有効 | `100` |
| `background` | トークン (colors) | | `gray-300` |
| `shadow` | トークン (shadows) | | なし |
| `opacity` | | 上記「不透明度」 | |
| `visibility` | | 上記「表示 / 非表示」 | |

- **`hug` を持たないのが Box との差**（上記「サイズ指定の原則」）。子を持たないので中身から決まる長さが無く、`hug` は常に 0 になる
- **角丸の prop を持たない。** 楕円の丸みは形そのものであって設定値ではない。持たせると「楕円なのに角丸 4px」という、形と設定値が食い違う組み合わせが書けてしまう
- **`layout` / `wrap` / `gap` / padding 4 辺 / `align` / `justify` / `overflow` を持たない。** 子を持たないので、並べる対象も切り取る対象も無い
- **`background` の既定だけ Box と違う**（Box は「なし（透明）」）。Box は中身を入れる器なので透明が既定でよいが、Ellipse は形そのものなので、既定で塗りが無いと挿入しても画面に何も出ない。既定がトークン名を指すのは Text の `typography` / `color` と同じで、その名前は初期テンプレートが保証する（04-tokens「スキーマデフォルトとの関係」）
- **`width` / `height` の既定 `100` は、Figma が楕円を作るときの既定（幅・高さとも 100）に揃えた。** 型でもテストでも守れない値なので、変えるときはこの行ごと変える
- **どの版から読み書きできるかは 01-file-format「formatVersion」の表が持つ。** 新プリミティブは minor の追加的変更にあたるが、アプリが Ellipse を読み書きできるようになった時点で表へ足す（まだ足していない）
- 弧・ドーナツ（開始角・終了角・内側の半径）は初期セットに含めない（スキーマへの追加で対応可能）

## HTML/CSS へのコンパイル規則

- **トークンは CSS カスタムプロパティにコンパイル**する。ルート要素に `--{種別}-{名前}: 値` を出力し、ノード側は `var()` で参照する。トークン編集が全ノードへ CSS レベルで波及する
- **ノードはすべて `div` ＋インライン style** で出力する。プレビュー用レンダリングであり production HTML ではないため、セマンティクス・クラス設計は持たない。決定的で診断しやすい出力を優先する

| prop | CSS |
|---|---|
| Box 自体 | `div` + `position: relative`（絶対配置の子が位置を測る基準になるため。offset を伴わないので箱の位置は動かない。次の行と排他で、`placement: absolute` の Box では `absolute` に置き換わる）。`display: flex` は下の `layout` の行が決める（`visibility` の行が優先する） |
| `placement: absolute` | `position: absolute` + `left: {x}px` + `top: {y}px` |
| `rotation` | `transform: rotate({n}deg)`（既定の `0` では出力しない。`rotate(0deg)` でも `transform` が `none` でなくなり、そのノードが新しい stacking context になるため） |
| `layout: row` / `column` | `display: flex` + `flex-direction` |
| `layout: free` | `display` を出さない（flex コンテナにしない）。`wrap` / `gap` / `align` / `justify` も出さない（`visibility` の行が優先する） |
| `wrap: wrap` | `flex-wrap: wrap`（既定の `nowrap` では出力しない） |
| `gap` | `gap: var(--spacing-*)` |
| `paddingTop` / `paddingRight` / `paddingBottom` / `paddingLeft` | `padding: var(--spacing-*)` （上 右 下 左 の順で4値に合成。未指定の辺は `0`） |
| `align` | `align-items` |
| `justify` | `justify-content` |
| `widthMode: hug` | `width: fit-content` |
| `widthMode: fill` | 親の主軸方向なら `flex-grow: 1`、交差軸方向なら `align-self: stretch`（親の `layout` を見て出し分け） |
| `widthMode: fixed` | `width: {n}px` |
| `background` | `background: var(--colors-*)` |
| `radiusTopLeft` / `radiusTopRight` / `radiusBottomRight` / `radiusBottomLeft` | `border-radius: var(--radius-*)` （左上 右上 右下 左下 の順で4値に合成。未指定の隅は `0`） |
| `shadow` | `box-shadow: var(--shadows-*)` |
| `overflow: clip` | `overflow: hidden` |
| `opacity` | `opacity: {n}`（既定の `1` では出力しない。範囲を外れた値も丸めずそのまま出す — 範囲の判定はバリデーションが持ち、ブラウザが両端へ寄せる） |
| Text 自体 | `div` + typography トークン展開（`font-size` / `line-height` / `font-weight`） |
| Text `color` / `align` | `color` / `text-align` |
| Ellipse 自体 | `div` + `border-radius: 50%`（丸みは形そのものなので prop では持たず、この行が固定で出す） |
| `visibility: hidden` | `display: none`（既定の `visible` では出力しない。`layout` の行が出す `display` より優先する）。理由は上記「表示 / 非表示」 |

- height 系は width 系と同じ規則を縦軸に適用する
- **子を持たないプリミティブ（Text / Ellipse）は `position` を出さない。** 絶対配置の子が位置を測る基準にならないため（`Box 自体` の行が `position: relative` を出すのと対になる）。`placement: absolute` の行はどのノードにも効く
- **Ellipse も `div` で出す。** SVG の `<ellipse>` にはしない。上記のとおりノードはすべて `div` ＋インライン style で出すので、1 つだけ別の要素にすると出力の形が 2 通りになる
- `widthMode: fill` の出し分けだけが親コンテキストに依存するコンパイル。ただし親を見るのは**そのノードがフローに参加しているとき**に限る（`placement: absolute` のノードは flex アイテムではないので `fill` の宣言を出さない）。親が `layout: free` のときも同じく宣言を出さない（並ぶ向きが無い）

## バリデーション仕様

以下をすべて**エラー**として検出する。警告という中間区分は設けない。

- JSON としてパース不能
- オブジェクトキーの重複（パース前の字句スキャン。01-file-format 参照）
- 未知の `type` / 未知の prop
- ドメイン違反（enum 外の値・literalType 不一致・`range` を宣言した prop の範囲外・存在しないトークン名への参照）
- dangling ref（存在しない部品名への参照）
- **部品の循環参照**（ref の展開が自分自身に到達する）
- **子を並べない親の下の `fill`**（`layout: free` の親の子に `widthMode` / `heightMode` の `fill` を書いている）
- overrides の未宣言キー（部品の publicProps 宣言に無い名前の上書き）
- binding の不整合（存在しない内部ノード名 / 存在しない prop への binding、ドメイン違反の上書き値）
- 識別子規則違反（命名規則・予約文字）
- ノードの `name` 欠落
- 名前の一意性違反（components キー・artboard 名・全ノード name の単一名前空間内での重複）

### 不正ファイル時の挙動

- **最後に正常だった状態のレンダリングを保持し、エラー一覧を重ねて表示する**
- AI がファイルを直接編集 → アプリが検知 → リロード、というワークフローにおいて、不正な中間状態で画面が失われないことを優先する

これは**開いている最中**に外部変更で不正になった場合の規定で、「最後に正常だった状態」が存在することを前提にしている。

#### 開く時

開く時点には「最後に正常だった状態」が存在しないため、上の規定は適用できない。代わりに**ドキュメントとして組み立てられたか**で分ける。

| 検出した不正 | 開くか |
|---|---|
| JSON としてパース不能 / オブジェクトキーの重複 / 版を解決できない / 構造がスキーマの形に合わない | **開けない**。エラー一覧だけを開始画面に出す |
| 上記を通ったうえでのバリデーション違反（未知の `type` / 未知の prop / ドメイン違反 / dangling ref / 循環参照 / 未宣言の overrides / binding の不整合 / 識別子規則違反 / `name` 欠落 / 名前の一意性違反） | **開く**。エラー一覧を重ねて表示し、編集は続けられる |

- 開けるようにするのは、**自動保存が書き出した不正なドキュメントを GUI から直せるようにする**ため。保存モデル（05-architecture「保存モデル: 自動保存」）は画面の内容をそのまま書き出すので、アプリ内の編集で作った不正はファイルにも載る。これを開けないままにすると、直す手段が外部エディタにしか無くなる
- 開いたあとの扱いはアプリ内の編集で作った不正と同じ（キャンバスは凍らせない）
- 循環参照など**描画そのものが成立しない**不正では、キャンバスにコンパイルの失敗が出る。この場合もツリー・プロパティパネル・エラー一覧は動くので、GUI から直せる
