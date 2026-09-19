# harness/records — マージ後の評価記録

マージされた PR 1 本につき `pr-<番号>.md` を 1 ファイル置く。
書くのは `harness-record` スキル(`.claude/skills/harness-record/`)。
数えて手を入れるのは `harness-growth` スキル(`.claude/skills/harness-growth/`)。

**`.claude/` の下には置かない。** 記録はマージのたびに必ず 1 ファイル増えるが、
`.claude/` 配下への書き込みは編集のたびに承認を求められる。

## 何のためにあるか

**人・bot・CI へ届いた指摘を、分類ごとに数えるための材料。** 指摘がレビューコメントに
散っている限り横断して数えられないので、分類タグを付けた形でマージのたびに 1 ファイル残す。

## 数え方

```bash
bash harness/records/count.sh              # 分類ごとの再発(人・bot・CI)・内部・通算・以降・窓の開始・最終介入
bash harness/records/count.sh --shrink     # 縮める側(常時ロードの行数・判例へ落とす候補・装置の発火)
bash harness/records/count.sh --list <分類> # 窓が開いてからの指摘を 1 件 1 行で
bash harness/records/count.sh --ratchet    # 行数を予算と突き合わせる(ずれていれば exit 1)
bash harness/records/count-cases.sh        # 上の数え方と終了コードの判定表
```

`--ratchet` と `count-cases.sh` は `harness/githooks/pre-push` と CI の `rules-check` が呼ぶ。

**通算ではなく「まだ閉じていない窓の中」で数える**(通算は単調増加するので、介入が効いたかを
表さない)。窓を閉じるのは、介入した回の記録に `harness-growth` が書く次の行。

```markdown
- 対策済: `naming` 層=hook at pr-168
```

**窓は畳む前の綴りごとに持つ。** 亜種(`naming-precedent` など)への介入はその綴りの窓だけを
閉じ、分類名(`naming`)で書かれた `対策済` がその分類の窓をすべて閉じる。亜種 1 つへの介入で
分類全体の窓を閉じると、いちばん外へ漏れている形が畳んだ瞬間に見えなくなるため。

**サブエージェントの指摘は再発に数えない。** 観点を足すほど指摘が増えて再発に見えるため、
数えると検証エージェントの饒舌さを最適化することになる。

## 書き方

形式・層の語彙・分類の語彙は `.claude/skills/harness-record/templates/record.md`。

- 指摘 1 件 = 1 ブロック(まとめない)
- 指摘 0 件の回も記録を残す(「順調だった」もデータ)
- **過去の記録は書き換えない。** 判断が変わったら新しい記録に書く。旧語彙の分類は
  `count.sh` が読むときに畳む
