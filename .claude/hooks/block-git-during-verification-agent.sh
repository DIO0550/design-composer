#!/usr/bin/env bash
#
# 作業ツリーを書き換えるサブエージェント(plan-reviewer / test-reviewer のミューテーション実測、
# implementer の実装)の実行中に、git add / commit / push を拒否する PreToolUse フック
# (matcher: Bash)。マーカーは track-verification-agent-activity.sh が置く。
#
# test-reviewer がミューテーションを当てている最中や implementer が実装を書いている最中に
# git add が走ると、その瞬間の書き換えをコミットへ取り込んで CI が落ちる。
# implementation-flow「サブエージェントの使い方」の「返ってきたら git status を見る」は
# 戻ってきた**後**の話で、**実行中**にコミットするなとは書かれていなかった穴を塞ぐ。
#
# CI / git hooks(層1・2)では代替できない。この競合はセッションの実行タイミングだけが原因で、
# コミット後のリポジトリの状態には痕跡が残らない。block-npx.sh と同じ「セッション中の
# 行為の禁止」であり、push の時点では代替できない
# (.claude/hooks/README.md「カバー範囲と残る穴」)。層3(ここ)止まりで、発火しない
# 実行環境では効かないことを許容する(block-npx.sh と同じ扱い)。
#
# 外部コマンドに依存しない(hook-canary.sh と同じ理由: jq の無い環境で
# フェイルオープンになるとしても、判定自体は bash の組み込みだけで完結させる)。
set -uo pipefail

input="$(cat)"
extract() {
  local pattern="\"$1\"[[:space:]]*:[[:space:]]*\"([^\"]*)\""
  [[ "$input" =~ $pattern ]] && printf '%s' "${BASH_REMATCH[1]}"
}

command_text="$(extract command)"
[[ "$command_text" =~ git[[:space:]]+(add|commit|push)([[:space:]]|$) ]] || exit 0

session_id="$(extract session_id)"
lock_dir="${TMPDIR:-/tmp}/design-composer-verification-agents-${session_id:-unknown}"
[ -d "$lock_dir" ] || exit 0

# 実行が異常終了して消し忘れたマーカーで恒久的にブロックし続けないよう、
# 一定時間より古いマーカーは無視する(フェイルオープン側へ倒す)。implementer だけ長くするのは、
# 実装は 30 分を超えて走るのが普通で、1800 秒では実装の途中で git add が通るため。全体を
# 長くしないのは、中断で PostToolUse が来なかった検証エージェントの印まで長く git を止めるから。
#
# $1 マーカーのパス(`active.<subagent_type>.XXXXXX`)
stale_seconds_of() {
  local name="${1##*/}"
  local rest="${name#active.}"
  case "${rest%%.*}" in
    implementer) echo 7200 ;;
    *) echo 1800 ;;
  esac
}

now="$(date +%s)"
active=0
for marker in "$lock_dir"/active.*; do
  [ -e "$marker" ] || continue
  mtime="$(stat -c %Y "$marker" 2>/dev/null || stat -f %m "$marker" 2>/dev/null || printf '0')"
  if [ $(( now - mtime )) -le "$(stale_seconds_of "$marker")" ]; then
    active=$(( active + 1 ))
  fi
done

[ "$active" -gt 0 ] || exit 0

cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "plan-reviewer / test-reviewer / implementer が作業ツリーを書き換えている最中です(分類: subagent-control。pr-391 #18 で同じ形が CI を落としています)。ミューテーション実測や実装の途中でコミットすると、その瞬間の書き換えが取り込まれます。サブエージェントの完了を待ってから git add / commit / push を実行してください。"
  }
}
JSON
