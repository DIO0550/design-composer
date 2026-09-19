#!/usr/bin/env bash
#
# 分類ごとに「まだ開いている窓の中で、人・bot・CI へ届いた指摘の数」を数える。
# harness-growth スキル(.claude/skills/harness-growth/SKILL.md)の入力。
#
# 読むのは記録の次の 3 種類の行:
#   - 分類: `<分類>`                        … 指摘 1 件
#   - 出どころ: `<出どころ>`                … 直前の「分類」の指摘を誰が見つけたか
#   - 対策済: `<分類>` 層=<層> at pr-<番号>  … その回に介入したこと(窓を閉じる)
#
# 使い方:
#   count.sh                 分類ごとの再発・内部・通算・以降・窓の開始・最終介入を出す
#   count.sh --shrink        縮める側の数字を出す(常時ロードの行数・判例へ落とす候補・装置の発火)
#   count.sh --list <分類>   その分類の、窓が開いてからの指摘を 1 件 1 行で出す
#   count.sh --ratchet       行数を予算と突き合わせる(ずれていれば exit 1)
#
# 出力の列:
#   再発      窓が開いてからの記録で、出どころが人・bot・CI だった件数。分岐はこれで決める。
#             サブエージェントの指摘を混ぜないのは、観点を足すほど指摘が増えて再発に見える
#             (数えているのが成果ではなく検証エージェントの饒舌さになる)ため
#   内部      同じ期間で、出どころがサブエージェント・フック・自己修正だった件数。参考値
#   通算      全記録での、再発と同じ種類の件数
#   以降      窓の開始より後の記録の本数
#   窓の開始  その分類でいちばん古い、まだ開いている窓。再発と以降はここから数える
#   最終介入  その分類の綴りのうち最新の `対策済` と、その回の層。無ければ「未介入」
#
# 窓を畳む前の綴りごとに持つ理由は README.md「数え方」。
#
# 旧語彙(細かく割っていた分類)は集計の最後に現在の語彙へ畳む(fold_tag)。過去の記録は
# 書き換えない規約なので、対応表を記録側ではなくここに持つ。
#
# 数え方と --ratchet の終了コードは count-cases.sh が固定する。
set -euo pipefail

cd "$(dirname "$0")"

# 常時ロード(AGENTS.md + rules/)と harness-growth スキルの行数の予算。
# **ずれていれば --ratchet が落ちる。** 足すなら同量削るのが規約で、この値は下げるだけ
# (縮めたら実測に合わせて下げる。上げない)。
#
# ただし --ratchet が見るのは実測とのずれだけで、**この値を引き上げる変更そのものは
# 検知できない**。「上げない」は規約(AGENTS.md「常時ロードは増やさない」)に留まる。
always_loaded_budget=823
growth_skill_budget=100

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
  # 綴りをそのまま返す(畳まない)。窓を綴りごとに持つため、畳むのは集計の最後
  function tag_of(line) {
    sub(/^- [^`]*`/, "", line); sub(/`.*/, "", line)
    return line
  }
  function intervention_pr(line) {
    sub(/.* at pr-/, "", line); sub(/[^0-9].*/, "", line)
    return line + 0
  }
  # その綴りの窓が開いた記録番号。綴り自身への介入と、畳み先の分類名そのものへの介入の
  # 新しいほう。どちらも無ければ 0(未介入)
  function boundary(tag,   own, basket) {
    own = last_pr[tag]; basket = last_pr[fold_tag(tag)]
    return (own > basket) ? own : basket
  }
'

# 記録を 1 パスで読み、分類ごとの集計行を返す(列は「出力の列」のとおり)。
# 既定の表と --shrink の両方が読むので、数え方をここ 1 箇所に持つ。
summary_rows() {
  awk "$awk_common"'
    FNR == 1 { number = record_number(FILENAME); records[number] = 1; pending = "" }
    /^- 分類: `/ { pending = tag_of($0); next }
    /^- 出どころ:/ && pending != "" {
      if (reached_outside($0)) outside[pending, number]++
      else inside[pending, number]++
      spelling[pending] = 1
      pending = ""
      next
    }
    /^- 対策済: `/ {
      tag = tag_of($0)
      at = intervention_pr($0)
      layer = $0; sub(/.*層=/, "", layer); sub(/ .*/, "", layer)
      if (at > last_pr[tag]) { last_pr[tag] = at; last_layer[tag] = layer }
      intervened[tag] = 1
      next
    }
    END {
      for (tag in spelling) seen[fold_tag(tag)] = 1
      for (tag in intervened) {
        seen[fold_tag(tag)] = 1
        # 最終介入は綴りを問わず、その分類でいちばん新しい `対策済`
        if (last_pr[tag] > latest[fold_tag(tag)]) {
          latest[fold_tag(tag)] = last_pr[tag]
          latest_layer[fold_tag(tag)] = last_layer[tag]
        }
      }

      # 窓の開始は、指摘のある綴りのうちいちばん古い窓。`対策済` にしか出ない綴りを
      # 混ぜないのは、数える指摘が 1 件も無い綴りの窓が以降を実態より長くするため
      for (tag in spelling) {
        basket = fold_tag(tag)
        open_at = boundary(tag)
        if (!(basket in opened) || open_at < opened[basket]) opened[basket] = open_at
      }

      for (key in outside) {
        split(key, part, SUBSEP)
        total[fold_tag(part[1])] += outside[key]
        if (part[2] + 0 > boundary(part[1])) recurrence[fold_tag(part[1])] += outside[key]
      }
      for (key in inside) {
        split(key, part, SUBSEP)
        if (part[2] + 0 > boundary(part[1])) internal[fold_tag(part[1])] += inside[key]
      }

      for (tag in seen) {
        after = 0
        # for (k in array) のキーは文字列なので、比較の前に両辺を数値へ寄せる
        # (文字列比較だと PR 番号が 4 桁になった瞬間に "1000" < "199" になる)
        for (number in records) if (number + 0 > opened[tag] + 0) after++
        # printf の %-Ns はバイト数で埋めるので、全角を含む「未介入」は手で幅を合わせる。
        # 分類の列(%-12s)は綴りがそのまま出るため、`なし` のような全角の分類では揃わない
        window = (opened[tag] > 0) ? sprintf("%-8s", "pr-" opened[tag]) : "未介入  "
        intervention = (tag in latest) \
          ? sprintf("pr-%d（層=%s）", latest[tag], latest_layer[tag]) : "未介入"
        printf "%4d  %4d  %4d  %4d  %-12s %s %s\n", \
          recurrence[tag], internal[tag], total[tag], after, tag, window, intervention
      }
    }
  ' pr-*.md
}

# 指定した分類の、窓が開いてからの指摘を「pr-<番号>  <出どころ>  <見出し>」で返す。
# 人・bot・CI 由来を先に出す。窓の取り方は summary_rows と同じ(綴りごと)。
list_findings() {
  awk -v want="$1" "$awk_common"'
    FNR == 1 { number = record_number(FILENAME); pending = "" }
    /^### / { heading = $0; sub(/^### /, "", heading) }
    /^- 分類: `/ { pending = tag_of($0); next }
    /^- 出どころ:/ && pending != "" {
      if (fold_tag(pending) == want) {
        source = $0; sub(/^- 出どころ: */, "", source); gsub(/`/, "", source)
        found[++n] = sprintf("%d\t%d\t%s\tpr-%d  %-36s  %s", \
          !reached_outside($0), number, pending, number, source, heading)
      }
      pending = ""
      next
    }
    /^- 対策済: `/ {
      tag = tag_of($0)
      at = intervention_pr($0)
      if (at > last_pr[tag]) last_pr[tag] = at
      next
    }
    END {
      for (i = 1; i <= n; i++) {
        split(found[i], parts, "\t")
        if (parts[2] + 0 > boundary(parts[3])) print parts[1] "\t" parts[4]
      }
    }
  ' pr-*.md | sort -s -k1,1n | cut -f2-
}

# 常時ロード(AGENTS.md + rules/)の実測行数。
loaded_lines() {
  (cd ../.. && wc -l AGENTS.md rules/*.md | tail -1 | awk '{print $1}')
}

# 予算と実測を突き合わせて 1 行出し、ずれていれば 1 を返す。
# 呼び出し側が終了コードにするかどうかを決める(--shrink は止めず、--ratchet だけが落ちる)。
# 引数: <対象名> <実測> <予算を持つ変数名>(予算の値はこの名前から引く)
check_budget() {
  local label="$1" actual="$2" name="$3" budget="${!3}"
  if [ "$actual" -gt "$budget" ]; then
    printf '%s が予算を超えています: %s / %s 行 — 足した分と同量を削るか、判例・フックへ移す\n' \
      "$label" "$actual" "$budget"
    return 1
  fi
  if [ "$actual" -lt "$budget" ]; then
    printf '%s が予算を下回りました: %s / %s 行 — count.sh の %s を %s へ下げる(上げない)\n' \
      "$label" "$actual" "$budget" "$name" "$actual"
    return 1
  fi
  printf '%s: %s / %s 行\n' "$label" "$actual" "$budget"
  return 0
}

# 予算 2 つを順に突き合わせる。status には 1 つでもずれていれば 1 が入る。
report_budgets() {
  local status=0
  check_budget "常時ロード(AGENTS.md + rules/)" "$(loaded_lines)" always_loaded_budget || status=1
  check_budget "harness-growth/SKILL.md" \
    "$(wc -l < ../../.claude/skills/harness-growth/SKILL.md)" growth_skill_budget || status=1
  return "$status"
}

# --ratchet: 実測と予算が一致していなければ落とす。git hooks と CI が呼ぶ。
# 提案の文字列を出すだけでは、目で確かめる形と同じで一度も発火しない。
if [ "${1:-}" = "--ratchet" ]; then
  report_budgets || exit 1
  exit 0
fi

if [ "${1:-}" = "--list" ]; then
  [ -n "${2:-}" ] || { echo "usage: count.sh --list <分類>" >&2; exit 2; }
  list_findings "$2"
  exit 0
fi

if [ "${1:-}" = "--shrink" ]; then
  printf '%s\n\n' "縮める側の数字（harness-growth の SKILL.md「縮める」）"

  printf '%s\n' "1. 行数のラチェット（予算は下げるだけ。上げない）"
  # ずれていても止めない。予算がずれている回は、まさに節 2・3 を読みたい回
  report_budgets | sed 's/^/     /' || true
  printf '\n'

  # 人・CI に 10 本以上届いていない分類は、常時ロードに実例まで持ち続ける理由が無い
  # (フックで守れているか、このリポジトリでは起きていないかのどちらか)。判例へ落とす候補
  printf '%s\n' "2. 判例へ落とす候補（以降 10 本以上で再発 0。内部は検証エージェントが拾っている数）"
  candidates="$(summary_rows | awk '$1 == 0 && $4 >= 10 {printf "     %-12s 内部=%-4s 以降=%-4s 窓の開始=%-8s 最終介入=%s\n", $5, $2, $4, $6, $7}' | sort)"
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

printf '%s\n' "再発  内部  通算  以降  分類         窓の開始  最終介入"
# 再発が同数なら内部の多い順(検証エージェントが拾い続けている側が分かる)
summary_rows | sort -k1,1rn -k2,2rn
