#!/usr/bin/env bash
#
# 分類ごとの「最後の介入以降の再発数」を数える。
# harness-growth スキル（.claude/skills/harness-growth/SKILL.md）の Step 1 / Step 3 の入力。
#
# 読むのは記録の次の 3 種類の行:
#   - 分類: `<分類>`                       … 指摘 1 件
#   - 出どころ: `<出どころ>`               … 直前の「分類」の指摘を誰が見つけたか
#   - 対策済: `<分類>` 層=<層> at pr-<番号> … その回に介入したこと
#
# 使い方:
#   count.sh            分類ごとの再発数・すり抜け・通算・以降・最終介入を出す
#   count.sh --unused   語彙表にあるが記録に 1 件も出ていない分類を出す（Step 3 の棚卸し）
#
# 出力の列:
#   再発      最後の介入より後の記録に出た件数。2a / 2b / 2c の判断はこれで行う
#   すり抜け  再発のうち出どころが人・bot だった件数。plan-reviewer も
#             implementation-reviewer も捕まえられなかった＝ハーネスが効かなかった証拠。
#             サブエージェントが捕まえた分は逆に効いた証拠なので、混ぜて数えない
#   通算      全記録での件数。語彙が飽和していないかを目視するときの参考
#   以降      最後の介入より後の記録の本数（「介入後 N 本再発ゼロ」の N）
#   最終介入  最後に置いた層と、その回の PR 番号。無ければ「未介入」
set -euo pipefail

cd "$(dirname "$0")"

vocabulary="../../.claude/skills/harness-record/templates/record.md"

# --unused: 語彙表にあるのに記録へ 1 件も出ていない分類。
# 「効いているから 0」と「読まれていないから 0」は記録では区別できないので、
# 強制の有無での切り分けは harness-growth の Step 3 が行う。
if [ "${1:-}" = "--unused" ]; then
  used="$(grep -h '^- 分類: `' pr-*.md | sed 's/^- 分類: `\([^`]*\)`.*/\1/' | sort -u)"
  printf '%s\n' "記録に 1 件も出ていない分類（語彙表: ${vocabulary}）"
  # 「分類の語彙」の表だけを読む（同じ書式の「層の語彙」の表を拾わないため）
  awk '/^## 分類の語彙/{inside=1; next} /^## /{inside=0} inside' "$vocabulary" \
    | sed -n 's/^| `\([a-z-]*\)` | .*/\1/p' | sort -u | while read -r tag; do
    printf '%s\n' "$used" | grep -qx "$tag" || printf '  %s\n' "$tag"
  done
  exit 0
fi

# 1 つの記録の中で「分類」行と、その次に現れる「出どころ」行が指摘 1 件の対になる。
# 指定した分類の件数と、そのうち出どころが人・bot だった件数を "<件数> <すり抜け>" で返す。
#
# pr-317 以前は出どころの綴りが割れている（`レビュー` / `レビュー（人間）` /
# `レビュー（human）` / `レビュー（オーナー）` / `レビュー（Copilot）`）。過去の記録は
# 書き換えない規約なので、読む側が古い綴りも人・bot として扱う
# （.claude/skills/harness-record/templates/record.md「出どころの語彙」）。
count_tag() {
  awk -v want="$2" '
    /^- 分類: `/ {
      tag = $0
      sub(/^- 分類: `/, "", tag)
      sub(/`.*/, "", tag)
      pending = (tag == want)
      next
    }
    /^- 出どころ:/ {
      if (pending) {
        found++
        # 括弧なしの `レビュー` は pr-317 以前に人のレビューを指していた綴り。
        byBareReview = ($0 ~ /^- 出どころ: *`?レビュー`? *$/)
        # 語彙表の `レビュー（人）` `レビュー（bot）` と、それ以前の綴り。
        byHumanOrBot = ($0 ~ /^- 出どころ: *`?レビュー（(人間|人|human|オーナー|owner|Copilot|bot)）/)
        if (byBareReview || byHumanOrBot) {
          escaped++
        }
        pending = 0
      }
      next
    }
    END { printf "%d %d\n", found, escaped }
  ' "$1"
}

tags="$(grep -h '^- 分類: `' pr-*.md | sed 's/^- 分類: `\([^`]*\)`.*/\1/' | sort -u)"

body=""
for tag in $tags; do
  # 同じ分類の対策済が複数あれば、PR 番号が最大のものが最後の介入
  last="$( { grep -hoE "^- 対策済: \`$tag\` 層=[^ ]+ at pr-[0-9]+" pr-*.md || true; } \
    | sed 's/.*層=\([^ ]*\) at pr-\([0-9]*\)/\2 \1/' | sort -n | tail -1)"
  if [ -n "$last" ]; then
    last_pr="${last%% *}"
    intervention="pr-${last_pr}（層=${last##* }）"
  else
    last_pr=0
    intervention="未介入"
  fi

  recurrence=0
  escape=0
  total=0
  after=0
  for record in pr-*.md; do
    number="${record#pr-}"
    number="${number%.md}"
    read -r count escaped <<EOF
$(count_tag "$record" "$tag")
EOF
    total=$((total + count))
    [ "$number" -gt "$last_pr" ] || continue
    recurrence=$((recurrence + count))
    escape=$((escape + escaped))
    after=$((after + 1))
  done

  body="${body}$(printf '%4d  %8d  %4d  %4d  %-22s %s' \
    "$recurrence" "$escape" "$total" "$after" "$tag" "$intervention")
"
done

printf '%s\n' "再発  すり抜け  通算  以降  分類                   最終介入"
# 再発が同数なら、すり抜けが出ている分類を上に出す（効いていない側が分かっているため）
printf '%s' "$body" | sort -k1,1rn -k2,2rn
