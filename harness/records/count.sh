#!/usr/bin/env bash
#
# 分類ごとに「最後の介入より後に、人・bot・CI へ届いた指摘の数」を数える。
# harness-growth スキル(.claude/skills/harness-growth/SKILL.md)の入力。
#
# 読むのは記録の次の 3 種類の行:
#   - 分類: `<分類>`                        … 指摘 1 件
#   - 出どころ: `<出どころ>`                … 直前の「分類」の指摘を誰が見つけたか
#   - 対策済: `<分類>` 層=<層> at pr-<番号>  … その回に介入したこと(次回の起点)
#
# 使い方:
#   count.sh                 分類ごとの再発・内部・通算・以降・最終介入を出す
#   count.sh --shrink        縮める側の数字を出す(常時ロードの行数・判例へ落とす候補・装置の発火)
#   count.sh --list <分類>   その分類の、最後の介入より後の指摘を 1 件 1 行で出す
#   count.sh --unused        語彙表にあるが記録に 1 件も出ていない分類だけを出す
#
# 出力の列:
#   再発      最後の介入より後の記録で、出どころが人・bot・CI だった件数。分岐はこれで決める。
#             サブエージェントの指摘を混ぜないのは、観点を足すほど指摘が増えて再発に見える
#             (数えているのが成果ではなく検証エージェントの饒舌さになる)ため
#   内部      同じ期間で、出どころがサブエージェント・フック・自己修正だった件数。参考値
#   通算      全記録での、再発と同じ種類の件数
#   以降      最後の介入より後の記録の本数(「介入後 N 本再発ゼロ」の N)
#   最終介入  最後に置いた層と、その回の PR 番号。無ければ「未介入」
#
# 旧語彙(細かく割っていた分類)は読むときに現在の語彙へ畳む(fold_tag)。過去の記録は
# 書き換えない規約なので、対応表を記録側ではなくここに持つ。
set -euo pipefail

cd "$(dirname "$0")"

vocabulary="../../.claude/skills/harness-record/templates/record.md"

# 常時ロード(AGENTS.md + rules/)の上限。足すなら同量削るのが規約で、この値は下げるだけ
# (縮めたら実測に合わせて下げる。上げない)。
always_loaded_cap=823
growth_skill_cap=100

# 記録を読む awk が共有する関数。
awk_common='
  # 旧語彙を現在の語彙へ畳む。対応表は record.md「分類の語彙」の「旧語彙」と同じ
  function fold_tag(tag) {
    if (tag ~ /^(ownership-|domain-|logic-ownership|service-placement|utils-form)/) return "ownership"
    if (tag ~ /^(layer-dependency|module-api)$/) return "dependency"
    if (tag ~ /^(companion-object|immutability|result-option|signature|type-vocabulary|illegal-state)$/) return "type"
    if (tag ~ /^duplication/) return "duplication"
    if (tag ~ /^naming/) return "naming"
    if (tag ~ /^comment/) return "comment"
    if (tag ~ /^test/) return "test"
    if (tag ~ /^(effect|state-management|ref-guard|composition|nested-interactive-event-boundary)$/) return "react"
    if (tag ~ /^(ui-|vrt-blind-spot|drag-feedback-incomplete)/) return "ui"
    if (tag ~ /^(plan|version-bump-unverified)/) return "plan"
    if (tag ~ /^(rules-consistency|docs-consistency|subagent-control|hook-environment|tooling-rule-scope-gap|harness-process-drift|tool-behavior-unverified)/) return "harness"
    return tag
  }
  # 出どころが人・bot・CI か。括弧なしの `レビュー` と `レビュー（人間）` 等は、
  # 語彙を決める前の記録で人のレビューを指していた綴り
  function reached_outside(line) {
    if (line ~ /^- 出どころ: *`?レビュー`? *$/) return 1
    if (line ~ /^- 出どころ: *`?レビュー（(人間|人|human|オーナー|owner|Copilot|bot)）/) return 1
    if (line ~ /^- 出どころ: *`?CI/) return 1
    return 0
  }
  function record_number(path) {
    sub(/^pr-/, "", path); sub(/\.md$/, "", path)
    return path + 0
  }
  function tag_of(line) {
    sub(/^- [^`]*`/, "", line); sub(/`.*/, "", line)
    return fold_tag(line)
  }
  function intervention_pr(line) {
    sub(/.* at pr-/, "", line); sub(/[^0-9].*/, "", line)
    return line + 0
  }
'

# 記録を 1 パスで読み、分類ごとの集計行を返す(列は「出力の列」のとおり)。
# 既定の表と --shrink の両方が読むので、数え方をここ 1 箇所に持つ。
summary_rows() {
  awk "$awk_common"'
    FNR == 1 { number = record_number(FILENAME); records[number] = 1 }
    /^- 分類: `/ { pending = tag_of($0); next }
    /^- 出どころ:/ && pending != "" {
      if (reached_outside($0)) outside[pending, number]++
      else inside[pending, number]++
      seen[pending] = 1
      pending = ""
      next
    }
    /^- 対策済: `/ {
      tag = tag_of($0)
      at = intervention_pr($0)
      layer = $0; sub(/.*層=/, "", layer); sub(/ .*/, "", layer)
      if (at > last_pr[tag]) { last_pr[tag] = at; last_layer[tag] = layer }
      seen[tag] = 1
      next
    }
    END {
      for (tag in seen) {
        recurrence = internal = total = after = 0
        for (number in records) {
          total += outside[tag, number]
          if (number + 0 <= last_pr[tag] + 0) continue
          recurrence += outside[tag, number]
          internal += inside[tag, number]
          after++
        }
        intervention = (tag in last_pr) ? "pr-" last_pr[tag] "（層=" last_layer[tag] "）" : "未介入"
        printf "%4d  %4d  %4d  %4d  %-12s %s\n", recurrence, internal, total, after, tag, intervention
      }
    }
  ' pr-*.md
}

# 指定した分類の、最後の介入より後の指摘を「pr-<番号>  <出どころ>  <見出し>」で返す。
# 人・bot・CI 由来を先に出す。
list_findings() {
  awk -v want="$1" "$awk_common"'
    FNR == 1 { number = record_number(FILENAME) }
    /^### / { heading = $0; sub(/^### /, "", heading) }
    /^- 分類: `/ { pending = (tag_of($0) == want); next }
    /^- 出どころ:/ && pending {
      source = $0; sub(/^- 出どころ: */, "", source); gsub(/`/, "", source)
      lines[++n] = sprintf("%d\tpr-%d  %-36s  %s", !reached_outside($0), number, source, heading)
      pending = 0
      next
    }
    /^- 対策済: `/ && tag_of($0) == want {
      at = intervention_pr($0)
      if (at > last_pr) last_pr = at
      next
    }
    END {
      for (i = 1; i <= n; i++) {
        split(lines[i], parts, "\t")
        pr = parts[2]; sub(/^pr-/, "", pr); sub(/ .*/, "", pr)
        if (pr + 0 > last_pr + 0) print lines[i]
      }
    }
  ' pr-*.md | sort -s -k1,1n | cut -f2-
}

# 語彙表にあるのに記録へ 1 件も出ていない分類を 1 行 1 件で返す。
unused_tags() {
  used="$(summary_rows | awk '{print $5}')"
  awk '/^## 分類の語彙/{inside=1; next} /^## /{inside=0} inside' "$vocabulary" \
    | sed -n 's/^| `\([^`]*\)` | .*/\1/p' | sort -u | while read -r tag; do
    printf '%s\n' "$used" | grep -qx "$tag" || printf '%s\n' "$tag"
  done
}

if [ "${1:-}" = "--unused" ]; then
  printf '%s\n' "記録に 1 件も出ていない分類（語彙表: ${vocabulary}）"
  unused_tags | sed 's/^/  /'
  exit 0
fi

if [ "${1:-}" = "--list" ]; then
  [ -n "${2:-}" ] || { echo "usage: count.sh --list <分類>" >&2; exit 2; }
  list_findings "$2"
  exit 0
fi

if [ "${1:-}" = "--shrink" ]; then
  printf '%s\n\n' "縮める側の数字（harness-growth の SKILL.md「縮める」）"

  printf '%s\n' "1. 常時ロードの行数（上限は下げるだけ。超えていたら足す前に削る）"
  loaded="$(cd ../.. && wc -l AGENTS.md rules/*.md | tail -1 | awk '{print $1}')"
  growth="$(wc -l < ../../.claude/skills/harness-growth/SKILL.md)"
  printf '     %-34s %4s / %s 行%s\n' "AGENTS.md + rules/" "$loaded" "$always_loaded_cap" \
    "$([ "$loaded" -gt "$always_loaded_cap" ] && printf ' ← 超過' || true)"
  printf '     %-34s %4s / %s 行%s\n\n' "harness-growth/SKILL.md" "$growth" "$growth_skill_cap" \
    "$([ "$growth" -gt "$growth_skill_cap" ] && printf ' ← 超過' || true)"

  # 人・CI に 10 本以上届いていない分類は、常時ロードに実例まで持ち続ける理由が無い
  # (フックで守れているか、このリポジトリでは起きていないかのどちらか)。判例へ落とす候補
  printf '%s\n' "2. 判例へ落とす候補（以降 10 本以上で再発 0。内部は検証エージェントが拾っている数）"
  candidates="$(summary_rows | awk '$1 == 0 && $4 >= 10 {printf "     %-12s 内部=%-4s 以降=%-4s 最終介入=%s\n", $5, $2, $4, $6}' | sort)"
  printf '%s\n\n' "${candidates:-     該当なし}"

  printf '%s\n' "3. 未使用の分類"
  unused="$(unused_tags | sed 's/^/     /')"
  printf '%s\n\n' "${unused:-     該当なし}"

  # 装置(スキル・エージェント)の退役候補。記録の「## 発火」の行から数える。
  # フックは数えない(予防装置は発火 0 が「効いている」でありうる)
  printf '%s\n' "4. 装置の退役候補（発火を計測できた記録 10 本から判断）"
  measured=0
  for record in pr-*.md; do
    grep -qE '^- 発火: (`|無し)' "$record" && measured=$((measured + 1))
  done
  printf '   %s\n' "発火を計測できた記録: ${measured} 本"
  if [ "$measured" -lt 10 ]; then
    printf '   %s\n' "(10 本未満のため候補は出さない)"
    exit 0
  fi
  printf '%s\n' "   計測した記録での発火回数:"
  grep -hoE '^- 発火: `[^`]+` [0-9]+回' pr-*.md \
    | sed 's/^- 発火: `\([^`]*\)` \([0-9]*\)回/\1 \2/' \
    | awk '{sum[$1] += $2} END {for (name in sum) printf "     %-34s %4d 回\n", name, sum[name]}' \
    | sort -k2 -rn
  printf '%s\n' "   計測した記録で発火 0 のリポジトリ内装置:"
  for device in ../../.claude/skills/*/ ../../.claude/agents/*.md; do
    name="$(basename "$device" .md)"
    grep -qE "^- 発火: \`$name\`" pr-*.md || printf '     %s\n' "$name"
  done
  exit 0
fi

printf '%s\n' "再発  内部  通算  以降  分類         最終介入"
# 再発が同数なら内部の多い順(検証エージェントが拾い続けている側が分かる)
summary_rows | sort -k1,1rn -k2,2rn
