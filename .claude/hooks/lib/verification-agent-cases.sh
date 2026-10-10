#!/usr/bin/env bash
#
# 作業ツリーを書き換えるサブエージェントの実行中フラグの判定表。
# `track-verification-agent-activity.sh` と `block-git-during-verification-agent.sh` へ
# Task/Agent と git の呼び出しを順に流し、起動の拒否と git 操作の拒否(拒否文に載る印の場所を
# 含む)が期待どおりかを 1 コマンドで確かめる。
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
# **Agent / Task の入力は Agent ツールの引数名に合わせて組んだもので、実物の PreToolUse から写していない。**
# Claude Code が `tool_input` に `run_in_background` を載せるかは、この表では確かめられない。
# サブエージェントの中の Bash 呼び出しだけは、実物の入力が持つ `agent_id` / `agent_type` を載せて流す。
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

# git コマンドを書いた Bash の呼び出しを流し、フックの出力をそのまま返す(git は実行しない)。
# 終了コードはフックのもの。
#
# $1 セッション
# $2 コマンド(省くと `git add src`)
# $3 session_id と tool_input の間に挟むフィールド(`,` で終わる JSON。省くと何も挟まない)
git_output() {
  printf '{"session_id":"%s",%s"tool_input":{"command":"%s"}}' "$1" "${3:-}" "${2:-git add src}" | bash "$block_hook"
}

# git コマンドを書いた Bash の呼び出しを流し、判定を返す(git は実行しない)。
#
# $1 セッション
# $2 コマンド(省くと `git add src`)
# $3 session_id と tool_input の間に挟むフィールド(`git_output` と同じ)
git_verdict() {
  local output status
  output="$(git_output "$@")"
  status=$?
  decide_by_permission "$output" "$status"
}

# セッションの印をすべて指定した秒数だけ前の時刻へ戻す。印の有効期間(種類ごとに違う)を
# 確かめるため。`date -d @` は GNU、`date -r` は BSD の綴り。
#
# $1 セッション
# $2 戻す秒数
backdate_markers() {
  local then stamp
  then=$(( $(date +%s) - $2 ))
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

# サブエージェントの中の Bash 呼び出しは、入力に `agent_id` / `agent_type` が載る(並びは実物の入力に合わせた)。
in_subagent_fields='"agent_id":"ab90e859b438c06a1","agent_type":"implementer","hook_event_name":"PreToolUse","tool_name":"Bash",'
agent_verdict s26 PreToolUse "$foreground_implementer" >/dev/null
report deny "$(git_verdict s26 'git add --dry-run -- README.md' "$in_subagent_fields")" "implementer の実行中は、サブエージェントの中から呼んだ git add も拒否される"

# 残った印の種類は有効期間でしか外から見えないので、最後に印を古くして見分ける。implementer の印を
# 先に古くしておくのは、種類を問わず最も古い印を消す実装だと implementer の印が消えるようにするため。
agent_verdict s18 PreToolUse "$foreground_implementer" >/dev/null
backdate_markers s18 3600
agent_verdict s18 PreToolUse "$foreground_test_reviewer" >/dev/null
agent_verdict s18 PostToolUse "$foreground_test_reviewer" >/dev/null
backdate_markers s18 3600
report deny "$(git_verdict s18)" "test-reviewer が終わって消えるのは test-reviewer の印で、先に起動した implementer の印は残る"

agent_verdict s19 PreToolUse "$foreground_implementer" >/dev/null
backdate_markers s19 3600
report deny "$(git_verdict s19)" "implementer の印は 1 時間たっても有効で、git add が拒否される"

agent_verdict s20 PreToolUse "$foreground_test_reviewer" >/dev/null
backdate_markers s20 3600
report pass "$(git_verdict s20)" "test-reviewer の印は 1 時間たつと古い印として無視され、git add が通る"

# 逆の起動順。種類を問わず最も新しい印を消す実装だと implementer の印が消え、残った test-reviewer の
# 印が 1 時間たって無視されて git add が通る。test-reviewer の印を先に古くするのは、どちらが新しいかを
# 作成時刻の細かさに頼らないため。
agent_verdict s22 PreToolUse "$foreground_test_reviewer" >/dev/null
backdate_markers s22 3600
agent_verdict s22 PreToolUse "$foreground_implementer" >/dev/null
agent_verdict s22 PostToolUse "$foreground_test_reviewer" >/dev/null
backdate_markers s22 3600
report deny "$(git_verdict s22)" "test-reviewer が終わって消えるのは test-reviewer の印で、後から起動した implementer の印は残る"

agent_verdict s23 PreToolUse "$foreground_test_reviewer" >/dev/null
agent_verdict s23 PreToolUse "$foreground_test_reviewer" >/dev/null
agent_verdict s23 PostToolUse "$foreground_test_reviewer" >/dev/null
report deny "$(git_verdict s23)" "test-reviewer を 2 件起動して 1 件だけ終わっても、残る 1 件の実行中は git add が拒否される"

agent_verdict s24 PreToolUse "$foreground_implementer" >/dev/null
backdate_markers s24 10800
report pass "$(git_verdict s24)" "implementer の印は 3 時間たつと古い印として無視され、git add が通る"

# 印の場所は拒否文(JSON の文字列)へ埋まるので、`"` と `\` を含む TMPDIR で綴りを見る。TMPDIR は
# この 2 回の呼び出しだけ差し替え、他のケースの印と同じ場所に置かない。
quoted_tmpdir="$TMPDIR/q\"x\\y"
mkdir -p "$quoted_tmpdir"
TMPDIR="$quoted_tmpdir" agent_verdict s25 PreToolUse "$foreground_test_reviewer" >/dev/null
escaped_marker_location='q\"x\\y/design-composer-verification-agents-s25/active.*'
quoted_output="$(TMPDIR="$quoted_tmpdir" git_output s25)"
marker_location_in_reason=missing
if [[ "$quoted_output" == *"$escaped_marker_location"* ]]; then
  marker_location_in_reason=escaped
fi
report escaped "$marker_location_in_reason" "TMPDIR に \" と \\ が入っていても、拒否文の印の場所は JSON の文字列としてエスケープされる"

report pass "$(agent_verdict s21 PreToolUse '"subagent_type":"planner","prompt":"x","run_in_background":true')" "planner は背景で起動しても拒否されない"
report pass "$(agent_verdict s11 PreToolUse '"subagent_type":"Explore","prompt":"x","run_in_background":true')" "対象外のエージェントは背景で起動しても拒否されない"
report pass "$(agent_verdict s12 PreToolUse '"subagent_type":"test-reviewer","prompt":"x","run_in_background":false')" "run_in_background が false なら拒否されない"
report pass "$(agent_verdict s13 PreToolUse '"subagent_type":"test-reviewer","prompt":"\"run_in_background\":true と書いてある"')" "prompt の本文に run_in_background: true と書いてあっても、前面起動なら拒否されない"

exit "$cases_failed"
