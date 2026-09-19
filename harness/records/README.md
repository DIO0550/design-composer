# harness/records — マージ後の評価記録

マージされた PR 1 本につき `pr-<番号>.md` を 1 ファイル置く。
書くのは `harness-record` スキル(`.claude/skills/harness-record/`)。
数えて手を入れるのは `harness-growth` スキル(`.claude/skills/harness-growth/`)。

**`.claude/` の下には置かない。** 記録はマージのたびに必ず 1 ファイル増えるが、
`.claude/` 配下への書き込みは編集のたびに承認を求められる。記録を残すこと自体が
目的なのに、毎回そこで人の手を止めるのは割に合わない。読み書きの頻度が高い
成果物はリポジトリの通常のフォルダに置く。

## 何のためにあるか

`AGENTS.md`「規範の更新」は「**人・bot・CI へ届いた**指摘が 2 回以上出たら規範の抜けとして
扱う」と定めている。ここはその**回数を数えるための材料**。指摘がレビューコメントに散って
いる限り横断して数えられないので、分類タグを付けた形でマージのたびに 1 ファイル残す。

## 数え方

```bash
bash harness/records/count.sh            # 分類ごとの再発
bash harness/records/count.sh --shrink   # 縮める候補
bash harness/records/count.sh --ratchet  # 常時ロードの行数（ずれていれば exit 1）
```

分類ごとに「**起点以降**に人・bot・CI へ届いた件数(再発)」「同じ区間でサブエージェント・
自己修正・フックが捕まえた件数(内部)」「通算」「起点以降の記録の本数」「起点」を出す。

**評価を決めるのは人。分岐に使うのは再発だけ**で、内部は分岐に使わない。理由は
`.claude/skills/harness-record/templates/record.md`「なぜ外部だけで分岐するのか」。

再発を数えられるのは、介入した回の記録に次の行が入っているため。この行を書けるのは
`harness-growth` だけで、`count.sh` は「ここから数え直す」の起点として読む。

```markdown
- 対策済: `naming` 層=hook at pr-<介入した PR の番号>
```

**再発は畳む前の綴りごとに数える。** 過去の記録には細かい分類が残っているが書き換えず、
`count.sh` の `TagFolds` がいまの 13 語彙へ畳む(数え方は `count.sh` の冒頭)。

## 書き方

形式・分類・出どころ・層の語彙は `.claude/skills/harness-record/templates/record.md`。

- 指摘 1 件 = 1 ブロック(まとめない)
- 指摘 0 件の回も記録を残す(「順調だった」もデータ)
- **過去の記録は書き換えない。** 判断が変わったら新しい記録に書く
