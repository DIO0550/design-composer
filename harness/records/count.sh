#!/usr/bin/env bash
#
# 分類ごとに「窓が開いてから、人・bot・CI へ届いた指摘の数」を数える。
# harness-growth スキル(.claude/skills/harness-growth/SKILL.md)の入力。
#
# 読むのは記録の次の 3 種類の行:
#   - 分類: `<分類>`                        … 指摘 1 件
#   - 出どころ: `<出どころ>`                … 直前の「分類」の指摘を誰が見つけたか
#   - 対策済: `<分類>` 層=<層> at pr-<番号>  … その回に介入したこと(窓を閉じる)
#
# 使い方:
#   count.sh                 分類ごとの再発・内部・通算・以降・起点を出す
#   count.sh --shrink        縮める側の数字を出す(行数のラチェット・判例へ落とす候補・装置の発火)
#   count.sh --list <分類>   その分類の、窓が開いてからの指摘を 1 件 1 行で出す
#   count.sh --ratchet       常時ロードと harness-growth スキルの行数を予算と突き合わせる。
#                            ずれていれば exit 1(git hooks と CI が呼ぶ)
#
# 出力の列:
#   再発  窓が開いてからの記録で、出どころが人・bot・CI だった件数。分岐はこれで決める。
#         サブエージェントの指摘を混ぜないのは、観点を足すほど指摘が増えて再発に見える
#         (数えているのが成果ではなく検証エージェントの饒舌さになる)ため
#   内部  同じ期間で、出どころがサブエージェント・フック・自己修正だった件数。参考値
#   通算  全記録での、再発と同じ種類の件数
#   以降  その分類でいちばん古い窓が開いてからの記録の本数
#   起点  その分類でいちばん古い、まだ開いている窓(その介入の層と PR 番号)。
#         未介入の綴りが 1 つでもあれば「未介入」
#
# 旧語彙(細かく割っていた分類)は読むときに現在の語彙へ畳む(fold_tag)。過去の記録は
# 書き換えない規約なので、対応表を記録側ではなくここに持つ。
#
# 窓は畳む前の綴りごとに持つ。1 つの綴りへ介入しても、同じ分類へ畳まれる別の綴りの窓は
# 閉じない(閉じると、いちばん外へ漏れている形が畳んだ瞬間に見えなくなる)。現在の分類名
# そのもので書かれた `対策済` だけが、その分類へ畳まれる綴りすべての窓を閉じる。
set -euo pipefail

cd "$(dirname "$0")"

# 常時ロード(AGENTS.md + rules/)と harness-growth スキルの行数の予算。
# ラチェット: 足すなら同量削り、縮めたら実測に合わせて下げる。上げない。
always_loaded_cap=815
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
  # 行に書かれた綴りそのもの(畳まない)
  function spelling_of(line) {
    sub(/^- [^`]*`/, "", line); sub(/`.*/, "", line)
    return line
  }
  function intervention_pr(line) {
    sub(/.* at pr-/, "", line); sub(/[^0-9].*/, "", line)
    return line + 0
  }
  function intervention_layer(line) {
    sub(/.*層=/, "", line); sub(/ .*/, "", line)
    return line
  }
  # 対策済の行を読み、その綴りの窓を閉じた PR 番号と層を記録する
  function close_window(line,    s, at) {
    s = spelling_of(line); at = intervention_pr(line)
    spellings[s] = 1
    if (at > closed_at[s]) { closed_at[s] = at; closed_layer[s] = intervention_layer(line) }
  }
  # その綴りの窓が開いた記録番号。自分への介入と、畳み先の分類名そのものへの介入の新しいほう
  function window_of(s,    t, w) {
    t = fold_tag(s); w = closed_at[s] + 0
    if (closed_at[t] + 0 > w) w = closed_at[t] + 0
    return w
  }
  function window_layer(s,    t) {
    t = fold_tag(s)
    return (closed_at[t] + 0 > closed_at[s] + 0) ? closed_layer[t] : closed_layer[s]
  }
'

# 記録を 1 パスで読み、分類ごとの集計行を返す(列は「出力の列」のとおり)。
# 既定の表と --shrink の両方が読むので、数え方をここ 1 箇所に持つ。
summary_rows() {
  awk "$awk_common"'
    FNR == 1 { number = record_number(FILENAME); records[number] = 1 }
    /^- 分類: `/ { pending = spelling_of($0); next }
    /^- 出どころ:/ && pending != "" {
      if (reached_outside($0)) outside[pending, number]++
      else inside[pending, number]++
      spellings[pending] = 1
      pending = ""
      next
    }
    /^- 対策済: `/ { close_window($0); next }
    END {
      for (s in spellings) tags[fold_tag(s)] = 1
      for (tag in tags) {
        recurrence = internal = total = 0
        oldest = -1
        for (s in spellings) {
          if (fold_tag(s) != tag) continue
          w = window_of(s)
          if (oldest < 0 || w < oldest) { oldest = w; oldest_layer = window_layer(s) }
          for (number in records) {
            total += outside[s, number]
            if (number + 0 <= w) continue
            recurrence += outside[s, number]
            internal += inside[s, number]
          }
        }
        after = 0
        for (number in records) if (number + 0 > oldest) after++
        origin = (oldest > 0) ? "pr-" oldest "（層=" oldest_layer "）" : "未介入"
        printf "%4d  %4d  %4d  %4d  %-12s %s\n", recurrence, internal, total, after, tag, origin
      }
    }
  ' pr-*.md
}

# 指定した分類の、窓が開いてからの指摘を「pr-<番号>  <出どころ>  <見出し>」で返す。
# 人・bot・CI 由来を先に出す。
list_findings() {
  awk -v want="$1" "$awk_common"'
    FNR == 1 { number = record_number(FILENAME) }
    /^### / { heading = $0; sub(/^### /, "", heading) }
    /^- 分類: `/ { pending = spelling_of($0); if (fold_tag(pending) != want) pending = ""; next }
    /^- 出どころ:/ && pending != "" {
      source = $0; sub(/^- 出どころ: */, "", source); gsub(/`/, "", source)
      n++
      finding_spelling[n] = pending
      finding_number[n] = number
      lines[n] = sprintf("%d\tpr-%d  %-36s  %s", !reached_outside($0), number, source, heading)
      pending = ""
      next
    }
    /^- 対策済: `/ { close_window($0); next }
    END {
      for (i = 1; i <= n; i++) {
        if (finding_number[i] > window_of(finding_spelling[i])) print lines[i]
      }
    }
  ' pr-*.md | sort -s -k1,1n | cut -f2-
}

# AGENTS.md + rules/ の行数
loaded_lines() {
  (cd ../.. && wc -l AGENTS.md rules/*.md | tail -1 | awk '{print $1}')
}

# 予算と実測を突き合わせて 1 行出し、ずれていれば 1 を返す。
# 引数: <対象名> <実測> <予算> <予算を持つ変数名>
check_budget() {
  if [ "$2" -gt "$3" ]; then
    printf '%s が予算を超えています: %s / %s 行 — 足した分と同量を削るか、判例・フックへ移す\n' "$1" "$2" "$3"
    return 1
  fi
  if [ "$2" -lt "$3" ]; then
    printf '%s が予算を下回りました: %s / %s 行 — count.sh の %s を %s へ下げる(上げない)\n' "$1" "$2" "$3" "$4" "$2"
    return 1
  fi
  printf '%s: %s / %s 行\n' "$1" "$2" "$3"
}

# 行数の予算を 2 つとも突き合わせる。どちらかがずれていれば 1 を返す。
check_budgets() {
  status=0
  check_budget "常時ロード(AGENTS.md + rules/)" "$(loaded_lines)" "$always_loaded_cap" always_loaded_cap || status=1
  check_budget "harness-growth/SKILL.md" "$(wc -l < ../../.claude/skills/harness-growth/SKILL.md)" \
    "$growth_skill_cap" growth_skill_cap || status=1
  return "$status"
}

if [ "${1:-}" = "--ratchet" ]; then
  check_budgets
  exit $?
fi

if [ "${1:-}" = "--list" ]; then
  [ -n "${2:-}" ] || { echo "usage: count.sh --list <分類>" >&2; exit 2; }
  list_findings "$2"
  exit 0
fi

if [ "${1:-}" = "--shrink" ]; then
  printf '%s\n\n' "縮める側の数字（harness-growth の SKILL.md「縮める」）"

  printf '%s\n' "1. 行数のラチェット（予算は下げるだけ。ずれていれば pre-push と CI が落とす）"
  check_budgets | sed 's/^/     /' || true
  printf '\n'

  # 人・CI に 10 本以上届いていない分類は、常時ロードに実例まで持ち続ける理由が無い
  # (フックで守れているか、このリポジトリでは起きていないかのどちらか)。判例へ落とす候補
  printf '%s\n' "2. 判例へ落とす候補（以降 10 本以上で再発 0。内部は検証エージェントが拾っている数）"
  candidates="$(summary_rows | awk '$1 == 0 && $4 >= 10 {printf "     %-12s 内部=%-4s 以降=%-4s 起点=%s\n", $5, $2, $4, $6}' | sort)"
  printf '%s\n\n' "${candidates:-     該当なし}"

  # 装置(スキル・エージェント)の退役候補。記録の「## 発火」の行から数える。
  # フックは数えない(予防装置は発火 0 が「効いている」でありうる)
  printf '%s\n' "3. 装置の退役候補（発火を計測できた記録 10 本から判断）"
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

printf '%s\n' "再発  内部  通算  以降  分類         起点"
# 再発が同数なら内部の多い順(検証エージェントが拾い続けている側が分かる)
summary_rows | sort -k1,1rn -k2,2rn
