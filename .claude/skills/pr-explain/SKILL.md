---
name: pr-explain
description: "PR ごとの解説ページ（構造マップ・変更の経緯・テスト・振る舞い・技術の手引き・構成の前後・流れ図・クイズの 8 画面）の材料になる解説 explain.json を書き、検査して gh-pages の pr-explain/pr-<番号>/ へ置く。implementation-flow のフェーズ 7 で PR を出した直後と、振る舞いが変わる push の後に使用する。「PR の解説を書いて」「解説ページを更新して」といった依頼でも使用する。変更の地図（変更ファイル・依存・テスト名の増減・コミットと差分）とページの枠は Actions が置くので書かない。"
---

# PR の解説ページ

レビュアー（人間）が PR を開いたときに、**どこをどうつなぎ替えたか・どの順で何を変えたか・機能ごとに何が変わったか・操作の流れがどう変わったか・テストが何を守っているか・使う人から見て何が変わったか・読むのに必要な技術**を把握し、理解を確かめられるようにする。diff と Issue だけでは、長いセッションでの経緯や設計の意図が掴みにくいため。

## 8 画面と材料

ページは単一 HTML で、`#map` / `#story` / `#test` / `#impact` / `#primer` / `#compare` / `#trace` / `#quiz` で画面を切り替える（ハッシュがなければ構造マップで開き、前回の画面は記憶しない）。上部バーの文字サイズ調整（−/+、90〜150%）は構造マップ・テストの箱図と構成の前後・流れ図の図（欄の幅で自動決定）を除く全パネル・本文に効き、開くたびに 100% に戻る。

各画面は、Actions が git 差分から生成する**変更の地図**（`change-map.json`）と、セッションが書く**解説**（`explain.json`）を組み合わせて描画する。

| 画面 | 構成と表示内容 | 地図（`change-map.json`）から | 解説（`explain.json`）から |
| --- | --- | --- | --- |
| 構造マップ（`#map`） | 左: 変更ファイルと `concepts` の木。中央: 層または機能ごとの箱図とやりとり／依存の線（抽象度で開閉）。右: 概要（highlights・組ごとの変更・やりとり一覧）または選択した箱・線・やりとりの詳細（要するに・入出力・依存関係）とシーケンス図 | `groups`・`dependencies` | `overview.highlights`・`features`・`layerRoles`・`concepts`・`messages`・`flows` |
| 変更の経緯（`#story`） | 左の「コミット / 機能」で切替。コミット側: 新しい順の一覧、ブランチ全体の流れ（題・要約・前後・変更順・機能 × コミット表・レビューポイント）、コミット別説明（なぜ・影響する操作・レビュー観点・前後）・差分・行注釈（hunk ごとの機能札と一言）。機能側: 変更行数が多い順の一覧（機能なしは末尾）、機能全体表と観点、機能別説明、古い順のコミット差分・注釈（番号はコミット側と共通） | `commits`（件名・本文・作者・日時・ファイル別差分） | `overview`・`commitStories`（操作名は `flows`、ファイル呼び名は `concepts`）・`features`（機能側には `commitStories[].featureRanges` が必須） |
| テスト（`#test`） | suite 別のテスト一覧と、構造マップと同じ箱図上でテストが確かめている箱・やりとりと抜けを表示。テストごとの前提 / 操作 / 期待・値表・確認対象のやりとり・対応する振る舞い節・テストコード・追加コミット | `tests.added` / `tests.removed`・調査対象ファイル（`tests.files`）・テスト対象（`target`） | `suites`・`tests`（線は `messages`、なければ依存） |
| 振る舞い（`#impact`） | ユーザー視点の変化をコード名を出さずに表示（根拠の仕様パスと技術の手引きの節題は例外）。左: 節の目次（変更節に印）。中央: 題・要約・変わったこと（これまで / これから）・状況表（行 × 列。変更マスに印、最初の変更マスを初期選択）・増えた状況・変わらないこと（テストの有無）。右: 今の節の根拠（仕様の場所・関連 Issue・テスト・ないテスト・仕組みのチップ）。スクロールに連動し、狭幅では各節内に畳む | テストの追加／既存判定・やりとり両端の箱存在・コミット変更ファイル（仕様リンク到達判定） | `impact`（根拠は `tests`・`messages`・`primers`） |
| 技術の手引き（`#primer`） | PR を読むのに必要な技術を出現箇所と合わせて説明。上: タブ（言語・フレームワーク / この PR の実装。760px 以下でも上部固定）。左: 目次（REFERENCE の後に用語集）。中央: 節（要するに → 本文の段を記述順）。右: 出現箇所（差分で見る／届かないときはコミットまたは全体の流れを見る）・テスト・ないテスト・構造マップで見る・関連・用語。点線の語にホバーすると右欄の同じ語が光る（狭幅では各節内に畳み、畳んだ欄の同じ語が光る） | コミットの変更ファイル（ファイル・行への到達判定）・テスト判定 | `primers`・`terms`（根拠は `tests`・`flows`） |
| 構成の前後（`#compare`） | マージベースとこのブランチを同じ配置の 2 枚（左右 / 上下）で比較。片方にしかない箱は点線枠で残し、未変更箱は薄くできる。粒度は「呼び出し（`calls`）」と「モジュール（変更ファイルと依存）」。呼び出し箱には名前の下に役割、線を選ぶと変更後に呼び出し式・変更前に変更前の一言を表示（同箱発の線は辺上でずらし、縦並びの箱を跨ぐ線は右へ迂回）。左: 増減・変更件数と一覧。右: 選択要素の前後と変更コミット（未選択時は `calls` の題・説明・観点、それもなければ件数）。選択対象がなければ理由（解説なし / 書かれていない / 呼び出しの変化なし / モジュールの変化なし）を表示 | 変更ファイルの状態・`dependencies`（増えた / 消えた / 残った）・`commits` | `calls`（箱の組の名前は `concepts`） |
| 流れ図（`#trace`） | 人とモジュール間の 1 操作をカードと番号付き矢印で表示。左: 操作一覧（手順数の前後・変化・量の前後）。中央: 題・説明、表示切替（既定は「比べる」で増えた手順に `+n`・消えた手順に `×`・変更手順は番号に輪。他に「変更後だけ」「変更前だけ」。`stepChanges` のない流れは変更後だけ）、前へ / 次へ、現手順カード（比較時は前後 2 列と注記）。全流れの端を初回自動配置して流れ切替時も位置を固定。カードは名前と concept のファイル名を表示し、`person` アイコンは別色。未使用端は薄く、増減した concept / `status` 付き actor に注記。右: 手順一覧（単体表示は変化手順に印、比較時は変更前名を打ち消し線） | 変更ファイルの状態（追加 / 削除） | `flows`（手順の端は `messages` の `from` / `to`、名前は `concepts` と `actors`、増減 actor は `actors[].status`） |
| クイズ（`#quiz`） | 4 択・YES / NO・並べ替えで理解を確認。左: 正解数・問題一覧（✓ / ✕ / 番号・形式・題）・「答えを消す」。中央: 現問題と回答UI（並べ替えは ↑↓ またはドラッグで「答え合わせ」）、回答後は正誤・理由・次の問題へ・やり直す（並べ替えは誤位置に「正しくは n 番目」）。右: 根拠画面へのチップ（回答後に有効化）。回答状態と並べ替え途中は PR ごとにブラウザへ保存 | 根拠チップの到達判定（遷移先画面と同じ） | `quiz`（根拠は `Target`） |

### 画面間の遷移

各画面のリンク・チップから別の画面や状態へ直接遷移できる。

| 出発画面 | 押す要素 | 遷移先と状態 |
| --- | --- | --- |
| 構造マップ | 見てほしい点（`highlights`） | `Target` の kind に応じた画面・状態。`callBox` / `callEdge` は構成の前後の呼び出し粒度、`module` はモジュール粒度、`stepChange` は流れ図の該当対応（変更後手順があれば「変更後だけ」、削除手順なら「比べる」。図にない・対応がない場合は無効で「指している先が図に無い」） |
| 変更の経緯 | 「影響する操作」 | 構造マップでその流れを選んだ状態 |
| 変更の経緯 | 機能 × コミット表の行見出し / 列見出し / マス・機能札 / 機能側の件名 | 行見出し → 機能側のその機能、列見出し・機能側の件名 → コミット側のそのコミット、機能札（hunk 下・同コミットの他機能）とマス → その機能のそのコミット |
| テスト | 「追加したコミット」 | 変更の経緯でそのコミットを開いた状態（機能側を開いていてもコミット側へ戻る） |
| テスト | 「この状況を確かめている」 | 振る舞いのその節（表ならそのマスを選んだ状態） |
| 振る舞い | 「テストで見る」 | テスト画面でそのテストを選んだ状態（観点の絞り込みは解除） |
| 振る舞い | 仕組みのやりとりチップ / 技術の手引きチップ | やりとり → 構造マップでそのやりとりを選択（表示範囲の絞り込み解除。両端が図の箱でない場合は無効で「図に無い」）。手引き → 技術の手引きの該当タブ・節 |
| 振る舞い | 仕様の「差分で見る」 | 変更の経緯の該当コミット・ファイル（行ハイライトはなし。届かない場合の扱いは技術の手引きと同じ） |
| 技術の手引き | 「差分で見る」 / テスト / 構造マップで見る / 関連 | 差分 → 変更の経緯の該当コミット・ファイル（カードを開いてスクロール）、テスト → テスト画面、構造マップで見る → 該当流れ、関連 → もう一方のタブの節 |
| 構成の前後 | 「どこで変わったか」 / 「ほかの画面で見る」 | どこで変わったか → 変更の経緯の該当コミット・ファイル。ほかの画面で見る → 選んだ箱・線のファイルを端に持つやりとりを含む流れ図 |
| クイズ | 根拠のチップ（回答後のみ有効） | `Target` の kind に応じて構造マップの `highlights` と同じ遷移先（遷移先で選べない場合は回答後も無効で「図に無い」） |

「差分で見る」での行ハイライト規則:

- 行が光るのは、そのコミットが解説の `sha` までにそのファイルを最後に変更しており、間にマージコミットがない場合だけ
- そのコミットがそのファイルを変えていない、またはマージコミットなら印を出してコミットの先頭を開く
- 地図にない `sha` なら印を出してブランチ全体の流れを開く

### 配置と公開

gh-pages の `pr-explain/pr-<番号>/` に置くのは次の 3 ファイルだけとする。

| ファイル | 内容 | 配置タイミング |
| --- | --- | --- |
| `index.html` | ページの枠（`templates/index.html`） | Actions が push のたびに配置 |
| `change-map.json` | 変更の地図 | Actions が push のたびに配置 |
| `explain.json` | 解説 | セッションが `put-explain` で配置 |

- URL は `https://dio0550.github.io/design-composer/pr-explain/pr-<番号>/`。Storybook プレビューの固定コメントに載るため別にコメントしない
- **解説は PR ブランチにも main にもコミットしない**（main に溜まり Files changed にも混ざるため）
- #1394 のマージ以降に閉じた PR は、マージ・クローズ後もフォルダを消さず同じ URL で閲覧できる
- 解説ページの一覧は `https://dio0550.github.io/design-composer/pr-explain/`。Actions（`pr-explain-list.yml`）が `PR Explain` 完了時と main への push 時に自動再生成するため、セッションからは触らない（`put-list` を呼ばない）。PR タイトルの変更は次の再生成 run で反映される

## いつ書くか

- **PR を出した直後**（`implementation-flow` フェーズ 7）
- **振る舞いが変わる push をした後。** format やコメントだけの push では書き直さない（ページが「解説は ◯ 時点、以降 n コミットは解説なし」と表示するため読み手が判断できる）
- **#1394 以前に閉じてフォルダが消された PR を reopen した後**

## 手順

1. **材料を集める**
   - Issue: ゴール・計画・却下案・計画から外れた点（`implementation-flow` の記録）
   - 変更の地図: コミットの `sha`・層名（`groups[].label`）・パスは手元で同じ地図を生成して取る

     ```bash
     python3 .github/scripts/build-pr-change-map.py --base origin/main --head HEAD --pr <番号> --head-branch "$(git branch --show-current)" --base-branch main
     ```

   - 検証エージェントの指摘: 特に `test-reviewer` のミューテーション実測結果はテスト解説の材料になる
   - セッションの記憶: Issue に書くほどではなかった判断や試して捨てた案
2. **見本 [`templates/explain.json`](templates/explain.json) をリポジトリ外の作業ファイルへコピーして編集する**（`mktemp -d` 等）。見本は `excerpt` 以外の全キーと、`Target` 全 9 kind・`Question` 全 3 kind・`primers` 全 2 kind・`Passage` の `excerpt` 以外の全 8 kind を網羅している。不要な任意キーは消す
3. **下の「explain.json の形」と「書き方」に従って書く**
4. **事実の主張を確かめる。** 解説は「この関数は◯◯を返す」「この操作で□□になる」といった主張の集まりのため、`claim-verification` スキル（通常管轄はフェーズ 3 / 5）の手順をここでも使う。`Note` の行番号はそのコミット時点のファイルを開いて合わせる
5. **検査して配置する**

   ```bash
   bash .github/scripts/pr-explain-pages.sh put-explain <PR 番号> <書いた explain.json>
   ```

   - push 前に `build-pr-explain.py` が検査し、テストおよび `primers` の抜粋（`excerpt`）へ実体（`text`）と、埋め込み領域（`script` / `style` 要素・ヒアドキュメント）内から始まる場合の開始行（`openingLine`、埋め込みを開いた行）を自動補完する（規則は `.github/scripts/lib/embedded_regions.py`、エラー分類は `build-pr-explain.py` 冒頭を参照）
   - 解説の `sha` は push 済みコミットを指定し、リモート追跡ブランチにない `sha` は置かない
   - 終了コードの意味は `pr-explain-pages.sh` 冒頭を参照。**3** なら `PR Explain` の run 完了を待ってやり直す。閉じた PR には置かない（スクリプトでは止めない）
   - 解説の `sha` が地図の head と違えば、配置したうえで標準エラーに通知される（push 直後で run 未完了なだけなら置き直し不要）
   - **gh-pages へ push してよいのは、このスクリプトで `pr-explain/pr-<番号>/` へ置くときだけ。** 他フォルダ・他ブランチは触らない
6. **URL をユーザーに伝える**

## explain.json の形

### 共通の規則

- **空文字は禁止。** 未知のキーと重複キーは入れ子を含めてエラーになる。任意配列は省略すると `[]` と同等に扱われる
- **コード表記（`` `…` ``）:** 以下の説明文中の `` `…` `` はコードとして描画される（HTML タグは文字のまま出力）。一方、名前（`name`・`label`）、`code`（`declaration` を含む）、`quiz` の `title`・`items` はそのまま出力される（例外として `primers` の `label` だけは `` `…` `` をコード描画する）
  - 対象キー: `title`・`lead`・`text`・`why`・`given` / `when` / `then`（`impact` 内は下の規則）、`primers` の `label` / `gist` / `text`・注意メモ段の `text`・引数の `text`・出現箇所の `text`、`terms[].text`、`features[].review`、`featureRanges[].text`、`calls` の `gist` / `text` / `review` と箱の `role` / `was` / `now`・線の `was` / `now`、`flows` の `gist` / `text` と `stepChanges` の `beforeText` / `afterText` / `change`・`measure` の `what` / `before` / `after`、`actors[].role`、`quiz` の `prompt` / `why` / `options`
- **用語の印（`[[表示|用語の id]]`）:** 書けるのは `primers` の `gist`・`text` 段・注意メモ段の `text`・引数の `text` のみ。印の表示テキストには `` `…` `` を入れられるが、`` `…` `` の中に印は書けない。`` `…` `` の外に印でない `[[` / `]]` を書くのも不可（対になった `` `…` `` の中なら可。閉じていない `` ` `` の後ろはコードにならない）。理由は `build-pr-explain.py` 冒頭を参照
- **見出し（`Heading`）は概念名（`docs/` の語彙）で書く:** 検査対象は `build-pr-explain.py` の `Heading` キー（名前系から `tests[].name` と `calls` 箱の `name` を除いたもの、および `highlights`・`quiz` の `title`）。`docs/` にないキャメルケース等の複合語（小文字と大文字の継ぎ目）はエラーになる。大文字略語（UI 案・VRT 等）は可。1 語の識別子（`Result`・`Token`）・ファイル名・`snake_case` は機械検査しないが見出しには書かない。例外: `impact` の `label` は下の `UserText`、`primers[].label`・`terms[].label`・引数の `name` は技術名なので `Text`（識別子可）
- **振る舞い（`impact`）はすべてユーザー視点の言葉（`UserText`）で書き、コード名を書かない:** 関数・型・ファイル名・`snake_case` を避け、`` `…` `` も使えない（そのまま文字出力されるため）。機械検査が弾くのは継ぎ目のある複合語（`docs/` の語を除く）と `` ` `` だけなので、1 語識別子・ファイル名・`snake_case` は書く側で避ける。例外は仕様の場所の `path`（`Text`）と `shas`（`Sha`）。詳細は `build-pr-explain.py` 冒頭を参照（根拠に出るテスト名・やりとり名・仕様パス・技術の手引きの節題は対象外）
- **形式:** `id` は `^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$`、`sha` は小文字 40 桁

### トップレベルキー

| キー | 必須 | 意味 |
| --- | --- | --- |
| `version` | 必須 | `1` |
| `pr` | 必須 | 公開先の PR 番号 |
| `sha` | 必須 | 解説作成時点の head（`git rev-parse HEAD`。push 済み）。抜粋はここから取得する |
| `issue` | 任意 | 材料の Issue 番号 |
| `overview` | 必須 | `Overview` |
| `features` | 任意 | `Feature[]`。空なら「機能」でまとめられない（層のみ）。変更の経緯の機能側には `commitStories[].featureRanges` も必要 |
| `layerRoles` / `concepts` / `messages` / `flows` / `commitStories` / `suites` / `tests` | 任意 | 各型の配列 |
| `actors` | 任意 | `Actor[]`。やりとりの端になる、`concepts` のファイル以外の存在（操作する人・外部サービス） |
| `calls` | 必須 | `Calls`。構成の前後の呼び出し粒度の材料。箱・線とも 0 件なら「呼び出しの変化なし」、キー自体がない旧解説は「書かれていない」と表示 |
| `impact` | 任意 | `Impact`。なければ振る舞い画面は「書かれていない」と表示 |
| `primers` | 任意 | `Primer[]`。ないか空なら技術の手引きは「書かれていない」と表示 |
| `terms` | 任意 | `Term[]` |
| `quiz` | 任意 | `Question[]`。ないか空ならクイズは「書かれていない」と表示 |

### 型定義（`?` は任意）

| 型 | キーと制約 |
| --- | --- |
| `Overview` | `title`, `lead`, `before: Behavior[]`（0 件可）, `after: Behavior[]`（1 件以上）, `highlights?: Highlight[]` |
| `Behavior` | `text`, `message?`（`messages` の id） |
| `Highlight` | `title`, `text`, `go: Target`（押したときの遷移先） |
| `Target` | `{kind: "feature", id}` / `{kind: "layer", layer}`（地図の `groups[].label` と一致） / `{kind: "file", path}` / `{kind: "message", id}` / `{kind: "flow", id}` / `{kind: "callBox", id}` / `{kind: "callEdge", id}` / `{kind: "module", path}` / `{kind: "stepChange", flow, stepChange}`（`flows` の id と `stepChanges` の 1 始まり番号）。kind ごとの必須キー欠落や他 kind キーの混入は不可 |
| `Feature` | `id`, `label`, `role`, `review?: string[]`（機能ごとのレビュー観点。確認印は付かない） |
| `LayerRole` | `layer`（一意。地図の `groups[].label`）, `role` |
| `Concept` | `path`（一意）, `name`, `role`, `feature?`（`features` の id）, `change?`, `graph?`（既定 `true`）, `icon?: CardIcon`（流れ図カードの絵。省略時は箱） |
| `Actor` | `id`（一意。`concepts` の `path` と重複不可）, `label`, `role`, `icon?: CardIcon`（省略時は `person`）, `status?: "added" \| "removed"`（省略時は前から存在。流れ図カードに表示） |
| `CardIcon` | `"person"`（人） \| `"widget"`（画面部品） \| `"store"`（状態） \| `"cache"`（キャッシュ） \| `"scan"`（走査） |
| `Message` | `id`, `from`, `to`（`concepts` の `path` か `actors` の `id`）, `kind: "cmd" \| "qry" \| "evt"`, `name`, `code`, `via: "call" \| "http" \| "state" \| "log" \| "exec" \| "file"`, `payload?`, `returns?`, `status?: "added" \| "changed" \| "removed"`（省略時は未変更） |
| `Flow` | `id`, `label`, `steps[]`（変更後の手順、`messages` の id、1 件以上）, `gist`（この操作の変化）, `beforeSteps[]`（変更前の手順、`messages` の id、0 件可）, `stepChanges: StepChange[]`（1 件以上）, `text?`（操作自体の説明）, `measure?: Measure`。全手順がちょうど 1 つの対応に属し、`beforeSteps` に `added`、`steps` に `removed` のやりとりを含めない |
| `StepChange` | 前後手順の対応。`status?: "added" \| "changed" \| "removed"`（省略時はそのまま）, `beforeStep?`, `afterStep?`（1 始まり）, `beforeText?` / `afterText?`, `change?`（`status` があるときのみ）, `beforeCost?` / `afterCost?: "heavy" \| "skipped"`。制約: `added` は `afterStep` のみ、`removed` は `beforeStep` のみ、`changed` と省略時は両方必須。`beforeText` / `beforeCost` は `beforeStep` あり時、`afterText` / `afterCost` は `afterStep` あり時のみ可。並び順で `beforeStep`・`afterStep` は単調増加。省略時は前後が同じ未変更やりとりを指し、前後が同じ `changed` やりとりなら `status` も `changed` にする |
| `Measure` | `what`（数える対象）, `before`, `after`（変更前後の量。同値可） |
| `CommitStory` | `sha`（一意）, `phase: "prep" \| "core" \| "hard" \| "revise" \| "fin"`, `role`, `why`, `flows?`（`flows` の id）, `review?: string[]`, `before?: Behavior[]`, `after?: Behavior[]`, `notes?: Note[]`, `featureRanges?: FeatureRange[]` |
| `Note` | `path`, `side?: "new" \| "old"`（既定 `"new"`）, `start`（1 以上）, `end`（`start` 以上）, `text`。行番号はそのコミット時点 |
| `FeatureRange` | `path`, `side?`, `start`, `end`（`Note` と同じ）, `feature`（`features` の id）, `text`（機能 × コミットのマスと hunk 札横に表示）。範囲行を 1 行でも含む hunk（削除ファイルは変更前行）がその機能に属し、複数機能の範囲が入る hunk は該当機能すべてに属する |
| `Calls` | `boxes: CallBox[]`, `edges: CallEdge[]`（各 0 件可）, `gist?`, `text?`, `review?: string[]`（確認印なし）。`id` は箱と線をまたいで一意 |
| `CallBox` | `id`, `name`（呼び出し名、そのまま出力）, `role`, `module`（`concepts` の `path`、箱の組になる）, `status?: "added" \| "changed" \| "removed"`（省略時は未変更）, `was?`, `now?`。制約: `added` は `now` のみ、`removed` は `was` のみ、`changed` は異なる 2 つ、省略時は `now` 必須で `was` を書くなら `now` と別値 |
| `CallEdge` | `id`, `from`, `to`（`calls` 箱の id）, `code`（呼び出し式）, `status?`, `was?`, `now?`（`CallBox` と同規則）。変更後に残る線の端は `removed` 箱不可、変更前にあった線の端は `added` 箱不可 |
| `Suite` | `id`, `label`, `file` |
| `Test` | `id`, `suite`（`suites` の id）, `name`, `techniques[]`: `"boundary" \| "equivalence" \| "error" \| "state" \| "regression" \| "idempotence" \| "type"`（1 件以上・重複なし）, `why`, `given`, `when`, `then`, `todo?: true`, `commit?`（`sha`）, `excerpt?: Excerpt`, `values?: Values`, `targets?`（`concepts` の `path`）, `covers?`（`messages` の `id`） |
| `Excerpt` | `tests` と `primers` の段の抜粋。`path`, `start`, `end`（80 行まで）, `emphasis?: LineRange[]`（ファイル行番号、`start`〜`end` 内）。`text` と `openingLine` は検査が足す出力専用キーのため入力に書くとエラー |
| `Values` | `columns[]`（1 件以上）, `rows[{cells[]（列と同数）, boundary?}]` |
| `Impact` | `title`, `lead`, `changed?: ImpactChange`, `tables?: SituationTable[]`, `added?: AddedSituation[]`, `kept?: KeptLine[]`, `keptSpecs?: KeptSpec[]`（書くなら `kept` を 1 行以上。同じ `path` + `locator` の重複不可） |
| `ImpactChange` | `before: ImpactLine[]`（0 件可）, `after: ImpactLine[]`（1 件以上）, `text?`, `specs?: ChangedSpec[]`（`path` + `locator` 重複不可）, `relatedIssues?: RelatedIssue[]`（`issue` 重複不可）, `primers?`（`primers` の id、重複なし、kind 横断可）。`before` と `after` の文並びが完全一致するとエラー（一部一致は可） |
| `ImpactLine` | `text`, `message?`（`messages` の id、仕組みチップになる） |
| `SituationTable` | `label`, `gist?`, `text?`, `rowHeads: SituationRowHead[]`（1 件以上）, `columnHeads: SituationColumnHead[]`（1 件以上）, `outcomes: SituationOutcome[]`。行見出し × 列見出しの全組み合わせを過不足なく 1 つずつ持つ |
| `SituationRowHead` | `id`（行見出し内で一意）, `label`, `note?`（1 行注。マスの状況に「行 · 列（注）」と添える） |
| `SituationColumnHead` | `id`（列見出し内で一意。行見出しとの重複可）, `label` |
| `SituationOutcome` | `rowHead`, `columnHead`（見出し id）, `result`, `was?`（書くと変更マスになる。`result` と同値はエラー）, `situation?`（省略時は見出しから自動生成）, `note?`, `tests?`（`tests` の id、重複なし） |
| `AddedSituation` | `label`, `before: ImpactLine[]`（0 件可）, `after: ImpactLine[]`（1 件以上）, `text?`, `tests?`（重複なし）, `primers?`（`ImpactChange` と同規則）。前後の規則も `ImpactChange` と同じ |
| `KeptLine` | `text`, `tests?`（`tests` の id、重複なし） |
| `ChangedSpec` | 変更した仕様の場所。`path`, `locator`（見出しの言葉。行番号は書かない）, `text`（変更点）, `shas`（1 件以上・重複なし。地図と照合しない） |
| `KeptSpec` | 変更していない仕様の場所。`path`, `locator`, `text`（維持した点）。`shas` は持たない |
| `RelatedIssue` | `issue`（Issue 番号。材料の `issue` と同番号可）, `text`（関わり） |
| `Primer` | `id`, `kind: "language" \| "codebase"`, `category`, `label`, `gist`（印可）, `passages?: Passage[]`（記述順に描画）, `occurrences: Occurrence[]`（1 件以上）, `seeAlso?`（`primers` の id、重複なし、kind 横断可）。`codebase` のみ `status?: "added" \| "changed"`, `tests?`, `flows?`（重複なし） |
| `Passage` | `kind` ごとに: `text {text}` / `declaration {code}` / `parameters {parameters: Parameter[] 1 件以上}` / `excerpt {excerpt: Excerpt}` / `caution` \| `memo` \| `rule` \| `spec` \| `history` `{text}` |
| `Parameter` | `name`, `type`, `text`（印可）, `note?` |
| `Occurrence` | `path`, `lineRange?: LineRange`（解説 `sha` の行番号）, `text`, `shas?`（重複なし。地図と照合しない） |
| `LineRange` | `start`（1 以上）, `end`（`start` 以上） |
| `Term` | `id`, `label`（一意）, `text`。いずれかの用語の印から参照されること |
| `Question` | `id`, `kind: "choice" \| "yesno" \| "order"`, `title`（一覧の短い見出し）, `prompt`（問い）, `why`（解説）, `go: Target[]`（1 件以上、根拠チップ）。`choice` は `options: string[]`（4 択・重複なし）と `answer`（1 始まり）、`yesno` は `holds: boolean`、`order` は `items: string[]`（2 件以上・重複なし、正解順） |

### 一意性と参照の検査

- **一意性:** `features` / `messages` / `flows` / `suites` / `tests` / `actors` / `quiz` の `id`、`primers` の `id`（kind 横断）、`calls` の箱・線の `id`（箱・線横断）、`terms` の `id` と `label`、`commitStories` の `sha`、`concepts` の `path`、`layerRoles` の `layer` をそれぞれ一意にする。`quiz` は「問い・選択肢・並べる項目」の組も一意にする（後述の保存キーのため）。`todo: true` のテストは `commit` も `excerpt` も持たない
- **解説内の参照（必須・未解決ならエラー）:** `message` の `from` / `to`（`concepts` か `actors`）、`flow` の `steps` / `beforeSteps`、`commitStory` の `flows`、`featureRanges` の `feature`、`calls` 箱の `module` と線の `from` / `to`、`Behavior` の `message`、`test` の `suite` / `covers` / `targets`、`concept` の `feature`、`Target`（`highlights`・`quiz[].go`）の `feature` / `message` / `flow` / `callBox` / `callEdge` / `stepChange`（`flow` と対応数以内の番号）、`ImpactLine` の `message`、`SituationOutcome`・`AddedSituation`・`KeptLine` の `tests`、`ImpactChange`・`AddedSituation` の `primers`、`primers` の `seeAlso` / `tests` / `flows`、用語の印 → `terms`（全 `terms` は最低 1 箇所から参照）
- **地図を指す参照（検査しない）:** `commitStory` の `sha`、`Note`・`FeatureRange` のパスと行、`Target` の `layer` / `file` / `module`、`LayerRole` の `layer`、`concept` の `path`、`Occurrence` の `path` / `lineRange` / `shas`、仕様の場所の `path` / `shas`。外れた参照はページ側で「地図に無い」と表示される（`FeatureRange` の外れはどの hunk にも付かない）。理由は `build-pr-explain.py` 冒頭を参照

## 書き方

読み手の前提をキーによって切り替える。

- **`primers` と `terms` 以外:** このリポジトリの規約は知っているが、**この PR の技術やセッション経緯は知らない人**を想定する。専門用語は出た場で一言説明する（印は読まれず `[[…|…]]` がそのまま出るため使わない）
- **`primers`（language / codebase）と `terms`:** **その言語・フレームワークに初めて触れる人**を想定する。構文・組み込み型・標準 API・その技術の約束事は「何のための仕組みか」から説明し、変数・関数・引数のような一般語は説明しない。技術は `primers`、用語は `terms` に 1 回だけ書き、本文の語に印を付けて指す（`codebase` 節ではリポジトリ規約を既知としてよい）

| キー | 書くこと | 書かないこと |
| --- | --- | --- |
| `overview` | `title` は PR の題、`lead` は何ができるようになったか 1〜2 文。`before` / `after` は操作・状況ごとの振る舞いを 1 行ずつ（空・エラー・境界も）書き、関連やりとりを `message` で指す。レビュアー向けのため `` `…` `` で実装名を出してよい | 実装の手順 |
| `impact` | ユーザー（アプリ操作者、ハーネスなら利用セッション）から見た変化を操作と画面の言葉だけで書く。`changed` は前後、`tables` は 2 軸の組み合わせ表（変更マスのみ `was`）、`added` は新状況、`kept` は巻き込まれそうで変わらない点。根拠は `tests` で指す。仕様変更は `changed.specs`、維持仕様は `keptSpecs` に見出し言葉の `locator`（「「タブ」の ⌘W の行」等）と 1 文を添える。経緯に関わる Issue は `changed.relatedIssues`、仕組みの解説は `changed.primers` / `added[].primers` で指す | コード名（共通の規則） |
| `overview.highlights` | 特に見てほしい箇所（自信のない判断・未決事項・目視必須の表示）と遷移先 `go` | 「全体を見てください」 |
| `features` / `layerRoles` | 機能・層の役割を 1 文。`layerRoles[].layer` は地図の `groups[].label` に揃える。機能別のレビュー観点は `features[].review` に 1 点 1 文で書く | |
| `concepts` | 箱にしたいファイルと、概念名（`name`）・役割・変更点（`change`）。未変更ファイルも指定すると箱になる。木だけに出すなら `graph: false`。`icon` は流れ図専用 | 変更ファイルの単なる列挙 |
| `actors` | 流れ図の端になるファイル以外の存在（操作者・外部エディタ・外部サービス）。`label` は概念名、`role` は 1 文 | `concepts` に書けるファイル |
| `messages` / `flows` | 箱間のやりとり（`cmd` 変更 / `qry` 照会 / `evt` 通知）と実際の呼び出し式 `code`。増減・変更は `status` を付ける（テスト抜け集計は `added`・`changed` が対象）。`flows` は操作ごとの順を 2〜4 本書き、`steps` / `beforeSteps` / `stepChanges` で前後を対応づける。既存呼び出しの引数変更等で 1 件のまま `changed` にしたときは前後に同 id を置き、旧式との違いを `beforeText` / `change` に書く | 1 関数内の細かな手順 |
| `calls` | 呼び出し粒度の構成前後。増減・変更した呼び出し（関数・フック・コマンド）を箱と線にし、文脈上必要な未変更要素も置く。呼び出し変化がない PR（ドキュメントのみ等）は箱・線とも 0 件にする | ファイル単位依存の写し（地図から自動生成） |
| `commitStories` | コミットごとの `role`（1 行）・`why`・`review`（1 点 1 文）・前後・行注釈（`notes`）・機能範囲（`featureRanges`。複数機能が混ざるファイルは範囲を分ける）。`phase` は下ごしらえ（`prep`）/ 本体（`core`）/ 安定化（`hard`）/ 指摘反映（`revise`）/ 仕上げ（`fin`） | コミット件名・本文の写し |
| `suites` / `tests` | 守る振る舞い（`why`）・前提 / 操作 / 期待・技法・境界値表（`values`）・確認対象のやりとり（`covers`）と箱（`targets`）。コードは `excerpt` で範囲指定する | テストコードのベタ書き |
| `primers` | `language` は差分出現順、`codebase` は全体から部品へ並べる。PR ごとに記述する（共有なし）。`language` は `gist` に仕組みの目的、`passages` に構文・標準挙動を置き、`codebase` は言語構文を再説明せず印や `seeAlso` で `language` 節へ繋ぐ | コード例の写し（`excerpt` を使う）、想定読者が知らない概念の省略 |
| `terms` | 1 語 1 回、1〜2 文で書く。1〜2 文に収まらない語は `primer` にする（差分に出ない語は `occurrences` を置けないため 1〜2 文に収まる粒度に分ける） | |
| `quiz` | PR の理解を確かめる問い。`title` は概念名、`why` は理由、`go` は根拠の遷移先。同じ問い文の `yesno` を 2 問置かない | |

### 記述時の注意点

- **説明文でも識別子を地の文の主語にせず、** 実装名・ファイル名は `` `…` `` で囲む
- **`commitStories[].review` の文は確認済みマークの保存キーになる。** ブラウザは「コミット `sha` + 文」で覚えるため、文を書き直すと印が外れる（`features[].review` には印がない）
- **クイズの回答状態は「問い・選択肢・並べる項目」で保存される。** これらを変えると保存された回答が消える（`title`・`why`・`go` の変更では消えない）。同じ組の 2 問は検査でエラーになる
- **`tests[].name` はテスト名そのままにする。** 地図の調査対象ファイル（`__tests__/`）では `suite.file` と `name` を `tests.added` と照合して「追加 / 既存」を判定するため、表記を変えると既存扱いになる（対象外ファイルはブランチ追加ファイルなら「追加」、その他は「判定なし」）
- **未実装のテストは `todo: true` とする。** テスト画面では破線、振る舞い画面の根拠と技術の手引きの「この PR の実装」右欄では「ないテスト」として表示される（本文は件数のみ）
- **`Note` と `FeatureRange` の `start` / `end`** は対象コミットの `side` 側（既定は変更後）の行番号とする。hunk 外の行への注釈は「差分に出ていない行への注釈」として別表示され、注釈番号はコミット内で通番になるため機能側表示でも変わらない

## 解説がないとき・古いとき

ページは地図だけでも 8 画面を表示し、解説が必須の画面（振る舞い・技術の手引き・流れ図・クイズ、および構成の前後の呼び出し粒度）は「解説なし」と表示する。状態は上部帯で通知される。

| 状態 | ページの表示 |
| --- | --- |
| 解説がない | 地図だけで組む。まとめ方は層、表示名はファイル名、構造マップの線は依存のみ（やりとり・流れはなし）、テストは地図の追加・削除と対象のみ |
| 解説が読めない（非 JSON・`version` ≠ 1・`pr` 不一致・型や必須キーや kind の不正） | 「解説なし」と理由を表示。対象キー（`impact`・`primers`・`terms`・`features[].review`・`commitStories[].featureRanges`・`calls`・`actors`・`quiz`・`overview.highlights`・`flows` の `gist` / `text` / `beforeSteps` / `stepChanges` / `measure`・`tests[].excerpt.emphasis`）の型不正、`primers` / `terms` / `quiz` の必須要素欠落、`highlights` / `quiz` の kind 不正がある場合は、エラー箇所のパス（`impact.tables[].outcomes`・`quiz[].kind` 等。複数なら外側）も表示する |
| `impact` / `primers`（空含む） / `quiz`（空含む）がない | 該当画面に「書かれていない」と表示（他画面に影響なし） |
| `calls` がない / 箱も線も 0 件 | 構成の前後の呼び出し粒度に「書かれていない」／「呼び出しの変化なし」と表示（モジュール粒度と他画面に影響なし） |
| `flows` に `stepChanges` がない（旧形式。現行では必須・空不可） | 流れ図の該当流れは「変更後だけ」を表示し、`gist`・`text`・`measure` はなければ出さない |
| `commitStories` に `featureRanges` がない | 変更の経緯で機能側を押せず（コミット側のみ）、機能 × コミット表も出ない |
| 解説 `sha` が地図 head より前 | 「解説は ◯ 時点、以降 n コミットは解説なし」と表示し、以降のコミットに「解説なし」札を付ける |
| 解説 `sha` が地図コミットにない | 「解説の sha が地図に無い」（force push 等で履歴が変わった場合） |
| `commitStories` の `sha` が地図にない | 「地図に無い解説 n 件」として別一覧に表示 |
| 地図 `version` が 2 でない | 画面を組まず「変更の地図を読めません」と version を表示 |

## 参照ファイル

| ファイル | 内容 |
| --- | --- |
| [`templates/index.html`](templates/index.html) | ページの枠（CSS・固定スクリプト・CSP）。固定スクリプト変更時は CSP の `sha256-` も更新する（`check-pr-explain-template.py` が照合） |
| [`templates/list.html`](templates/list.html) | 一覧の枠（CSS・固定スクリプト・CSP）。`list.json` を読んで行を組む。固定スクリプト変更時は CSP の `sha256-` も更新する |
| [`templates/explain.json`](templates/explain.json) | `excerpt` 以外の全キーと全 kind を使う解説の見本 |
| `.github/scripts/build-pr-explain.py` | 解説の検査と、抜粋の中身・開始行の補完 |
| `.github/scripts/lib/embedded_regions.py` | 抜粋・差分 hunk の先頭行で有効な埋め込み（`script` / `style` 要素・ヒアドキュメント）を開いた行の判定（検査と地図で使用） |
| `.github/scripts/check-pr-explain-template.py` | 2 つの枠の CSP と危険な HTML 解釈 API 未使用の検査。`--tracked` で追跡拡張子の色付け表（`LanguageByExtension` / `NotHighlighted`）網羅も確認 |
| `.github/scripts/pr-explain-pages.sh` | gh-pages の `pr-explain/pr-<番号>/` と一覧の更新（`put-explain` / `put-map` / `put-list`） |
| `.github/scripts/build-pr-change-map.py` | 変更の地図の生成（Actions から実行） |
| `.github/workflows/pr-explain.yml` | 枠と地図の配置ワークフロー |
| `.github/workflows/pr-explain-list.yml` | 一覧の配置ワークフロー（PR タイトルを GraphQL で取得し `put-list` へ渡す） |
| `.github/scripts/lib/git-token-auth.sh` | 2 ワークフローが gh-pages へ push する際の認証ヘッダ |
