---
name: implementation-flow
description: "design-composer の実装を ゴールの確定 → タスクの分割 → 計画 → サブエージェント（plan-reviewer）による計画検証 → 実装 → 観点別のサブエージェント（*-reviewer）による実装検証 → PR → マージ後の追記 の順で進める。計画は planner、実装は implementer のサブエージェントが担い、親セッションは振り分け・採否・記録を行う指示役になる。計画と却下案は Issue に追記する。作業の種類は Issue の `flow:*` ラベル（`flow:feature` / `flow:bugfix` / `flow:refactor` / `flow:investigation`）で決まり、種類別手順ファイルがフェーズに手順を足す・置き換える。機能追加・バグ修正・リファクタリングなど、このリポジトリのソースへ手を入れる依頼を受けたら最初に使用する。ソースを変えずに調べて Issue に答えを書く調査の依頼（`flow:investigation`）でも使用する。「実装して」「直して」「対応して」「調べて」「Issue #N をやって」「計画を立てて」といった依頼では積極的に使用すること。"
---

# 実装フロー

実装は次の 8 フェーズを順に通る。**フェーズを飛ばさない。** 飛ばすと決めた場合は、その理由を Issue に書く。種類別手順ファイル（「作業の種類」）によってフェーズを置き換えたり省略したりするのは、飛ばすことに当たらない（理由はそのファイルに記載されている）。

| # | フェーズ | 出力 |
| --- | --- | --- |
| 1 | ゴールの確定 | Issue に書かれたゴール |
| 2 | タスクの分割 | 必要なら分離した Issue |
| 3 | 計画 | Issue に書かれた計画と却下案 |
| 4 | 計画の検証 | `plan-reviewer` の指摘と、それへの対応 |
| 5 | 実装 | コードとテスト |
| 6 | 実装の検証 | 観点別のレビューエージェントの指摘と、それへの対応 |
| 7 | PR | 差分と判断を説明する PR |
| 8 | マージ後の追記 | 閉じた Issue へのコメントと、続きの Issue |

**検証の観点はこのファイルに書かない。** 観点は `.claude/agents/` の `plan-reviewer.md` と観点別の `*-reviewer.md` で定義する（検証の観点を親のコンテキストに通さないための分割）。

## 作業の種類

**作業の種類は Issue の `flow:*` ラベルで決まる。** 種類ごとの追加・置換手順は**種類別手順ファイル**に定義する。決め方はフェーズ 1「種類の確定」を参照。

| ラベル | 種類別手順ファイル | 変わるフェーズ |
| --- | --- | --- |
| `flow:feature` | [`feature.md`](feature.md) | 3 / 5 / 6 / 7 に追加 |
| `flow:bugfix` | [`bugfix.md`](bugfix.md) | 1 / 3 / 5 / 6 / 7 に追加 |
| `flow:refactor` | [`refactor.md`](refactor.md) | 3 / 5 / 6 / 7 に追加 |
| `flow:investigation` | [`investigation.md`](investigation.md) | 1 に追加、3 / 4 / 8 を置換、5〜7 はなし |

**検証を軽くする種類は作らない。** どの種類でも計画（investigation では調査）の検証を省かない。小さな作業向けに検証を省く種類を作ると、「役割の分担」で廃した「修正の小ささによる線引き」が種類の選び方に入り込んでしまうため。

## 役割の分担

**親セッションは指示役であり、計画も実装も自分では書かない。** 計画は `planner`、実装および採用した指摘の修正は `implementer` が担う。親のコンテキストに調査の過程や差分の書きかけを積まず、採否と記録の判断だけを残すための分割。

| フェーズ | 担当 |
| --- | --- |
| 1 ゴールの確定 / 2 タスクの分割 | 親 |
| 3 計画 | `planner`（返ってきた計画を親が Issue へ書く） |
| 4 計画の検証 | 親が `plan-reviewer` へ渡し、採否を決める。修正は `planner` へ戻す |
| 5 実装 | `implementer` |
| 6 実装の検証 | 親が観点別の `*-reviewer` を振り分け、採否を決める。修正は `implementer` へ戻す |
| 7 PR / 8 マージ後 | 親（push 前検査・commit・push・PR・Issue への追記） |

- **親はリポジトリ内のファイルを編集しない**（`src/` に限らず `.claude/` `harness/` `docs/` `rules/` も対象）。修正の小ささは理由にせず、1 行でも `implementer` に渡す（毎回線引きを判断すると分担が崩れる → `.claude/hooks/block-parent-session-edit.sh`）
- 親が作業ツリーを変えてよいのは、判断を伴わない次の 2 つだけとする
  - フェーズ 7 で自動修正コマンド（`pnpm exec biome check --write` 等）を走らせる
  - 検証エージェントによる書き換えを基準コミットへ `git restore` / `git clean` で戻す（「サブエージェントの使い方」）
- Issue・PR 本文を書くのは親の責務。`planner` / `implementer` / `investigator` は結果を返すだけにする
- この分担は `implementation-flow` の中だけであり、`harness-record` / `harness-growth` には及ばない

---

## フェーズ 1: ゴールの確定

**「何ができるようになれば終わりか」を 1〜3 行で書く。** 実装手段ではなく達成状態で書く（「`EditHistory` を作る」ではなく「編集を戻せるようになる」）。

- ゴールが決まらない場合は、決まらない理由（仕様の欠落／選択肢の割れ）を先に潰す。曖昧なまま計画に進むと、計画の検証が照合先を持てなくなる
- **自分で潰せず回答を待つなら、そこで止める。** 選択肢と根拠を Issue に書き、**作業中のセッション URL を併記する**（`AGENTS.md`）。推測で埋めて計画へ進まない
- 対応する Issue がなければ**先に作る**。Issue なしで実装を始めない（判断の置き場所がなくなるため）
  - 自分で進める Issue は、作成の呼び出しでも後からでも assignee を付けない（理由は `AGENTS.md`「Issue に紐づいて起動したら、セッションの URL を Issue に残す」）。フェーズ 2 で分けた Issue のうち、このセッションで続けて進めるものも同じ
- 仕様の拠り所は `docs/`、UI の拠り所は `docs/Design Composer.html`（`rules/ui-verification.md`）
- ゴールの書き方は `.github/ISSUE_TEMPLATE/implementation.yml` と `.github/ISSUE_TEMPLATE/epic.yml` のゴール欄にも写してある。変えたら揃える

### 種類の確定

ゴールと同時に作業の種類（「作業の種類」）を確定する。**ラベルは人が決める。** 既存の `bug` / `enhancement` / `feature` / `refactor` ラベルは分類用であり、作業の種類は決めない。

1. Issue の `flow:*` ラベルを読む

   ```bash
   gh api 'repos/{owner}/{repo}/issues/<番号>' --jq '[.labels[].name | select(startswith("flow:"))]'
   ```

2. 表にある値が 1 つなら、それが種類。着手コメントに種類を記載する
3. 0 個・2 つ以上・表にない値なら、親が提案する種類と根拠を添えて人に尋ねる
   - 対話中なら AskUserQuestion で尋ね、**人が答えた種類のラベル**を親が付ける（`gh api -X POST 'repos/{owner}/{repo}/issues/<番号>/labels' -f 'labels[]=<人が答えたラベル>'`。`<人が答えたラベル>` は `flow:bugfix` のようにラベル全体）。複数付いているラベルや表にない値を外すのも、人が答えたときだけにする
   - 人がいない起動（Issue の assign から起動した等）なら、提案と根拠をセッション URL と一緒に Issue に書いて止める
4. Issue を新規作成するときは、**作成の呼び出しの中で**種類を決める（作った後にラベルを付ける形は、作成の時点で止められる）。行の書式は `.claude/hooks/lib/issue-flow-kind-violations.py` の定数が持ち、欠けた作成は `block-issue-without-flow-kind.sh` が止める（止めた理由に書式が出る）
   - (a) 対話中なら AskUserQuestion で尋ね、人が答えた `flow:*` を作成の呼び出しのラベルに含める
   - (b) 人がいない起動なら、本文に提案の行を書く
   - (c) `implementation-flow` に通さない Issue（`harness-growth` の介入・棚卸し・Epic など）は、本文に通さない行を書く。Epic なら、作成の呼び出しのラベルに `epic` も含める
5. **親が自分で選んだ `flow:*` ラベルは付けない・外さない。** 親は提案までとし、決めるのは人にする。選ぶ側と手順が軽くなって得をする側が同じだと軽い側へ倒れる（`implementation-flow` を通さず検証エージェントだけを呼んだ実例が `harness/case-law/process.md`「単発（まだ語彙にしていない）」の pr-473 にある）。「なければ `flow:feature`」のような既定値も同じ理由で置かない（ラベルのない Issue でバグ修正の再現テストが抜けるため）
6. 途中で種類が変わったら、ここへ戻って確定し直し、フェーズ 3 から計画し直す。古い種類のまま検証した計画は使わない。種類に合わない作業だと分かったときも、3 の手順で人に尋ねる

## フェーズ 2: タスクの分割

`AGENTS.md`「タスクの分割」に従い、独立してマージできる単位に分けるかどうかを判断する。分けた場合も分けなかった場合も、その理由を Issue に残す。分けた側の Issue の種類は、フェーズ 1「種類の確定」の手順 4 で決める。

## フェーズ 3: 計画

**`planner` に立てさせ、返ってきた計画を親が Issue に追記する。** 渡す内容:

```text
ゴール: <ゴール>
Issue: #<番号>
種類: <`flow:*` のラベル>
分割の判断: <分けた / 分けなかった理由と、スコープ外にしたもの>
```

計画に書くのは次の 4 つとする。

1. **変更するファイルと、そこに何を置くか。** 帰属先は `rules/architecture.md` で決める。行単位で直す記述があるなら「何行目のどの記述をどう直すか」まで書く。**公開 API を変える場合は、呼び出している `*.stories.tsx` と `__tests__/` も変更ファイルに含める**（数え漏らすと typecheck が落ちる状態で計画が固まる）。**アクション・状態の直和に枝を足す場合も同様に数える**（枝を足しても既存テストや typecheck は落ちず誰も教えてくれない）
2. **テストケースの一覧。** 仕様の文（「◯◯のとき□□になる」）で書く（`rules/testing.md`）
3. **却下した案と、やめた理由**
4. **未決の判断。** ないなら「無し」と、各セクションを洗った結果を 1 行で書く

却下案を残すのは、後から同じ案が再浮上した際に前回の理由が失われないようにするためである。「A にした」だけでは、B を試していないのか、試して駄目だったのかが分からない。

### 計画を渡す前に踏む 9 つの手順

判断ではなく**毎回同じ順で踏む段取り**であり、順番を間違えると意味が変わる（呼び出し側を数える前にテストを書き始めると後から型が通らなくなる）。実例は [`harness/case-law/planning.md`](../../../harness/case-law/planning.md) を参照。

1. **消す・変える公開 API があれば、呼び出し側を `grep` で数える。** `grep -rn "\.<名前>\b"` や `grep -rn "<消す名前>"` で本番コード・テスト・`*.stories.tsx` を洗い出し、計画のファイル表に載せる。`harness/case-law/README.md`「判例の外の文書を変えたとき」に当たる場合は、判例に残る写し・参照もファイル表に載せる。コードの import を `grep` しても出ない見落としやすい対象は、`harness/case-law/planning.md`「`plan-file-omission`」「`plan-comment-reference`」に当てて数える
2. **一括置換や複数箇所の書き換えを伴う計画は、収集条件を実際のコードに当てて件数を検算する。** 「`const` 宣言を集める」「◯◯という語を置換する」といった条件を文章のまま計画に書かず、`grep` やスクリプトを実行した結果の件数と計画の前提件数（呼び出し側の依存・書き換えが必要な既存テスト数・モジュール表に併記する実体を含む）を **1 項目ずつ**突き合わせる（`分類: plan`。判例 `plan-scope-count-verification`）
3. **想定した接続先・前提・検証手段が実例で本当に成立するかを動かして確かめる。** 既存ヘルパーや retarget 先のフィクスチャが想定通り動くか、「A なら B」という前提が実際のコード・実行結果で崩れていないかを読むだけで済ませず実行して確かめる。**検証コマンド自体が意図した範囲を覆っているか**（ディレクトリの深さ・拡張子の指定漏れ・`git mv` 後は `diff` に出ないこと・表記ゆれによる `grep` の取りこぼしを含む）も同様に確かめる。この種の前提・接続先の主張を計画に書いたら、書き終えるたびに `claim-verification` スキルで検証する
4. **テストケースが前提とするヘルパー・フィクスチャ・API が実在し、想定通り動くか確認する。** 既存ヘルパーを流用する計画なら、確かめたい経路へ実際に到達できるかをコードを読んで確認し、到達できなければその場で計画を直す
5. **却下案の理由が事実を主張しているなら、実際に開く・`grep` するなどして確かめてから書く。** 「`rules/architecture.md` に既にある」「このフィールドがあるから代入できる」といった理由が実物と食い違っていたら、理由側を実物に合わせて書き直す
6. **却下する案について、似た構造の実装が既にコード内にないか `grep -rn` 等で探す。** 見つかれば却下案の一覧へ候補として加え、見つからなければ「探したが無い」と計画に書く（探さずに「他にない」という前提で却下しない）
7. **触るモジュールや呼び出し元の doc / Why コメントにある前提（「常に◯◯である」「〜のときのみ」等）を、この計画が崩さないか `grep -rn` で確かめる。** 崩すなら、影響する `@returns` や不変条件をファイル表・テストケース一覧へ反映する。述語の統合や参照方式の変更で「ついでに満たしていた条件」が消える形も同様に確認する
8. **ドメインオブジェクトへロジックを帰属させる理由を書いたら、その理由が対象の型に固有の性質を指しているか反証する。** 確認手順と反証の基準は `claim-verification` スキルの手順 8 に従い、書き終えるたびに照合する
9. **ファイル表が固まったら、同じファイルを触る open の PR を引き、重なり・引いたコマンド・件数を計画に書く。** 以下のコマンドで PR 番号と変更ファイルを引いてファイル表と突き合わせ、重なりがあればどちらが先に入る前提かを書く（手順 1〜8 でファイル表が増えるため最後に踏む。実例は `harness/case-law/process.md`「`なし` から切り出した形 — 計画のとき、同じファイルを触る open の PR を数えていなかった」）

   ```bash
   gh api 'repos/{owner}/{repo}/pulls?state=open&per_page=100' --paginate --jq '.[].number'
   gh api 'repos/{owner}/{repo}/pulls/<番号>/files?per_page=100' --paginate --jq '.[].filename'
   ```

## フェーズ 4: 計画の検証（`plan-reviewer`）

計画を Issue に書いたら、**実装に入る前に** `plan-reviewer` サブエージェントへ渡す。初回は計画全体を検証する。

```text
ゴール: <ゴール>
種類: <`flow:*` のラベル>
計画: <変更するファイルと置くもの / テストケースの一覧 / 却下した案とその理由 / 未決の判断>
```

採否と次の行き先は [検証の周回](verification-loop.md) に従う。次の周へ進むと決めたら、前回の計画・採用した指摘・種類を `planner` に渡して直させ、新しい版を Issue に書く。`plan-reviewer` には上の入力に加えて、前後の計画の版とその差分、前周で採用した指摘とその観点を渡す。計画全体は文脈として渡し、再検証では指定した観点で修正差分だけを見てもらう。

収束したらフェーズ 5 へ進む。指摘がゴール自体を揺らしている場合や種類が変わる場合はフェーズ 1 へ戻る。前提を確かめ直す合図に当たる場合はそちらを先に扱う。

## フェーズ 5: 実装

**`implementer` を単独・フォアグラウンドで起動する**（理由は「サブエージェントの使い方」）。渡す内容:

```text
ゴール: <ゴール>
Issue: #<番号>
種類: <`flow:*` のラベル>
工程: <`flow:feature` は 仕様の固定 / 仕様の実現、`flow:bugfix` は 再現テスト / 修正、`flow:refactor` は 現状の固定 / リファクタ。この 3 つのときだけ>
計画: <plan-reviewer を通した計画と却下案>
```

- 実装の手順は `.claude/agents/implementer.md` を参照
- **`flow:feature` / `flow:bugfix` / `flow:refactor` では `implementer` を 2 工程に分けて起動する。** `implementer` は commit しないため、1 回で書かせると第 1 工程の分だけが先に入ったコミットが作れない。各工程で書かせる範囲と確認方法は種類別手順ファイルのフェーズ 5 に従う
  - **第 1 工程では、種類別手順ファイルのフェーズ 5 が第 1 工程に書かせるとしたものだけを書かせる。** 返ってきたら「サブエージェントの使い方」の `git status --porcelain` の突き合わせ対象を、計画のファイル表で第 1 工程に挙げたファイルだけに絞る。種類別手順ファイルの確認に合格したら commit し、これを**第 1 工程のコミット**として第 2 工程以降の比較基準にする
  - **第 1 工程に書くものがなければ省く。** 第 2 工程を起動する前の HEAD を第 1 工程のコミットの代わりとして Issue に記載する（省く条件は種類別手順ファイルを参照）
  - **第 2 工程で実装を変えさせる。** フェーズ 6・7 の修正でも第 2 工程の値を渡す
  - **第 2 工程から返ったら（`flow:bugfix` / `flow:feature`）、親が次のコマンドを走らせ、終了コード 0 を確かめる。** この確認はフェーズ 5 の第 2 工程に限り、フェーズ 6・7 の直しのたびに何を確かめるかは各種類別手順ファイルのフェーズ 6 に従う

    ```bash
    git diff --exit-code <第 1 工程のコミット> -- <第 1 工程のテストのファイル>
    ```

- **`implementer` が計画から外れて止めて返ってきたら、** 親が外れた理由を Issue に追記したうえで続行を判断して起動し直す（後回しにすると理由を思い出しにくくなるため）
- **Issue・PR 本文に事実の主張を書いたら、書き終えるたびに親が `claim-verification` スキルで確かめる**（フェーズ 6 まで持ち越さない → `.claude/skills/claim-verification/`）

## フェーズ 6: 実装の検証（観点別のレビューエージェント）

実装が一通り終わったら、差分に応じて観点別のエージェントを選び、**2 段で**起動する。渡す情報（ゴール・計画と却下案・差分）と指摘の書式は共通の指示 [`reviewer-instructions.md`](reviewer-instructions.md) に従う。モデルは各エージェント定義の frontmatter の `model` で決まるためここには写さない。

1. **第 1 段（観点別レビュー）**: 初回は下の表で「呼ぶ条件」に当たるエージェントのうち `test-reviewer` 以外を、1 つのメッセージで並列に起動する。採否と次の行き先は [検証の周回](verification-loop.md) に従う。次の周へ進むと決めたら、採用した指摘を種類（と工程）と一緒に `implementer` へ渡す。種類別手順の確認を行い、修正直前と修正を含むコミットの間の差分（`git diff <修正直前のコミット> <修正後のコミット>`）を、前周で採用した指摘を出したエージェントだけに、採用した指摘と観点を添えて渡す
2. **第 2 段（ミューテーション）**: 第 1 段が収束したら、下の表で `test-reviewer` の条件を **PR 全体の差分**（`origin/main` との共通祖先からの累積差分）に当てる。対象なら同じ累積差分を渡して、**単独・フォアグラウンドで 1 回だけ起動する**。検証中に実装が一時的に壊れるため、他の処理にその状態を読ませない（詳細は「サブエージェントの使い方」）。採用したテストの穴は `implementer` に渡し、該当箇所で同じミューテーションを入れると補ったテストが落ち、復元すると通ることを実測させる。このテストの追補を第 1 段の周回には入れない。対象外の場合、または検証結果を受け取り、採用した指摘への対応と実測が済んだ場合にフェーズ 7 へ進む

表の第 1 段の条件は初回だけに適用する。

| エージェント | 観点 | 呼ぶ条件 |
| --- | --- | --- |
| `solution-reviewer` | 方式（根本原因を直しているか・より単純な代替・継ぎ当て） | 常に |
| `duplication-reviewer` | 重複 | 常に |
| `comment-reviewer` | コメント・doc の記述と実物 | 常に |
| `naming-reviewer` | 命名 | 常に |
| `structure-reviewer` | 帰属先・依存方向・型・React の状態 | `src/` |
| `performance-reviewer` | 性能 | `src/` `src-tauri/` |
| `over-guard-reviewer` | 過剰なフォールバック / ブロック | 実行されるコード（下） |
| `ui-reviewer` | UI 案との対応 | `.tsx` `docs/06-ui.md`、または差分が語 `UI 案` / `Design Composer.html` を含む |
| `security-reviewer` | セキュリティ | `src/libs/` `src/domains/compiled/` `src-tauri/` `package.json` `pnpm-lock.yaml` `.github/` `.claude/hooks/` `.claude/agents/` `.claude/settings.json` `harness/githooks/`、または差分が語 `innerHTML` / `url(` を含む |
| `harness-reviewer` | 規約・仕様書・ハーネス | `AGENTS.md` `rules/` `docs/` `.claude/` `.github/` `harness/` |
| `test-reviewer` | テストが守っているか（ミューテーション） | 実行されるコード（下）。2 段目 |

「実行されるコード」は `src/` `src-tauri/` `.claude/hooks/` `.github/scripts/` `harness/githooks/` と `harness/records/*.sh` を指す。設定ファイル（`.storybook/` `vite.config.ts` `.github/workflows/`）は、壊したときに落ちるのが vitest や判定表ではなくビルド・CI そのものになるため対象外とする。

パスと語は次のコマンドで抽出する。コミット前の新規ファイルも含め、語は大文字・小文字を区別しない（`dangerouslySetInnerHTML` も `innerHTML` として拾う）。件数が 0 ならその語の条件には当たらない。

```bash
base=$(git merge-base origin/main HEAD)
{ git diff --name-only "$base"; git ls-files --others --exclude-standard; } | sort -u
diff_text() { git diff "$base"; git ls-files --others --exclude-standard -z | xargs -0 cat; }
diff_text | grep -ciE 'innerhtml|url\('              # security-reviewer の語
diff_text | grep -ciE 'UI 案|Design Composer\.html'   # ui-reviewer の語
```

- **`solution-reviewer` を呼んだ周では、まず方式の結論を読む。** 方式の「置き換え」を採るなら局所的な修正と分けてフェーズ 3 へ戻る。ゴールや種類を変えるならフェーズ 1 へ戻る。[前提を確かめ直す合図](verification-loop.md) に当たる場合はそちらを先に扱う
- **エージェントをまたいで根本原因が同じ指摘は、対応方針を決めるときだけ束ねる。** 再検証する観点を失わないよう、束ねても出どころを残す。`harness-record` は元の指摘ごとに書く（出どころの書式は `.claude/skills/harness-record/templates/record.md`「出どころの語彙」）
- `solution-reviewer` を 1 段目の前に単独で走らせることはしない（方式はフェーズ 4 で検証済みであり、「置き換え」になる頻度は低いため）
- 実装の検証を PR の前に置くのは、過剰な防御などが PR に出た後だと差分の意図と絡んで剥がしにくくなるため

## フェーズ 7: PR

- **PR を出す前に、フェーズ 1「種類の確定」の手順 1 でラベルを読み直す。** 変わっていたらフェーズ 1 へ戻る（手順 6）
- **PR 本文は `pull-request` スキルで書く。** 意思決定の書き方は `.claude/.pr-template.yml` の `decision_record` に従い、材料にはコミット本文に加えて Issue の計画・却下案を使う（Issue からは省かない → `AGENTS.md`「実装の進め方」）
- **本文に `Closes #<Issue 番号>` を書く**（`AGENTS.md`「着手した Issue は、その回で閉じる」。閉じる Issue がない PR は `.github/workflows/pr-closing-issue.yml` が落とす）
- CI（lint / typecheck / test / 視覚差分）を通す。push 前検査や CI が落ちた場合、修正は種類（と工程）と一緒に `implementer` へ渡す（判断を伴わない自動修正コマンドだけは親が走らせてよい →「役割の分担」）
- **PR を出したら `pr-explain` スキルで解説（`explain.json`）を書く。** 振る舞いが変わる push をしたら書き直す（`.claude/skills/pr-explain/`）

### push 前の確認

**push の前に、まずフックが発火する環境かをカナリアで確認し、続けて `pre-push` と vitest を実行して終了コードで判定する。**

```bash
echo hook-canary          # 必ず deny されるカナリア（.claude/hooks/hook-canary.sh）
```

```bash
PRE_PUSH_REQUIRE_ALL=1 bash harness/githooks/pre-push   # git hooks と同じ検査すべて（型 / lint / format / 規約 / 判定表）
pnpm run test:run                                       # vitest（pre-push に含まれない）
```

- **判定は終了コードで行い、出力は最後の行を読む**（`harness/githooks/README.md`「結果の読み方」）。途中の出力から通ったと推測しない
- **`PRE_PUSH_REQUIRE_ALL=1` を外さない。** 外すと道具（`pnpm` / `node_modules` / `python3` / `jq`）が欠けた検査を飛ばしたまま exit 0 になる。飛ばして落ちたら道具を揃えて再実行する
- **検査の一覧をここへ写さない**（追加先は `pre-push` 側だけ → `分類: harness`）。ただし `.claude/hooks/README.md`「カバー範囲と残る穴」で層 2 が「無し」の判定表は、対象スクリプトを触ったときに手元でも走らせる
- **カナリアが通っても即座に不発と決めない。** カナリアの取りこぼしと本当の不発を区別するため、`.claude/hooks/README.md`「発火しているかを確かめる（カナリア）」の表で PreToolUse の痕跡を見て切り分ける。フック不発（判例 `hook-environment`、分類 `harness`）として記録してよいのは痕跡がない枝だけとする
- **不発と分かったら、** その旨を PR 本文と記録に残し、**このセッションで禁止コマンドを実行していないか Bash 履歴を見直す**（取りこぼしの枝では不要）。`block-npx.sh` や `git add -A` の抑止などセッション中の行為を止めるフックは git hooks・CI へ移せないため（`.claude/hooks/README.md`「カバー範囲と残る穴」）、該当があれば取り消す（`git add -A` を打っていたら `git reset` して個別に add し直す）。なお、ゲート自体は git hooks と CI にあるため以降の手順は変わらない
- **`&&` で 1 コマンドに連ねない。** 途中の出力が流れて見誤るうえ、`pre-push` が落ちると `test:run` が走らず、カナリアを混ぜると deny で後続の検査が 1 つも走らなくなる
- **フックは保険ではなく確認の位置づけ。** push 前検査の強制は git hooks（`harness/githooks/`）が担い、`.claude/hooks/` の `pre-push-*` は同じスクリプトを走らせる即時フィードバック層にあたる

**`src/` か `.storybook/` に差分があるときは、撮影範囲も確かめる**（ゲートは CI の `Storybook Visual Regression` のみが持つ）。

```bash
pnpm build-storybook                                                         # Storybook のビルド
pnpm visual:capture -- --storybook-dir storybook-static --out visual-actual  # 撮影範囲の検査
```

- **確認対象は視覚差分ではなく、ストーリーが撮影のビューポートに収まっているか**（`rules/ui-verification.md`「差分ではなく撮影で落ちることがある」。層の配置と残る穴は `.claude/hooks/README.md`「カバー範囲と残る穴」）
- **拡張子で絞らない。** スキーマの `.ts` だけを変えた差分でもストーリーの高さは変わりうる
- **手元で通っても CI と等価ではない。** 日本語フォントが CI（`fonts-noto-cjk`）と異なると折り返しが変わって高さが変わるため、「手元で収まった」と PR 本文に事実として書かない
- 撮影には Chrome が必要。PATH に `google-chrome` / `chromium` がなければ `CHROME_BIN=<実行ファイル>` を指定する。実行できなかった場合はその旨を PR 本文に書く

**`src-tauri/` に差分があるときは、`TAURI_SETUP.md`「Rust 側の検査」の 2 コマンドも走らせる**（ゲートは CI の `src-tauri.yml` のみが持つ。層 2 へ置かない理由は `.claude/hooks/README.md`「カバー範囲と残る穴」。実行できなかった場合はその旨を PR 本文に書く）。

## フェーズ 8: マージ後の追記

マージされたら次の 3 つを行う（マージは `.claude/hooks/post-merge-review.sh` が検知して提示する）。

1. **意思決定が変わった点があれば該当 Issue にコメントする**（計画では A としたがレビューで B に移した／却下案を採用した／ゴールの範囲が変わった等）。変わっていないなら書かない。**Issue は `Closes` で閉じているが、閉じたままコメントを残し再オープンしない**
2. **続きの作業が必要なら新しい Issue を立てて元の Issue からリンクする**（`AGENTS.md`「着手した Issue は、その回で閉じる」）。スコープ外にした項目や決定変更で作り直しになった項目が該当する。種類はフェーズ 1「種類の確定」の手順 4 で決める
3. **`harness-record` スキルでその回の評価を記録する。** 記録を残すところまでとし、集計と規約の見直しは行わない（→ `harness-growth`）

---

## サブエージェントの使い方

- **検証は必ず別のエージェントに投げる。** 自分で書いた計画やコードを自分で検証しても同じ前提のまま読むため、抜けが同じ位置に残る
- **検証エージェントに実装させない。** 指摘だけを返させ、採否は親が判断し、修正は別に起動する `implementer` に任せる
- **`implementer` から返ったら、`git status --porcelain` を「計画のファイル表と渡した指摘の対象」と突き合わせる。** 一致したら commit して作業ツリーの基準にする（push はフェーズ 7。2 工程に分ける種類の第 1 工程ではフェーズ 5 の狭い範囲で突き合わせる）
- **implementation-flow の中でのコミットの区切りはこの手順（工程と `implementer` から返るたび）が決め、`commit` スキルの分割ルールより優先する。** 件名と本文の書き方は `commit` スキルに従う
- **それ以外のエージェントから返ったら、指摘を読む前に作業ツリーが基準のまま（`git status --porcelain` が空）か確認する。** 定義に「変更しない」と書いてあっても書き換える場合があるため、戻さずに指摘対応へ進むと `implementer` の変更と混ざってコミットに載る
- **修正は `SendMessage` で続けず、新しい Agent 呼び出しで `implementer` に渡す。** 実行中マーカーを作るフックの matcher は `Task|Agent` であり、`SendMessage` には反応しないため（`.claude/settings.json`）
- **作業ツリーを書き換えるサブエージェントは、他のツール呼び出しを同じメッセージに並べず単独・フォアグラウンドで起動し、完了を受け取るまで `git add` / `commit` / `push` を挟まない。** ミューテーション実測や実装の途中にコミットすると、その瞬間の書き換えが紛れ込む。`block-git-during-verification-agent.sh` がマーカーのある間の git 操作を止める（対象は `.claude/hooks/README.md`）が、マーカーが残るのはフォアグラウンドにある間だけ。`run_in_background: true` を明示した起動は `track-verification-agent-activity.sh` が拒否するものの、フォアグラウンド起動でも 120 秒を超えると約 120 秒でバックグラウンドへ移され、移された後はマーカーが消える（フック冒頭参照）。単独起動にするのは、バックグラウンド移行後に並列呼び出しが実行中に走りうるのを防ぐため（実測記録は `harness/case-law/process.md`）
- **バックグラウンドへ移った場合は完了を取り逃さず、結果を受け取るまで次のフェーズへ進まない**（フォアグラウンド起動から約 120 秒で移された場合を含む）
- **セッション途中で `.claude/agents/` に追加した定義は、同じセッションから呼べないことがある**（リモート実行環境で `Agent type not found` を実測）。その場合は `general-purpose` に定義ファイルを読ませて代行させる。代行では frontmatter が効かないため、定義の `model` を Agent の `model` に渡し（`inherit` なら渡さない）、定義の `tools` にないツールを使わないよう prompt に明記する。代行中はマーカーも作られないため、作業ツリーを書き換えるエージェントは同様に単独・フォアグラウンドで起動し、完了まで git 操作を挟まない

## 参照ファイル

| ファイル | 内容 | 読むタイミング |
| --- | --- | --- |
| `.claude/agents/planner.md` | 計画を立てるエージェントの入力・出力 | フェーズ 3 |
| `.claude/agents/plan-reviewer.md` | 計画の検証観点（エージェントが読む） | フェーズ 4 |
| `.claude/agents/implementer.md` | 実装するエージェントの入力・出力 | フェーズ 5 / 6 / 7 |
| `.claude/agents/` の `plan-reviewer.md`・`investigation-reviewer.md` 以外の `*-reviewer.md` | 実装の検証観点（エージェントが読む） | フェーズ 6 |
| [`verification-loop.md`](verification-loop.md) | 計画・実装の再検証、周回の記録、終了条件 | フェーズ 4 / 6 |
| [`reviewer-instructions.md`](reviewer-instructions.md) | 実装の検証の観点別エージェントへの共通指示（エージェントが読む） | フェーズ 6 |
| [`feature.md`](feature.md) | `flow:feature` の追加手順 | `flow:feature` で「作業の種類」の表にあるフェーズ |
| [`bugfix.md`](bugfix.md) | `flow:bugfix` の追加手順 | `flow:bugfix` で「作業の種類」の表にあるフェーズ |
| [`refactor.md`](refactor.md) | `flow:refactor` の追加手順 | `flow:refactor` で「作業の種類」の表にあるフェーズ |
| [`investigation.md`](investigation.md) | `flow:investigation` の追加・置換手順 | `flow:investigation` で「作業の種類」の表にあるフェーズ |
| `.claude/agents/investigator.md` | 調査するエージェントの入力・出力（調査結果の項目）・信頼の境界（許可コマンドの形） | `flow:investigation` の調査 |
| `.claude/agents/investigation-reviewer.md` | 調査結果の検証観点（エージェントが読む） | `flow:investigation` の調査の検証 |
| `.claude/skills/claim-verification/SKILL.md` | コメント・doc・PR/Issue 本文の事実主張を書く前に確かめる手順 | フェーズ 3 / 5 |
| `.claude/skills/pr-explain/SKILL.md` | PR の解説ページの書き方と公開手順 | フェーズ 7 |
| [`harness/case-law/planning.md`](../../../harness/case-law/planning.md) | 計画で過去に踏んだ実例 | フェーズ 3 |
| [`harness/case-law/process.md`](../../../harness/case-law/process.md) | サブエージェント・フック環境の実例 | フェーズ 4 / 6 / 7 |
