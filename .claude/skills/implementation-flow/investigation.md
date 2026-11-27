# `flow:investigation`: 調べた結果を Issue に書いて終わる

`flow:investigation` の Issue で、`SKILL.md` のフェーズに追加・置換する手順。記載のないフェーズは `SKILL.md` のままとする。

**ソースを変えず、PR も出さない。** 調べた結果と、続きの作業の Issue が出力になる。

## フェーズ 1: 問いと終わりの条件

ゴールに加えて、次の 2 つを Issue に書く。

- **問い** — 何に答えれば終わりか（「◯◯はなぜ△△になるか」「◯◯を使っている箇所はどこか」など）
- **完了の確かめ方** — どこまで確かめたら答えとするか（再現した／呼び出し元を数えきった 等）

この 2 つは `.github/ISSUE_TEMPLATE/investigation.yml` の欄にも写してある。フォームの `###` と AI が書く `##` を区別せず欄名で読み、「完了の確かめ方」が無い旧 Issue では「終わりの条件」を読む。どちらで読んだ値も、調査と検証の入力では「終わりの条件」として渡す。

## フェーズ 3: 調査（`investigator`）

**`investigator` に調べさせ、返ってきた結果を親が Issue に書く。** 親は自分で調べない（`SKILL.md`「役割の分担」と同じ理由で、親のコンテキストに調査過程を積まないため）。渡す内容:

```text
ゴール: <ゴール>
Issue: #<番号>
種類: `flow:investigation`
問い: <問い>
終わりの条件: <終わりの条件>
```

入力と出力（調査結果の項目）は `.claude/agents/investigator.md` を参照。

## フェーズ 4: 調査の検証（`investigation-reviewer`）

`investigation-reviewer` に調査結果を渡す。観点は `.claude/agents/investigation-reviewer.md`、許可されるコマンドの形は `.claude/agents/investigator.md`「信頼の境界」に従う。

```text
ゴール: <ゴール>
Issue: #<番号>
問い: <問い>
終わりの条件: <終わりの条件>
調査結果: <`investigator` の返り値そのもの>
```

**調査結果・前回の結果には、必ず `investigator` の返り値をそのまま渡す。** Issue のコメントから読み直して渡すと、Issue に書いた後で誰かが書き足した内容が検証・再調査の対象に紛れ込む。

指摘は握りつぶさない。受け入れるなら前回の結果（前回の `investigator` の返り値そのもの）と採用した指摘を `investigator` に渡して調べ直させ、受け入れないなら理由を Issue に書く。

```text
<フェーズ 3 の 5 行>
前回の結果: <前回の `investigator` の返り値そのもの>
採用した指摘: <採用した `investigation-reviewer` の指摘>
```

## フェーズ 5〜7: なし

**ソースの変更が必要だと分かったら、この Issue では行わない。** 種類の提案を添えて新しい Issue を立て、この Issue からリンクする（種類のラベルは `SKILL.md` フェーズ 1「種類の確定」の手順 4 で決める）。

## フェーズ 8: 結果を書いて閉じる

1. 調査結果（`.claude/agents/investigator.md`「返すもの」の項目）と、続きの Issue のリンクを Issue に書く
2. **Issue を手動で閉じる**（`AGENTS.md`「着手した Issue は、その回で閉じる」の例外）。閉じる起点になる PR がないため、閉じないと「PR を出さずに止まった Issue」と見分けがつかなくなる

   ```bash
   gh api -X PATCH 'repos/{owner}/{repo}/issues/<番号>' -f state=closed -f state_reason=completed
   ```

`harness-record` は行わない。記録はマージした PR ごとに残すものであり、この種類には PR がないため。
