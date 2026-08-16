# 命名規約

## 名前と実体を一致させる

**名前が約束することと、実際にやること・返すものを一致させる。** 名前を読んで想像した挙動と実装がずれていたら、名前が間違っている。

- **戻り値を名前に出す。** エラーの配列を返すだけの関数を `validate*` と名付けない(「検証して成否を返す」「不正なら例外を投げる」と読める)。集めて返すなら `collect*Errors`
- 探索していない関数に `find*` / `locate*` を使わない。位置情報を付与するだけの関数は `withLocation`
- 公開APIも同じ基準で名付ける。「仕様書の語彙だから」を理由に、戻り値と食い違う名前を入口だけ残さない
- 1つのモジュール内で語彙を混在させない。`collect*Errors` と `validate*` が同じファイルに同居している状態にしない(内部だけ直して公開APIを残すと混在が復活する)

| NG | OK | 理由 |
|---|---|---|
| `validateNode(node)` | `collectNodeErrors(node)` | エラー配列を返すだけで、検証の成否は返さない |
| `locate(location, errors)` | `withLocation(location, errors)` | 何も探していない。位置を付与している |
| `PropDefinition.validate` | `PropDefinition.collectErrors` | 同上(公開APIも例外にしない) |

## `And` を含む名前を作らない

`doAAndB` のような名前は、その関数が2つの振る舞いを持っている証拠。**名前を工夫して押し込めるのではなく、処理を分ける。** 分けられないなら、2つをまとめて表す1つの概念名を見つける(見つからないなら、やはり分けるべき処理)。

## 条件を組んだ式に名前を付ける

`&&` / `||` で2つ以上の条件を組んだ式を、`if` や JSX の中へそのまま置かない。**何を判定しているのかを表す名前の変数に入れてから使う。** 読み手は式を目で分解するまで、その分岐が何のためのものかを知れない。

| NG | OK |
|---|---|
| `{hasChildren && isExpanded ? <NodeList /> : null}` | `const showsChildren = hasChildren && isExpanded;` を経由する |
| `if (key === e.key && ctrl === e.ctrlKey && shift === e.shiftKey)` | 条件ごとに変数へ分け、最後に連言にする |

- **条件が2つ以上要る理由がコードから読み取れないなら、変数のそばにコメントで残す。** 「子を持たない行は畳めないので `isExpanded` が常に true になり、それだけでは空の `<ul>` が出る」のように、片方を削れない理由を書く
- 名前が付けられないのは、その分岐で何をしたいのかが決まっていないサイン。条件を組み直す
- 単独の条件(`isEmpty` / `list.length === 0` など)はそのまま置いてよい。名前を増やすことが目的ではない

## 内容を表さない汎用語を使わない

`Entry` / `Info` / `Data` / `Detail` / `Manager` / `Helper` のような語は、何を指すのかを伝えない。ドメインの語彙で名付ける。

- **名前が思いつかないのは、その型が2つの役割を抱き合わせているサイン**であることが多い。改名で解決しようとする前に役割を分けられないか確認する(分けた結果その型自体が不要になることもある)
- 例: 「名前空間の構成要素」と「エラー報告用の位置」を1つの型に持たせていたため名前が付かなかった → 役割を分けたら型が不要になった

## 定数は PascalCase

**`const` の名前に SCREAMING_SNAKE_CASE を使わない。** オブジェクト・配列・スカラーのどれでも、また export の有無にもよらず PascalCase で書く。**コンパニオンオブジェクトのメンバー**(`DocumentTemplate.Default` / `DocumentSaveState.Saved`)も、値がオブジェクトでも同じ。コンパニオンのメンバーは公開 API としてメソッドと並ぶので、`Hoge.method()` と `Hoge.Member` で流儀を割らないため。

| NG | OK |
|---|---|
| `const AUTO_SAVE_DEBOUNCE_MS = 500;` | `const AutoSaveDebounceMs = 500;` |
| `DocumentTemplate.DEFAULT` | `DocumentTemplate.Default` |

### 対応表のキーを PascalCase にするのは「キーが値の別名」のときだけ

ここで言うプロパティは、**データを引くための定数オブジェクト**のキーを指す(コンパニオンオブジェクトのメンバーは前節のとおり常に PascalCase)。

**キーが値の別名になっている定数**(`Axes` / `LeftPaneViews` / `DocumentErrorOrigins`)は、キーも PascalCase にする。値を名前で指すためだけの定数なので、キーは値の綴り違いでしかない。

```typescript
// OK: キーは値の別名なので PascalCase にする
export const Axes = { Width: "width", Height: "height" } as const;
```

**それ以外はキーを据え置く。** キーが「何かを引くための見出し」になっているものは、キーの綴りが別の都合で決まっている。

| キーが何か | 例 | 据え置く理由 |
|---|---|---|
| union の値を引く見出し | `LeftPaneViewLabels[view]` / `KindLabels` | 引くたびに実行時の capitalize が要る |
| 外部フォーマットのキー | `BoxSchema.props.direction` | `docs/01-file-format.md` の JSON キーそのもの |
| 型が決めているキー | `PanelBounds.left` / `Padding.x` | 型のフィールド名なので、綴りを選ぶ余地が無い |
| 表示文字列・フィクスチャの見出し | `Labels.instance` / `SaveStates.saved` | 値が別のもの(表示文字列・オブジェクト)で、キーの語彙ではない |

判断の仕方: **その値は語彙そのものか、別のものか。** 値が id や union の値そのもの(`Axes` の `"width"`、`DocumentErrorOrigins` の `"unopened-file"`)ならキーは値の別名なので PascalCase。値が表示文字列・オブジェクト・クラス名など**別のもの**なら、たまたま綴りが一致していても(`LeftPaneViewLabels.layers` は `"Layers"`)見出しなので据え置く。

「キーを値へ置き換えても意味が変わらないか」で判断しない。`LeftPaneViewLabels` のようにキーと値が大小文字しか違わない対応表で、逆の答えが出る。

## ファイル名

- **ファイル名を関数名にしない。** ファイルはモジュールであり、その中の1関数の名前ではない(`resolve-prop-definition.ts` のような名前は付けない)。分割するときはモジュールとして意味のある名前を付ける
- **React の API 名をモジュール名にしない。** `useReducer` を使っているから `use-editor-reducer`、`useContext` を使っているから `use-xxx-context` のような名前は、**何を持っているか**ではなく**何で実装したか**を指している。器を差し替えたら名前が嘘になる。フックは**返すもの**で名付ける(状態を持つなら `use-editor-state`)
- テストファイル名は関数名ではなく**観点のラベル**にする(`rules/testing.md` の命名規則に従う)
- `src/domains/` `src/services/` `features/` のモジュールフォルダはケバブケース + `index.ts`
- `src/utils/` はフラットな PascalCase 1ファイル(`ArrayEx.ts` / `Result.ts` / `Font.ts`)

## メソッド名を既存のドメインに揃える

コンパニオンオブジェクトのメソッド名は、既にあるドメインオブジェクトの語彙に合わせる。同じ意味の操作に別の名前を与えない。

- **値を組み立てるのは `create`。** 引数から新しい値を作る入口はこれに揃える(`Artboard.create` / `NodeTree.create` / `EditorState.create`)
- **別の表現から作り直すのは `from*`。** 変換元を名前に出す(`Component.fromNode` / `DocumentReload.fromContent` / `Selection.fromArtboard`)。`create` と使い分ける基準は「引数がその値の材料か(`create`)、別の形で同じものを表しているか(`from*`)」
- **`of*` は使わない。** `create` / `from*` のどちらかに寄せる
- 判定は `is*` / `has*`、変換は `to*` / `*Value`、収集は `collect*`

## `utils/` のメソッドは動詞で始める

`src/utils/` の `<型名>Ex`(`ArrayEx` / `SetEx` / `StringEx` / `NumberEx`)は、**組み込み型への操作**を集めた場所。メソッド名は**動詞、または結果そのものを表す語**で始め、`with*` の過去分詞にしない。

- 既存の語形: `first` / `last` / `dropFirst` / `dropLast` / `distinct` / `insertAt` / `replaceAt` / `moveWithin` / `toggle` / `isNatural`
- **`with*` はドメイン側の語彙。** 「その値を持つ新しい値」を返すコンパニオンオブジェクトのメソッド(`ColorToken.withRgb` / `withLocation`)に使う。`utils/` へ持ち込むと、同じ層の中で語形が 2 通りに割れる
- 条件付きの操作は、条件を名前に出す(`prependIfAbsent`)。`*Distinct` のように**結果の性質**で名付けると、その性質を保証していない実装と食い違う

| NG | OK | 理由 |
|---|---|---|
| `ArrayEx.withPrepended(array, item)` | `ArrayEx.prependIfAbsent(array, item)` | `ArrayEx` に `with*` は 1 つも無く、語形が浮く。「含まれていなければ先頭へ足す」という実体も名前に出ていない |
| `ArrayEx.prependDistinct(array, item)` | 同上 | 「重複を取り除いて足す」と読めるが、元の並びにある重複は畳まない |
