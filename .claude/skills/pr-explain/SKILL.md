---
name: pr-explain
description: "PR ごとの解説ページ(構造マップ・変更の経緯・テストの 3 画面)の材料になる解説 explain.json を書き、検査して gh-pages の pr-explain/pr-<番号>/ へ置く。implementation-flow のフェーズ 7 で PR を出した直後と、振る舞いが変わる push の後に使用する。「PR の解説を書いて」「解説ページを更新して」といった依頼でも使用する。変更の地図(変更ファイル・依存・テスト名の増減・コミットと差分)とページの枠は Actions が置くので書かない。"
---

# PR の解説ページ

レビュアー(人間)が PR を開いたときに、**この PR がどこをどうつなぎ替えたか・どの順で何を変えたか・
テストが何を守っているか**を読めるようにする。diff と Issue だけでは、長いセッションで何を使い、
なぜその形にしたかが掴みにくいため。

## 3 画面と材料

ページは 1 枚で、`#map` / `#story` / `#test` で画面を切り替える。どの画面も、Actions が git の差分から
作る**変更の地図**(`change-map.json`)と、セッションが書く**解説**(`explain.json`)を合わせて組む。

| 画面 | 見るもの | 地図から | 解説から |
| --- | --- | --- | --- |
| 構造マップ(`#map`) | 左に変更ファイルと concepts の木。中に、それを層(または機能)ごとの組にまとめた箱の図と、やりとり(または依存)の線。組は抽象度で畳む・開く。右に概要(highlights・組ごとの変更・やりとり一覧)か、選んだ箱・線・やりとりの詳細(要するに・受け取るもの / 送り出すもの・使っている / 使われている)と、やりとりの流れ(シーケンス図) | `groups`・`dependencies` | `overview.highlights`・`features`・`layerRoles`・`concepts`・`messages`・`flows` |
| 変更の経緯(`#story`) | コミットを新しい順に並べた一覧と、ブランチ全体の流れ(題・要約・これまで / このあと・変更の順番・レビューポイント)、コミットごとの説明(なぜ・影響する操作・レビューで見るところ・振る舞いの前後)と差分・行への注釈 | `commits`(件名・本文・作者・日時・ファイルごとの差分) | `overview`・`commitStories`(操作の名前は `flows`、ファイルの呼び名は `concepts`) |
| テスト(`#test`) | suite ごとのテストの一覧と、構造マップと同じ組・箱の図の上で、テストが確かめている箱・やりとりと、その抜け。テストごとの前提 / 操作 / 期待・値の表・確かめているやりとり・テストコード・追加したコミット | `tests.added` / `tests.removed`・テスト名を調べたファイル(`tests.files`)・テストファイルの対象(`target`) | `suites`・`tests`(線は `messages`。無ければ依存) |

画面をまたいで移れる。変更の経緯の「影響する操作」を押すと構造マップでその流れを選んだ状態に、テストの
「追加したコミット」を押すと変更の経緯でそのコミットを開いた状態になる。

gh-pages の `pr-explain/pr-<番号>/` に置くのは次の 3 つだけ。

| ファイル | 置くもの | いつ |
| --- | --- | --- |
| `index.html` | ページの枠(`templates/index.html`) | Actions が push のたびに置き直す |
| `change-map.json` | 変更の地図 | Actions が push のたびに置き直す |
| `explain.json` | 解説 | セッションが `put-explain` で置く |

URL は `https://dio0550.github.io/design-composer/pr-explain/pr-<番号>/`。Storybook プレビューの固定
コメントに載るので、別にコメントしない。**解説は PR ブランチにも main にも入れない**(main に溜まり、
Files changed にも混ざるため)。

## いつ書くか

- **PR を出した直後**(`implementation-flow` フェーズ 7)
- **振る舞いが変わる push をした後**。format・コメントだけの push では書き直さない(ページが
  「解説は ◯ 時点、以降 n コミットは解説なし」と出すので、読み手が判断できる)
- **PR を reopen した後**(閉じたときに Actions がフォルダごと消している)

## 手順

1. **材料を集める**
   - Issue: ゴール・計画・却下した案・計画から外れた点(`implementation-flow` が書いている)
   - 地図: ページと同じものを手元で出せる。コミットの sha・層の名前(`groups[].label`)・パスはここから取る

     ```bash
     python3 .github/scripts/build-pr-change-map.py --base origin/main --head HEAD --pr <番号> --head-branch "$(git branch --show-current)" --base-branch main
     ```

   - 検証エージェントの指摘: とくに `test-reviewer` の「壊して落ちた / 落ちなかった判断」はテストの材料
   - このセッションの記憶: Issue に書くほどではなかった判断・試して捨てた形
2. **見本 [`templates/explain.json`](templates/explain.json) をリポジトリの外の作業用ファイルへ写して
   書く**(`mktemp -d` など)。見本は `excerpt` 以外のすべてのキーと、Target の 5 つの kind を使って
   いる。要らない任意のキーは消す
3. **下の「explain.json の形」と「書き方」で書く**
4. **事実の主張を確かめる。** 解説は「この関数は◯◯を返す」「この操作で□□になる」の集まりなので、
   `claim-verification` スキル(管轄はフェーズ 3 / 5)の手順をここでも使う。Note の行番号は、その
   コミット時点のファイルを開いて合わせる
5. **置く**

   ```bash
   bash .github/scripts/pr-explain-pages.sh put-explain <PR 番号> <書いた explain.json>
   ```

   - push の前に `build-pr-explain.py` が検査し、テストの抜粋(`excerpt`)に中身(`text`)を足す。
     落ちたら報告を読んで直す(報告の分類は `build-pr-explain.py` の冒頭)
   - 解説の `sha` は push してから置く。リモートの追跡ブランチに無い sha の解説は置かない
   - 終了コードの意味は `pr-explain-pages.sh` の冒頭。**3** なら `PR Explain` の run の完了を待って
     からやり直す。閉じた PR には置かない
   - 解説の `sha` が地図の head と違えば、置いたうえで標準エラーに知らせる。push の直後で run が
     終わっていないだけなら置き直さなくてよい(run が終われば地図の head と揃う)
   - **gh-pages へ push してよいのは、このスクリプトで `pr-explain/pr-<番号>/` へ置くときだけ。**
     他のフォルダ・他のブランチは触らない
6. **URL をユーザーに伝える**

## explain.json の形

**共通の規則**

- 文字列は空にしない。説明文(`title`・`lead`・`text`・`why`・`given` / `when` / `then` など)の中の
  `` `…` `` は、ページがコードとして描く。名前(`name`・`label`)と `code` は書いたまま出す。HTML は
  書いても文字のまま出る
- **見出しは概念の名前(docs の語彙)で書く。** 見出しは図・一覧の見出しになる文字列で、検査の対象は
  `build-pr-explain.py` の `Heading` を使うキー(名前のうち `tests[].name` を除いたものと、highlights の
  `title`)。小文字と大文字の継ぎ目がある複合語(docs に出る語を除く)があれば落ちる。大文字だけの略語
  (UI 案・VRT)はこのリポジトリの語彙なので書いてよい。1 語の識別子(`Result`・`Token`)・ファイル名・
  snake_case は検査しないが、見出しには書かない。理由は `build-pr-explain.py` の冒頭
- id は `^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$`、sha は小文字 40 桁
- 知らないキーと重複したキーは、入れ子を含めて落ちる
- 任意の配列は、省けば `[]` と同じ

**トップ**

| キー | 必須 | 意味 |
| --- | --- | --- |
| `version` | 必須 | `1` |
| `pr` | 必須 | 公開先の PR 番号 |
| `sha` | 必須 | 解説を書いた時点の head(`git rev-parse HEAD`。push 済みのもの)。抜粋はここから読む |
| `issue` | 任意 | 材料の Issue 番号 |
| `overview` | 必須 | Overview |
| `features` | 任意 | Feature[]。空ならページは「機能」でまとめられない(層だけ) |
| `layerRoles` / `concepts` / `messages` / `flows` / `commitStories` / `suites` / `tests` | 任意 | 下の型の配列 |

**型**(`?` は任意)

| 型 | キー |
| --- | --- |
| Overview | `title` `lead` `before: Behavior[]`(0 件でよい)`after: Behavior[]`(1 件以上)`highlights?: Highlight[]` |
| Behavior | `text` `message?`(messages の id) |
| Highlight | `title` `text` `go: Target`(押したときに移る先) |
| Target | `{kind: "feature", id}` / `{kind: "layer", layer}`(地図の `groups[].label` と同じ綴り)/ `{kind: "file", path}` / `{kind: "message", id}` / `{kind: "flow", id}`。kind ごとのキーが欠けるのも、他の kind のキーが混ざるのも不可 |
| Feature | `id` `label` `role` |
| LayerRole | `layer`(一意。地図の `groups[].label`)`role` |
| Concept | `path`(一意)`name` `role` `feature?`(features の id)`change?` `graph?`(既定 true) |
| Message | `id` `from` `to`(concepts の path)`kind`: `cmd` \| `qry` \| `evt` `name` `code` `via`: `call` \| `http` \| `state` \| `log` \| `exec` \| `file` `payload?` `returns?` `status?`: `added` \| `changed` \| `removed`(省けば前からあって変えていない) |
| Flow | `id` `label` `steps[]`(messages の id。1 件以上) |
| CommitStory | `sha`(一意)`phase`: `prep` \| `core` \| `hard` \| `revise` \| `fin` `role` `why` `flows?`(flows の id)`review?: string[]` `before?: Behavior[]` `after?: Behavior[]` `notes?: Note[]` |
| Note | `path` `side?`: `new` \| `old`(既定 new)`start`(1 以上)`end`(start 以上)`text`。行番号はそのコミット時点 |
| Suite | `id` `label` `file` |
| Test | `id` `suite`(suites の id)`name` `techniques[]`: `boundary` \| `equivalence` \| `error` \| `state` \| `regression` \| `idempotence` \| `type`(1 件以上・重複なし)`why` `given` `when` `then` `todo?: true` `commit?`(sha)`excerpt?: Excerpt` `values?: Values` `targets?`(concepts の path)`covers?`(messages の id) |
| Excerpt | `path` `start` `end`(80 行まで)。`text` は検査が足す出力だけのキーで、入力に書くと落ちる |
| Values | `columns[]`(1 件以上)`rows[{cells[](列と同数), boundary?}]` |

id・sha・path・layer は一覧の中で一意にする(features / messages / flows / suites / tests の id、
commitStories の sha、concepts の path、layerRoles の layer)。todo のテストは commit も excerpt も持たない。

**解説の中の参照**は満たさなければ置けない(message の from / to、flow の steps、commitStory の flows、
Behavior の message、test の suite / covers / targets、concept の feature、Target の feature / message /
flow)。**地図を指す参照**(commitStory の sha・Note のパスと行・Target の layer / file・LayerRole の
layer・concept のパス)は検査せず、外れたものはページが「地図に無い」と出す(理由は
`build-pr-explain.py` の冒頭)。

## 書き方

読み手は、このリポジトリの規約は知っているが、**この PR で使った技術やこのセッションの経緯は
知らない人**とする。専門用語は出たその場で一言で説明する。

| キー | 書くこと | 書かないこと |
| --- | --- | --- |
| `overview` | `title` は PR の題、`lead` は何ができるようになったかの 1〜2 文。`before` / `after` は操作・状況ごとの振る舞いを 1 つ 1 行で(空・エラー・境界の状況も)。関わるやりとりがあれば `message` で指す | 実装の手順 |
| `overview.highlights` | 特に見てほしい箇所(自信のない判断・未決のまま入れたもの・目で見ないと分からない表示)と、押したときに図のどこへ移るか(`go`) | 「全体を見てください」 |
| `features` / `layerRoles` | 機能・層がこの PR で担う役割を 1 文。`layerRoles` の `layer` の綴りは地図の `groups[].label` に揃える | |
| `concepts` | 箱にしたいファイルと、その短い名前(`name`。概念の名前(docs の語彙)で、図の表示名になる)・役割・何を変えたか(`change`)。変更していないファイルも名指しすると箱になる。図に出さず木にだけ出すなら `graph: false` | 変更ファイルの列挙だけ(箱は地図からも出る) |
| `messages` / `flows` | 箱どうしのやりとり。`kind` は変える(`cmd`)/ 問い合わせる(`qry`)/ 知らせる(`evt`)、`code` は実際の呼び出しの綴り。このブランチで足した・変えた・消したものは `status` を `added` / `changed` / `removed` にする(テストの抜けは `added` と `changed` で数える)。`flows` は操作・イベントごとのやりとりの順で、2〜4 本 | 1 つの関数の中の手順 |
| `commitStories` | コミットごとに、`role`(何をするコミットか 1 行)・`why`(なぜこの順でこうしたか)・`review`(レビューで見てほしい点を 1 点 1 文)・振る舞いの前後・行への注釈(`notes`)。`phase` は下ごしらえ(`prep`)/ 本体(`core`)/ 安定化(`hard`)/ 指摘の反映(`revise`)/ 仕上げ(`fin`) | 件名・本文の写し(地図から出る) |
| `suites` / `tests` | テストごとに、守る振る舞い(`why`)・前提 / 操作 / 期待・使った技法・境界の値の表(`values`)・確かめているやりとり(`covers`)と箱(`targets`)。テストコードは `excerpt` で範囲を指す | テストコードの写し |

- **説明文でも、識別子を地の文の主語にしない。** 実装の名前とファイル名を指すときは `` `…` `` で囲む
- **`review` の文は、確認の印の鍵になる。** 読み手のブラウザは「コミットの sha + 文」で確認済みを
  覚えるので、文を書き直すとその点の印は外れる(別の点へ移らない)
- **`tests[].name` はテスト名そのままで書く。** ページは、地図がテスト名を調べたファイル(`tests.files`。
  `__tests__/` のテストファイル)なら `suite.file` と `name` を `tests.added` と突き合わせて「追加 / 既存」を
  出す。綴りを変えると既存のテストに見える。それ以外のファイルのテストは、このブランチで足したファイルなら
  「追加」、ほかは「判定なし」
- 未実装のテスト(守れていない振る舞い)は `todo: true` で書く。ページは破線で出す
- Note の `start` / `end` は、そのコミットで `side` の側(既定は変更後)のファイルの行番号。差分の
  hunk に入らない行への注釈は「差分に出ていない行への注釈」として別に出る

## 解説が無いとき・古いとき

ページは地図だけでも 3 画面を出す。解説の状態は上の帯で知らせる。

| 状態 | ページの出方 |
| --- | --- |
| 解説が無い | 地図だけで組む。まとめ方は層、表示名はファイル名、構造マップの線は依存だけ(やりとりの流れは出ない)、テストは地図の追加・削除と対象 |
| 解説が読めない(JSON でない・`version` が 1 でない・`pr` が違う・型が想定外) | 「解説なし」とその理由 |
| 解説の sha が地図の head より前 | 「解説は ◯ 時点、以降 n コミットは解説なし」。以降のコミットには「解説なし」の札 |
| 解説の sha が地図のコミットに無い | 「解説の sha が地図に無い」(force push などで履歴が変わったとき) |
| commitStories の sha が地図に無い | 「地図に無い解説 n 件」。別の一覧に出す |
| 地図の version が 2 でない | 画面を組まず、「変更の地図を読めません」と version を出す |

## 参照ファイル

| ファイル | 内容 |
| --- | --- |
| [`templates/index.html`](templates/index.html) | ページの枠(CSS・固定スクリプト・CSP)。固定スクリプトを変えたら CSP の `sha256-` も直す(`check-pr-explain-template.py` が突き合わせる) |
| [`templates/explain.json`](templates/explain.json) | `excerpt` 以外のすべてのキーと、Target の 5 つの kind を使う解説の見本 |
| `.github/scripts/build-pr-explain.py` | 解説の検査と、抜粋の中身の書き足し |
| `.github/scripts/check-pr-explain-template.py` | 枠の CSP と、固定スクリプトが HTML として解釈させる API を使っていないかの検査 |
| `.github/scripts/pr-explain-pages.sh` | gh-pages の `pr-explain/pr-<番号>/` の書き換え(`put-explain` / `put-map` / `remove`) |
| `.github/scripts/build-pr-change-map.py` | 変更の地図(Actions が呼ぶ) |
| `.github/workflows/pr-explain.yml` | 枠と地図の配置と、PR が閉じたときの削除 |
