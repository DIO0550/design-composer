#!/usr/bin/env bash
#
# 作業ツリーを書き換えるサブエージェントの実行中フラグの判定表。
# `track-verification-agent-activity.sh` と `block-git-during-verification-agent.sh` へ
# Task/Agent と git の呼び出しを順に流し、起動の拒否と git 操作の拒否が期待どおりかを
# 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/verification-agent-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# 2 本を通しで流すのは、守りたいのが片方の判定ではなく「印が残っている間だけ git 操作が
# 止まる」という 2 本の間の約束だから。ケースごとに一時の TMPDIR と session_id を分け、
# 前のケースの印を持ち越さない。
#
# 2 本のフックは deny でも exit 0 で JSON を返すので、`cases-report.sh` の `decide`
# (exit 1 を違反とみなす)ではなく、出力の `permissionDecision` を見て決める。
# JSON は jq を使わず printf で組む(フック本体と同じく、jq の無い環境でも走らせるため)。
#
# **入力は Agent ツールの引数名に合わせて組んだもので、実物の PreToolUse から写していない。**
# Claude Code が `tool_input` に `run_in_background` を載せるかは、この表では確かめられない。
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
. "$lib_dir/cases-report.sh"

track_hook="$lib_dir/../track-verification-agent-activity.sh"
block_hook="$lib_dir/../block-git-during-verification-agent.sh"

TMPDIR="$(mktemp -d)"
export TMPDIR
trap 'rm -rf "$TMPDIR"' EXIT

# フックの出力と終了コードから deny / pass / broken を決める。
#
# $1 フックの標準出力
# $2 フックの終了コード(2 本とも判定によらず 0 で終わる)
decide_by_permission() {
  local deny_pattern='"permissionDecision"[[:space:]]*:[[:space:]]*"deny"'
  if [ "$2" -ne 0 ]; then
    echo "broken"
    return 0
  fi
  if [[ "$1" =~ $deny_pattern ]]; then
    echo "deny"
    return 0
  fi
  echo "pass"
}

# Task/Agent のフックへ 1 回分の呼び出しを流し、判定を返す。ツール名は `TOOL_NAME` で
# 差し替えられる(既定は Agent)。
#
# $1 セッション(ケースごとに分ける)
# $2 `PreToolUse` / `PostToolUse`
# $3 tool_input の中身(`{` `}` を除いた JSON)
agent_verdict() {
  local session="$1" event="$2" tool_input="$3" tool_name="${TOOL_NAME:-Agent}" output status
  output="$(printf '{"session_id":"%s","hook_event_name":"%s","tool_name":"%s","tool_input":{%s}}' \
    "$session" "$event" "$tool_name" "$tool_input" | bash "$track_hook")"
  status=$?
  decide_by_permission "$output" "$status"
}

# git コマンドを書いた Bash の呼び出しを流し、判定を返す(git は実行しない)。
#
# $1 セッション
# $2 コマンド(省くと `git add src`)
git_verdict() {
  local output status
  output="$(printf '{"session_id":"%s","tool_input":{"command":"%s"}}' "$1" "${2:-git add src}" | bash "$block_hook")"
  status=$?
  decide_by_permission "$output" "$status"
}

# セッションの印をすべて 1 時間前の時刻へ戻す。印の有効期間(種類ごとに違う)を確かめるため。
# `date -d @` は GNU、`date -r` は BSD の綴り。
#
# $1 セッション
backdate_markers_to_one_hour_ago() {
  local then stamp
  then=$(( $(date +%s) - 3600 ))
  stamp="$(date -d "@$then" +%Y%m%d%H%M.%S 2>/dev/null || date -r "$then" +%Y%m%d%H%M.%S)"
  touch -t "$stamp" "$TMPDIR/design-composer-verification-agents-$1"/active.*
}

foreground_test_reviewer='"subagent_type":"test-reviewer","prompt":"x"'
foreground_plan_reviewer='"subagent_type":"plan-reviewer","prompt":"x"'
background_test_reviewer='"subagent_type":"test-reviewer","prompt":"x","run_in_background":true'
background_plan_reviewer='"subagent_type":"plan-reviewer","prompt":"x","run_in_background":true'
foreground_implementer='"subagent_type":"implementer","prompt":"x"'
background_implementer='"subagent_type":"implementer","prompt":"x","run_in_background":true'

agent_verdict s1 PreToolUse "$foreground_test_reviewer" >/dev/null
report deny "$(git_verdict s1)" "前面で起動した test-reviewer の実行中は git add が拒否される"

report deny "$(git_verdict s1 'git commit -m x')" "前面で起動した test-reviewer の実行中は git commit が拒否される"
report deny "$(git_verdict s1 'git push')" "前面で起動した test-reviewer の実行中は git push が拒否される"

agent_verdict s2 PreToolUse "$foreground_plan_reviewer" >/dev/null
report deny "$(git_verdict s2)" "前面で起動した plan-reviewer の実行中は git add が拒否される"

TOOL_NAME=Task agent_verdict s3 PreToolUse "$foreground_test_reviewer" >/dev/null
report deny "$(git_verdict s3)" "ツール名が Task でも、前面で起動した test-reviewer の実行中は git add が拒否される"

agent_verdict s4 PreToolUse "$foreground_test_reviewer" >/dev/null
agent_verdict s4 PostToolUse "$foreground_test_reviewer" >/dev/null
report pass "$(git_verdict s4)" "前面で起動した test-reviewer が終わると git add が通る"

report deny "$(agent_verdict s5 PreToolUse "$background_test_reviewer")" "run_in_background: true を明示した test-reviewer は起動が拒否される"
report deny "$(agent_verdict s6 PreToolUse "$background_plan_reviewer")" "run_in_background: true を明示した plan-reviewer は起動が拒否される"
report deny "$(TOOL_NAME=Task agent_verdict s7 PreToolUse "$background_test_reviewer")" "ツール名が Task でも、run_in_background: true を明示した test-reviewer は起動が拒否される"
report deny "$(agent_verdict s8 PreToolUse '"subagent_type":"test-reviewer","prompt":"x","run_in_background": true')" "キーと値の間に空白があっても、背景起動は拒否される"

agent_verdict s9 PreToolUse "$background_test_reviewer" >/dev/null
report pass "$(git_verdict s9)" "背景起動が拒否されたときは印が残らず、git add は止まらない"

agent_verdict s10 PreToolUse "$foreground_test_reviewer" >/dev/null
agent_verdict s10 PreToolUse "$background_plan_reviewer" >/dev/null
report deny "$(git_verdict s10)" "前面の test-reviewer の実行中に背景の plan-reviewer が拒否されても、git add は拒否され続ける"

agent_verdict s14 PreToolUse "$foreground_test_reviewer" >/dev/null
report pass "$(agent_verdict s14 PostToolUse "$background_test_reviewer")" "PostToolUse では、背景起動の入力でも拒否を返さない"
report pass "$(git_verdict s14)" "PostToolUse では、背景起動の入力でも印を消す"

agent_verdict s15 PreToolUse "$foreground_implementer" >/dev/null
report deny "$(git_verdict s15)" "前面で起動した implementer の実行中は git add が拒否される"

agent_verdict s16 PreToolUse "$foreground_implementer" >/dev/null
agent_verdict s16 PostToolUse "$foreground_implementer" >/dev/null
report pass "$(git_verdict s16)" "前面で起動した implementer が終わると git add が通る"

report deny "$(agent_verdict s17 PreToolUse "$background_implementer")" "run_in_background: true を明示した implementer は起動が拒否される"

# 残った印の種類は有効期間でしか外から見えないので、最後に印を古くして見分ける。implementer の印を
# 先に古くしておくのは、種類を問わず最も古い印を消す実装だと implementer の印が消えるようにするため。
agent_verdict s18 PreToolUse "$foreground_implementer" >/dev/null
backdate_markers_to_one_hour_ago s18
agent_verdict s18 PreToolUse "$foreground_test_reviewer" >/dev/null
agent_verdict s18 PostToolUse "$foreground_test_reviewer" >/dev/null
backdate_markers_to_one_hour_ago s18
report deny "$(git_verdict s18)" "test-reviewer が終わって消えるのは test-reviewer の印で、先に起動した implementer の印は残る"

agent_verdict s19 PreToolUse "$foreground_implementer" >/dev/null
backdate_markers_to_one_hour_ago s19
report deny "$(git_verdict s19)" "implementer の印は 1 時間たっても有効で、git add が拒否される"

agent_verdict s20 PreToolUse "$foreground_test_reviewer" >/dev/null
backdate_markers_to_one_hour_ago s20
report pass "$(git_verdict s20)" "test-reviewer の印は 1 時間たつと古い印として無視され、git add が通る"

report pass "$(agent_verdict s21 PreToolUse '"subagent_type":"planner","prompt":"x","run_in_background":true')" "planner は背景で起動しても拒否されない"
report pass "$(agent_verdict s11 PreToolUse '"subagent_type":"Explore","prompt":"x","run_in_background":true')" "対象外のエージェントは背景で起動しても拒否されない"
report pass "$(agent_verdict s12 PreToolUse '"subagent_type":"test-reviewer","prompt":"x","run_in_background":false')" "run_in_background が false なら拒否されない"
report pass "$(agent_verdict s13 PreToolUse '"subagent_type":"test-reviewer","prompt":"\"run_in_background\":true と書いてある"')" "prompt の本文に run_in_background: true と書いてあっても、前面起動なら拒否されない"

exit "$cases_failed"
