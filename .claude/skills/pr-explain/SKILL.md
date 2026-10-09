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
| 構造マップ(`#map`) | 左に変更ファイルと concepts の木。中に、それを層(または機能)ごとの組にまとめた箱の図と、やりとり(または依存)の線。組は抽象度で畳む・開く。右に概要(highlights・組ごとの変更・やりとり一覧)か、選んだ箱・線・やりとりの詳細(要するに・受け取るもの / 送り出すもの・使っている / 使われている)と、やりとりの流れ(シーケンス図) | `groups`・`dependencies` | `overview.highlights`・`features`・`layers`・`concepts`・`messages`・`flows` |
| 変更の経緯(`#story`) | コミットを新しい順に並べた一覧と、ブランチ全体の流れ(題・要約・これまで / このあと・変更の順番・レビューポイント)、コミットごとの説明(なぜ・影響する操作・レビューで見るところ・振る舞いの前後)と差分・行への注釈 | `commits`(件名・本文・作者・日時・ファイルごとの差分) | `overview`・`commitNotes`(操作の名前は `flows`、ファイルの呼び名は `concepts`) |
| テスト(`#test`) | suite ごとのテストの一覧と、構造マップと同じ組・箱の図の上で、テストが確かめている箱・やりとりと、その抜け。テストごとの前提 / 操作 / 期待・値の表・確かめているやりとり・テストコード・追加したコミット | `tests.added` / `tests.removed`・テストファイルの対象(`target`) | `suites`・`tests`(線は `messages`。無ければ依存) |

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
     落ちたら報告を読んで直す。報告の分類は `[pr-explain-shape]`(形)・`[pr-explain-meta]`(`pr` が
     公開先と違う)・`[pr-explain-ref]`(解説の中の参照切れ)・`[pr-explain-code]`(`sha` や抜粋の
     パスがこのリポジトリに無い)
   - **終了コード 3** は置き先に `change-map.json` がまだ無い(`PR Explain` の run が終わる前)か、
     PR が閉じて消された後。run の完了を待ってからやり直す。閉じた PR には置かない
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
| `layers` / `concepts` / `messages` / `flows` / `commitNotes` / `suites` / `tests` | 任意 | 下の型の配列 |

**型**(`?` は任意)

| 型 | キー |
| --- | --- |
| Overview | `title` `lead` `before: Behavior[]`(0 件でよい)`after: Behavior[]`(1 件以上)`highlights?: Highlight[]` |
| Behavior | `text` `message?`(messages の id) |
| Highlight | `title` `text` `target: Target` |
| Target | `{kind: "feature", id}` / `{kind: "layer", layer}`(地図の `groups[].label` と同じ綴り)/ `{kind: "file", path}` / `{kind: "message", id}` / `{kind: "flow", id}`。kind ごとのキーが欠けるのも、他の kind のキーが混ざるのも不可 |
| Feature | `id` `label` `role` |
| LayerNote | `layer`(一意。地図の `groups[].label`)`role` |
| Concept | `path`(一意)`name` `role` `feature?`(features の id)`change?` `graph?`(既定 true) |
| Message | `id` `from` `to`(concepts の path)`kind`: `cmd` \| `qry` \| `evt` `name` `code` `via`: `call` \| `http` \| `state` \| `log` \| `exec` \| `file` `payload?` `returns?` `status?`: `new` \| `removed` |
| Flow | `id` `label` `steps[]`(messages の id。1 件以上) |
| CommitNote | `sha`(一意)`phase`: `prep` \| `core` \| `hard` \| `review` \| `fin` `role` `why` `flows?`(flows の id)`review?: string[]` `before?: Behavior[]` `after?: Behavior[]` `notes?: Note[]` |
| Note | `path` `side?`: `new` \| `old`(既定 new)`start`(1 以上)`end`(start 以上)`text`。行番号はそのコミット時点 |
| Suite | `id` `label` `file` |
| Test | `id` `suite`(suites の id)`name` `techniques[]`: `boundary` \| `equivalence` \| `error` \| `state` \| `regression` \| `idempotence` \| `type`(1 件以上・重複なし)`why` `given` `when` `then` `todo?: true` `commit?`(sha)`excerpt?: Excerpt` `values?: Values` `targets?`(concepts の path)`covers?`(messages の id) |
| Excerpt | `path` `start` `end`(80 行まで)。`text` は検査が足す出力だけのキーで、入力に書くと落ちる |
| Values | `columns[]`(1 件以上)`rows[{cells[](列と同数), boundary?}]` |

id・sha・path・layer は一覧の中で一意にする(features / messages / flows / suites / tests の id、
commitNotes の sha、concepts の path、layers の layer)。todo のテストは commit も excerpt も持たない。

**解説の中の参照**は満たさなければ置けない(message の from / to、flow の steps、commitNote の flows、
Behavior の message、test の suite / covers / targets、concept の feature、Target の feature / message /
flow)。**地図を指す参照**(commitNote の sha・Note のパスと行・Target の layer / file・LayerNote の
layer・concept のパス)は検査しない。地図は push のたびに変わるので、外れたものはページが
「地図に無い」と出す。

## 書き方

読み手は、このリポジトリの規約は知っているが、**この PR で使った技術やこのセッションの経緯は
知らない人**とする。専門用語は出たその場で一言で説明する。

| キー | 書くこと | 書かないこと |
| --- | --- | --- |
| `overview` | `title` は PR の題、`lead` は何ができるようになったかの 1〜2 文。`before` / `after` は操作・状況ごとの振る舞いを 1 つ 1 行で(空・エラー・境界の状況も)。関わるやりとりがあれば `message` で指す | 実装の手順 |
| `overview.highlights` | 特に見てほしい箇所(自信のない判断・未決のまま入れたもの・目で見ないと分からない表示)と、図のどこを見ればよいか(`target`) | 「全体を見てください」 |
| `features` / `layers` | 機能・層がこの PR で担う役割を 1 文。`layers` の綴りは地図の `groups[].label` に揃える | |
| `concepts` | 箱にしたいファイルと、その短い名前(`name`。図の表示名になる)・役割・何を変えたか(`change`)。変更していないファイルも名指しすると箱になる。図に出さず木にだけ出すなら `graph: false` | 変更ファイルの列挙だけ(箱は地図からも出る) |
| `messages` / `flows` | 箱どうしのやりとり。`kind` は変える(`cmd`)/ 問い合わせる(`qry`)/ 知らせる(`evt`)、`code` は実際の呼び出しの綴り。`flows` は操作・イベントごとのやりとりの順で、2〜4 本 | 1 つの関数の中の手順 |
| `commitNotes` | コミットごとに、`role`(何をするコミットか 1 行)・`why`(なぜこの順でこうしたか)・`review`(レビューで見てほしい点を 1 点 1 文)・振る舞いの前後・行への注釈(`notes`)。`phase` は準備(`prep`)/ 本体(`core`)/ 堅くする(`hard`)/ 指摘の反映(`review`)/ 仕上げ(`fin`) | 件名・本文の写し(地図から出る) |
| `suites` / `tests` | テストごとに、守る振る舞い(`why`)・前提 / 操作 / 期待・使った技法・境界の値の表(`values`)・確かめているやりとり(`covers`)と箱(`targets`)。テストコードは `excerpt` で範囲を指す | テストコードの写し |

- **`review` の文は、確認の印の鍵になる。** 読み手のブラウザは「コミットの sha + 文」で確認済みを
  覚えるので、文を書き直すとその点の印は外れる(別の点へ移らない)
- **`tests[].name` はテスト名そのままで書く。** ページは `suite.file` と `name` を地図の
  `tests.added` と突き合わせて「追加 / 既存」を出す。綴りを変えると既存のテストに見える
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
| commitNotes の sha が地図に無い | 「地図に無い解説 n 件」。別の一覧に出す |
| 地図が version 1 | 「地図が古い(v1)」 |

## 移行期間

以前は解説を HTML の断片で 4 ページ(入口・振る舞い・技術・テスト)に分けて置いていた。

- 古いブランチのセッションが古いスクリプトでページを置いても、次の push で Actions が枠を置き直し、
  3 つ以外のファイルを消す
- 地図が version 1 のフォルダにも `put-explain` で置ける。ページは「地図が古い(v1)」と出す

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
