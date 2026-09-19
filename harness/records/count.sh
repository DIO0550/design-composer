#!/usr/bin/env bash
#
# 分類ごとの「最後の介入以降に、人・bot・CI まで届いた件数」を数える。
# harness-growth スキル（.claude/skills/harness-growth/SKILL.md）の Step 1 / Step 5 の入力。
#
# 読むのは記録の次の 4 種類の行:
#   - 分類: `<分類>`                       … 指摘 1 件
#   - 出どころ: `<出どころ>`               … 直前の「分類」の指摘を誰が見つけたか
#   - 対策済: `<分類>` 層=<層> at pr-<番号> … その回に介入したこと
#   - 見送り: `<分類>` at pr-<番号>        … 縮める候補を見送ったこと（--shrink が数える）
#
# 使い方:
#   count.sh            分類ごとの再発・内部・通算・以降・起点を出す
#   count.sh --shrink   縮める側の条件を数字で出す
#   count.sh --ratchet  常時ロードの行数を予算と突き合わせる（ずれていれば exit 1）
#
# 出力の列:
#   再発  **人・bot・CI に届いた**件数。綴りごとに、その綴りの窓が開いてからの分を数える
#   内部  同じ区間で、サブエージェント・自己修正・フックが捕まえた件数。分岐には使わない
#         （理由は templates/record.md「なぜ外部だけで分岐するのか」）
#   通算  全記録での件数（再発・内部の合計）
#   以降  起点より後の記録の本数。**その分類でいちばん長く開いている窓の長さ**
#   起点  その分類でいちばん古い、まだ開いている窓。未介入の綴りが 1 つでもあれば「未介入」
#
# **再発は畳む前の綴りごとに数える。** 1 つの綴りへ介入しても、同じ分類へ畳まれる別の綴りの
# 窓までは閉じない（閉じると、いちばん外へ漏れている形が畳んだ瞬間に見えなくなる）。分類名
# そのもので書かれた `対策済` は、その分類へ畳まれる綴りすべての窓を閉じる。
#
# **この数え方を固定する検査は無い。** 境界の取り方を変えても落ちるものが無いので、変えるなら
# 出力を独立に数え直して突き合わせること（rules/coding.md「外部の挙動は動かして確かめる」）。
set -euo pipefail

cd "$(dirname "$0")"

# 常時ロード（AGENTS.md + rules/）と harness-growth スキルの行数の予算。
# **ラチェット: 下げるだけで、上げない**（AGENTS.md「常時ロードはラチェットで縮める」）。
LoadedBudget=845
GrowthSkillBudget=124

# 記録に書かれた分類を、いまの語彙へ畳む対応表（`<旧> <新>`。末尾の `*` は前方一致）。
# **過去の記録は書き換えない**規約なので、読む側がここで畳む
# （.claude/skills/harness-record/templates/record.md「分類の語彙」）。
TagFolds='
naming* naming
duplication* duplication
comment* comment
test* test
plan* plan
ui* ui
domain* placement
hook-environment* harness
version-bump-unverified plan
vrt-blind-spot ui
drag-feedback-incomplete ui
ownership-reasoning placement
logic-ownership placement
service-placement placement
layer-dependency placement
module-api placement
utils-form placement
companion-object typing
immutability typing
result-option typing
signature typing
type-vocabulary typing
illegal-state typing
effect state
state-management state
ref-guard state
composition component
nested-interactive-event-boundary component
rules-consistency harness
docs-consistency harness
tooling-rule-scope-gap harness
harness-process-drift harness
subagent-control harness
tool-behavior-unverified harness
'

# 分類ごとの集計行を返す。列は「再発 内部 通算 以降 見送り 分類 起点」で、整形は呼び出し側。
# 既定の表と --shrink の両方が読むので、数え方をここ 1 箇所に持つ。
summary_rows() {
  awk -v folds="$TagFolds" '
    BEGIN {
      lineCount = split(folds, lines, "\n")
      for (i = 1; i <= lineCount; i++) {
        if (lines[i] == "") continue
        split(lines[i], pair, " ")
        foldCount++
        foldFrom[foldCount] = pair[1]
        foldTo[foldCount] = pair[2]
      }
    }

    # 旧い綴りを対応表で畳む。表に無い綴りはそのまま返すので、語彙から外れた綴りは行として出る。
    function fold(tag,   i, pattern) {
      for (i = 1; i <= foldCount; i++) {
        pattern = foldFrom[i]
        if (pattern ~ /\*$/) {
          if (index(tag, substr(pattern, 1, length(pattern) - 1)) == 1) return foldTo[i]
        } else if (tag == pattern) {
          return foldTo[i]
        }
      }
      return tag
    }

    # 人・bot・CI に届いた指摘か。行頭の語で決める（`自己修正（CI の結果）` は自己修正）。
    # pr-317 以前は綴りが割れている（`レビュー` / `レビュー（人間）` / `レビュー（human）` /
    # `レビュー（オーナー）` / `レビュー（Copilot）`）ので、古い綴りも外部として読む。
    function isExternal(line) {
      if (line ~ /^- 出どころ: *`?レビュー`? *$/) return 1
      if (line ~ /^- 出どころ: *`?レビュー（(人間|人|human|オーナー|owner|Copilot|bot)）/) return 1
      if (line ~ /^- 出どころ: *`?CI[`（]/) return 1
      if (line ~ /^- 出どころ: *`?CI`? *$/) return 1
      return 0
    }

    # その綴りの窓が開いた記録番号。自分への介入と、畳み先の分類名そのものへの介入の新しいほう。
    function boundary(tag,   own, basket) {
      own = lastPr[tag]
      basket = lastPr[fold(tag)]
      return (own > basket) ? own : basket
    }

    FNR == 1 {
      number = FILENAME
      sub(/^pr-/, "", number)
      sub(/\.md$/, "", number)
      number = number + 0
      records[number] = 1
      pendingTag = ""
    }

    /^- 分類: `/ {
      pendingTag = $0
      sub(/^- 分類: `/, "", pendingTag)
      sub(/`.*/, "", pendingTag)
      next
    }

    /^- 出どころ:/ {
      if (pendingTag != "") {
        if (isExternal($0)) external[pendingTag, number]++
        else internal[pendingTag, number]++
        spelling[pendingTag] = 1
        pendingTag = ""
      }
      next
    }

    /^- 対策済: `/ {
      tag = $0; sub(/^- 対策済: `/, "", tag); sub(/`.*/, "", tag)
      layer = $0; sub(/.*層=/, "", layer); sub(/ .*/, "", layer)
      at = $0; sub(/.*at pr-/, "", at); sub(/[^0-9].*/, "", at); at = at + 0
      # 介入の層は hook / case-law の 2 つ。古い記録の `観点` は `skill` に畳んで読む
      # （.claude/skills/harness-record/templates/record.md「層の語彙」）。
      if (layer == "観点") layer = "skill"
      if (at >= lastPr[tag]) { lastPr[tag] = at; lastLayer[tag] = layer }
      intervened[tag] = 1
      next
    }

    /^- 見送り: `/ {
      tag = $0; sub(/^- 見送り: `/, "", tag); sub(/`.*/, "", tag)
      deferrals[fold(tag)]++
      next
    }

    END {
      for (tag in spelling) seen[fold(tag)] = 1
      for (tag in intervened) seen[fold(tag)] = 1

      for (key in external) { split(key, part, SUBSEP); total[fold(part[1])] += external[key] }
      for (key in internal) { split(key, part, SUBSEP); total[fold(part[1])] += internal[key] }

      # 起点はその分類でいちばん古い、まだ開いている窓（未介入の綴りが 1 つでもあれば 0）。
      for (tag in spelling) {
        basket = fold(tag)
        if (!(basket in oldest) || boundary(tag) < oldest[basket]) {
          oldest[basket] = boundary(tag)
          oldestLayer[basket] = (boundary(tag) == lastPr[tag]) ? lastLayer[tag] : lastLayer[basket]
        }
      }

      for (key in external) {
        split(key, part, SUBSEP)
        if (part[2] + 0 > boundary(part[1])) recurrence[fold(part[1])] += external[key]
      }
      for (key in internal) {
        split(key, part, SUBSEP)
        if (part[2] + 0 > boundary(part[1])) inside[fold(part[1])] += internal[key]
      }

      for (tag in seen) {
        after = 0
        # for (k in array) のキーは文字列なので、比較の前に両辺を数値へ寄せる
        # （文字列比較だと PR 番号が 4 桁になった瞬間に "1000" < "199" になる）
        for (number in records) if (number + 0 > oldest[tag] + 0) after++
        origin = (oldest[tag] > 0) \
          ? sprintf("pr-%d（層=%s）", oldest[tag], oldestLayer[tag]) : "未介入"
        # 起点の数値（6 列目）は並べ替え用。未介入を最優先にするので 0 のまま出す
        printf "%d %d %d %d %d %d %s %s\n", \
          recurrence[tag], inside[tag], total[tag], after, deferrals[tag], \
          oldest[tag], tag, origin
      }
    }
  ' pr-*.md
}

# 常時ロード（AGENTS.md + rules/）の実測行数。
loaded_lines() {
  (cd ../.. && wc -l AGENTS.md rules/*.md | tail -1 | awk '{print $1}')
}

# 予算と実測を突き合わせて 1 行出し、ずれていれば 1 を返す。
# 引数: <対象名> <実測> <予算> <予算を持つ変数名>
check_budget() {
  if [ "$2" -gt "$3" ]; then
    printf '%s が予算を超えています: %s / %s 行 — 足した分と同量を削るか、判例・フックへ移す\n' \
      "$1" "$2" "$3"
    return 1
  fi
  if [ "$2" -lt "$3" ]; then
    printf '%s が予算を下回りました: %s / %s 行 — count.sh の %s を %s へ下げる（上げない）\n' \
      "$1" "$2" "$3" "$4" "$2"
    return 1
  fi
  printf '%s: %s / %s 行\n' "$1" "$2" "$3"
  return 0
}

# --ratchet: 実測と予算が一致していなければ落とす。git hooks と CI が呼ぶ。
# 提案の文字列を出すだけでは、目で確かめる形と同じで一度も発火しない。
if [ "${1:-}" = "--ratchet" ]; then
  status=0
  check_budget "常時ロード（AGENTS.md + rules/）" "$(loaded_lines)" "$LoadedBudget" \
    "LoadedBudget" || status=1
  check_budget "harness-growth/SKILL.md" \
    "$(wc -l < ../../.claude/skills/harness-growth/SKILL.md)" "$GrowthSkillBudget" \
    "GrowthSkillBudget" || status=1
  exit "$status"
fi

# --shrink: 縮める側の条件を数字で出す（harness-growth の SKILL.md「Step 5」）。
if [ "${1:-}" = "--shrink" ]; then
  printf '%s\n\n' "縮める候補（harness-growth の SKILL.md「Step 5」）"

  printf '%s\n' "1. 効いている介入（介入済み・以降 10 本以上・再発 0）— 対応する rules/ の記述を"
  printf '%s\n' "   フック・判例への参照 1 行へ縮める"
  proven="$(summary_rows | sort -k4,4rn | awk '$1 == 0 && $4 >= 10 && $6 > 0 {
    note = ($5 > 0) ? sprintf("  見送り=%d回", $5) : ""
    printf "     %-14s 以降=%-4s 起点=%s%s\n", $7, $4, $8, note
  }')"
  printf '%s\n\n' "${proven:-     該当なし}"

  # 未介入で再発 0 は「効いている」ではない。強制の有無で読み分けるため別の節に出す。
  printf '%s\n' "1b. 未介入のまま再発 0 — 「効いているから 0」とは言えない。強制の有無で読み分ける"
  untouched="$(summary_rows | sort -k3,3rn | awk '$1 == 0 && $6 == 0 {
    printf "     %-14s 通算=%-5s 内部=%s\n", $7, $3, $2
  }')"
  printf '%s\n\n' "${untouched:-     該当なし}"

  printf '%s\n' "2. 行数のラチェット（予算は下げるだけ。上げない）"
  check_budget "常時ロード（AGENTS.md + rules/）" "$(loaded_lines)" "$LoadedBudget" \
    "LoadedBudget" | sed 's/^/     /' || true
  check_budget "harness-growth/SKILL.md" \
    "$(wc -l < ../../.claude/skills/harness-growth/SKILL.md)" "$GrowthSkillBudget" \
    "GrowthSkillBudget" | sed 's/^/     /' || true
  printf '\n'

  # 装置（スキル・エージェント）の間引き候補。記録の「## 発火」の行から数える。
  # フックはここでは数えない（予防装置は発火 0 が「効いている」でありうるため）。
  printf '%s\n' "3. 装置の間引き候補（発火を計測できた記録 10 本から判断）"
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
  printf '%s\n' "   計測した記録で発火 0 のリポジトリ内装置 — 退役候補:"
  for device in ../../.claude/skills/*/ ../../.claude/agents/*.md; do
    name="$(basename "$device" .md)"
    grep -qE "^- 発火: \`$name\`" pr-*.md || printf '     %s\n' "$name"
  done
  exit 0
fi

printf '%s\n' "再発  内部  通算  以降  分類           起点"
# 再発が同数なら、起点が古い（長く開いている）ほうを上に出す。並べ替えは表示文字列ではなく
# 6 列目の数値で行う（`未介入` は 0 なので最優先に来る）。通算・内部は分岐に使わない性質なので、
# 並べ替えの決め手にもしない
summary_rows | sort -k1,1rn -k6,6n \
  | awk '{ printf "%4d  %4d  %4d  %4d  %-14s %s\n", $1, $2, $3, $4, $7, $8 }'
