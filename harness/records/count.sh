#!/usr/bin/env bash
#
# 分類ごとの「最後の介入以降の再発数」を数える。
# harness-growth スキル（.claude/skills/harness-growth/SKILL.md）の Step 1 / Step 3 の入力。
#
# 読むのは記録の次の 2 種類の行:
#   - 分類: `<分類>`                       … 指摘 1 件
#   - 対策済: `<分類>` 層=<層> at pr-<番号> … その回に介入したこと
#
# 使い方:
#   count.sh            分類ごとの再発数・通算・以降・最終介入を出す
#   count.sh --unused   語彙表にあるが記録に 1 件も出ていない分類を出す（Step 3 の棚卸し）
#
# 出力の列:
#   再発      最後の介入より後の記録に出た件数。2a / 2b / 2c の判断はこれで行う
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
  total=0
  after=0
  for record in pr-*.md; do
    number="${record#pr-}"
    number="${number%.md}"
    count="$(grep -c "^- 分類: \`$tag\`" "$record" || true)"
    total=$((total + count))
    [ "$number" -gt "$last_pr" ] || continue
    recurrence=$((recurrence + count))
    after=$((after + 1))
  done

  body="${body}$(printf '%4d  %4d  %4d  %-22s %s' \
    "$recurrence" "$total" "$after" "$tag" "$intervention")
"
done

printf '%s\n' "再発  通算  以降  分類                   最終介入"
printf '%s' "$body" | sort -rn
