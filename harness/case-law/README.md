# 判例

`rules/` から切り出した**実例**の置き場。規範と判例の分け方と、常時ロードしない理由は
`AGENTS.md`「規範と判例を分ける」。

## 誰がいつ読むか

| 読む人 | いつ |
| --- | --- |
| `plan-reviewer` / 実装の検証の観点別エージェント(`*-reviewer`) | 検証のたび(`rules/` と対で読む) |
| 実装するエージェント | **その分類で実際に迷ったとき / 指摘を受けたとき**だけ |

## 誰が書くか

**判断を書くのは `harness-growth` だけ**(`.claude/skills/harness-growth/`)。判断は、起きたこと・
NG / OK の形・判定の分かれ目・機械化できるかの結論を指す。判例は介入先の 1 つ(フックにできない
ものの置き場)なので、`harness-record` は触らない(規範も変えないので、下の写し・参照の直しも起きない)。

- 見出しは**分類**(`harness-record/templates/record.md`「分類の語彙」)で引けるようにし、
  その下に **NG / OK の形と判定の分かれ目**を書く
- **過去の判断を書き換えない。** 判断が変わったら新しい判例を足し、古いほうに「この判断は
  <PR> で更新された」の 1 行を添える
- 規範の写し・規範への参照は判断ではなく、規範に合わせて直すのは書き換えに当たらない。規範を
  変えた回のスキル(`implementation-flow` / `harness-growth`)が直し、食い違いを見つけた回も
  その PR で直してよい(→「規範を変えたとき」)。綴りでの前例は `.claude/hooks/README.md` の
  `named-path-violations.py` の項

## 規範を変えたとき

判例・記録(`harness/case-law/` `harness/records/`)の外にある文書の、既存の文・節名・語の意味を
変える/消す回は、判例に残るその写し・参照を**同じ PR で**直す。#712 の規範変更に判例が追いつかない
まま #938 がマージされ、#952 まで食い違いが残った。

1. **探す。** 変える前の文から 10 字ほどの句を取り、`grep -rn '<句>' harness/case-law/` で引く。
   判例は全角括弧で写し、途中で折り返すので、括弧・`**`・行末をまたがない位置で切る。節名を
   変えるなら `grep -rn '「<旧い名前>」' harness/case-law/`。語に新しい意味を与えた・意味を
   狭めたなら、その語でも引く
2. **分ける。** 迷ったら判断として扱う
   - 写し(規範の文をなぞるだけ)→ 消す。写し元が `AGENTS.md` / `rules/` 以外(常時ロードの外)
     なら、写し元の節への参照 1 行に置き換える。新しい文へ写し直さない
   - 参照(節名・規範の語)→ 新しい名前・語に合わせる
   - 判断 → 書き換えない(「誰が書くか」)

規範から判例へ移した文(`harness-growth`「縮める」)は写しではない(移した先が原本)。

フックにしないのは、規範から判例へ移した文と意味を変えた文が字面では区別できないから。判例が
できて以降 `rules/` を触ったマージ 29 本で再生すると 12 本で当たり、追随が要ったのは 1 本だけだった。

## ファイルの対応

| 判例 | 対応する規範 |
| --- | --- |
| [architecture.md](architecture.md) | `rules/architecture.md` |
| [coding.md](coding.md) | `rules/coding.md` |
| [naming.md](naming.md) | `rules/naming.md` |
| [consistency.md](consistency.md) | `rules/consistency.md` |
| [testing.md](testing.md) | `rules/testing.md` |
| [ui.md](ui.md) | `rules/ui-verification.md` |
| [planning.md](planning.md) | `implementation-flow` フェーズ 3〜4(規範は `.claude/agents/plan-reviewer.md`) |
| [process.md](process.md) | ハーネスの運用そのもの(サブエージェント・フック環境・規約の書き換え) |
