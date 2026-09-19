# 判例

`rules/` から切り出した**実例**の置き場。規範(こうする)は `rules/`、判例(この回こうだった /
NG・OK の実例 / このリポジトリ固有のシンボル名 / PR 番号)はここ、という分担にする。

判断軸は**「別のリポジトリへ持っていって意味が通るか」**。通るなら `rules/`、通らないならここ。
同じファイルに置くと常時ロードが単調増加するので、常時ロードはしない(`CLAUDE.md` の `@` import に
入れない)。

## 誰がいつ読むか

| 読む人 | いつ |
| --- | --- |
| `plan-reviewer` / `implementation-reviewer` | 検証のたび(`rules/` と対で読む) |
| 実装するエージェント | **その分類で実際に迷ったとき / 指摘を受けたとき**だけ |

## 誰が書くか

**`harness-growth` だけ**(`.claude/skills/harness-growth/`)。判例は介入先の 1 つ
(フックにできないものの置き場)なので、`harness-record` は触らない。

- 見出しは**分類**(`harness-record/templates/record.md`「分類の語彙」)で引けるようにし、
  その下に **NG / OK の形と判定の分かれ目**を書く
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
| [planning.md](planning.md) | `implementation-flow` フェーズ 3〜4(規範は `.claude/agents/plan-reviewer.md`) |
| [process.md](process.md) | ハーネスの運用そのもの(サブエージェント・フック環境・規約の書き換え) |
