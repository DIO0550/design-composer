# 判例

`rules/` から切り出した**実例**の置き場。規範（こうする）は `rules/`、判例（この回こうだった）は
ここ、という分担にする。

## なぜ分けるか

**判例は毎回増え、規範は増えない。** 同じファイルに置くと総量が単調増加し、常時ロードされる
`rules/` が膨らみ続ける。実際、分ける直前の `rules/` は 1,065 行あり、うち NG/OK 表・
実シンボルの名指し・PR 番号への言及が 4 割近くを占めていた。

もう 1 つの理由は**リポジトリ特化**。`TypographyToken` `LeftPaneViews` `denyingIpc` のような
このリポジトリにしか無い名前が規約本文に混ざると、規約が「別のリポジトリへ持っていけないもの」に
なる。判断軸は **「別のリポジトリへ持っていって意味が通るか」**。通るなら `rules/`、
通らないならここ。

## 誰がいつ読むか

| 読む人 | いつ |
| --- | --- |
| `plan-reviewer` / `implementation-reviewer` | 検証のたび（`rules/` と対で読む） |
| 実装するエージェント | **その分類で実際に迷ったとき / 指摘を受けたとき**だけ |

常時ロードはしない（`CLAUDE.md` の `@` import に入れない）。**入れた時点で分けた意味が消える。**

## 誰が書くか

**`harness-growth` だけ**（`.claude/skills/harness-growth/`）。記録から判例へ昇格させるのは
介入の一形態なので、`harness-record` は触らない。

- 判例は**分類タグ**（`harness-record/templates/record.md`「分類の語彙」）で引けるようにする
- **過去の判例を書き換えない。** 判断が変わったら新しい判例を足し、古いほうに「この判断は
  <PR> で更新された」の 1 行を添える

## ファイルの対応

| 判例 | 対応する規範 |
| --- | --- |
| [architecture.md](architecture.md) | `rules/architecture.md` |
| [coding.md](coding.md) | `rules/coding.md` |
| [naming.md](naming.md) | `rules/naming.md` |
| [testing.md](testing.md) | `rules/testing.md` |
| [ui.md](ui.md) | `rules/ui-verification.md` |
| [planning.md](planning.md) | `implementation-flow` フェーズ 3〜4（規範は `.claude/agents/plan-reviewer.md`） |
| [process.md](process.md) | ハーネスの運用そのもの（サブエージェント・フック環境・規約の書き換え） |
