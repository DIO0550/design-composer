# `flow:investigation`: 調べた結果を Issue に書いて終わる

`flow:investigation` の Issue で、`SKILL.md` のフェーズを足す・置き換える手順。フェーズ 2 は
`SKILL.md` のまま。

**ソースを変えず、PR も出さない。** 調べた結果と、続きの作業の Issue が出力になる。

| # | `SKILL.md` のフェーズ | `flow:investigation` で行うこと |
| --- | --- | --- |
| 1 | ゴールの確定 | ゴールに加えて、問いと終わりの条件を書く |
| 2 | タスクの分割 | そのまま |
| 3 | 計画 | `investigator` が調べ、親が結果を Issue に書く |
| 4 | 計画の検証 | `comment-reviewer` が調査結果を検証する |
| 5〜7 | 実装 / 実装の検証 / PR | 無い |
| 8 | マージ後の追記 | 結果と続きのリンクを書いて、手で閉じる |

## フェーズ 1: 問いと終わりの条件

ゴールに加えて、次の 2 つを Issue に書く。

- **問い** — 何に答えれば終わりか(「◯◯はなぜ△△になるか」「◯◯を使っている箇所はどこか」)
- **終わりの条件** — どこまで確かめたら答えとするか(再現した / 呼び出し元を数えきった 等)

## フェーズ 3: 調査(`investigator`)

**`investigator` に調べさせ、返ってきた結果を親が Issue に書く。** 親は自分で調べない
(`SKILL.md`「役割の分担」が親に調査の過程を積まないために分けているのと同じ)。渡すもの:

```text
ゴール: <ゴール>
Issue: #<番号>
種類: `flow:investigation`
問い: <問い>
終わりの条件: <終わりの条件>
```

受け取るもの・返すものは `.claude/agents/investigator.md` が持つ。

## フェーズ 4: 調査の検証(`comment-reviewer`)

Issue に書いた調査結果を `comment-reviewer` に渡す。渡すもの・指摘の書式は
[`reviewer-instructions.md`](reviewer-instructions.md) が持つ(計画・差分の代わりに調査結果と
確かめ方を渡す)。

```text
ゴール: <ゴール>
調査結果: <答え / 確かめた事実と確かめ方 / 未検証>
```

指摘は握りつぶさない。受け入れるなら前回の結果と採用した指摘を `investigator` に渡して調べ直させ、
受け入れないなら理由を Issue に書く。

## フェーズ 5〜7: 無い

**ソースの変更が要ると分かったら、この Issue では行わない。** 種類の提案を添えて新しい Issue を
立て、この Issue からリンクする(種類のラベルは `SKILL.md` フェーズ 1「種類の確定」で決める)。

## フェーズ 8: 結果を書いて閉じる

1. 調査結果(答え・確かめ方・未検証)と、続きの Issue のリンクを Issue に書く
2. **Issue を手で閉じる**(`AGENTS.md`「着手した Issue は、その回で閉じる」の例外)。閉じる起点に
   なる PR が無いので、閉じないと「PR を出さずに止まったもの」と見分けがつかない

   ```bash
   gh api -X PATCH 'repos/{owner}/{repo}/issues/<番号>' -f state=closed -f state_reason=completed
   ```

`harness-record` は行わない。記録はマージした PR ごとに残すもので、この種類には PR が無い。
