#!/usr/bin/env bash
#
# `block-parent-session-edit.sh` の判定表。発火ログを本物の `record-firings.sh` に書かせてから
# Edit / Write の PreToolUse を流し、親の編集の拒否と素通りが期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/parent-session-edit-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# ログを手で書かずに `record-firings.sh` へ SessionStart と Skill の PostToolUse を流すのは、守りたいのが
# 「書く側の綴りを読む側が読める」という 2 本の間の約束だから。ケースごとに session_id を分け、前の
# ケースのログを持ち越さない。フックは置き場所のまま走らせ、file_path は本物のリポジトリのルートの
# 下に組む(ファイルは作らない)。判定は `cases-report.sh` の `decide_by_permission`。
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
. "$lib_dir/cases-report.sh"

hook="$lib_dir/../block-parent-session-edit.sh"
record_hook="$lib_dir/../record-firings.sh"
repo_root="$(cd "$lib_dir/../../.." && pwd)"

TMPDIR="$(mktemp -d)"
export TMPDIR
trap 'rm -rf "$TMPDIR"' EXIT

# セッションの見出しを書かせ、続けて起動したスキルを順に書かせる。
#
# $1 セッション
# $2 以降 起動したスキル(起動した順)
start_session() {
  local session="$1" skill
  shift
  printf '{"session_id":"%s","hook_event_name":"SessionStart"}' "$session" | bash "$record_hook"
  for skill in "$@"; do
    printf '{"session_id":"%s","hook_event_name":"PostToolUse","tool_name":"Skill","tool_input":{"skill":"%s"}}' \
      "$session" "$skill" | bash "$record_hook"
  done
}

# Edit / Write の PreToolUse を 1 回流し、フックの出力をそのまま返す。終了コードはフックのもの。
#
# $1 セッション
# $2 session_id と tool_input の間に挟むフィールド(`tool_name` を含み、`,` で終わる JSON)
# $3 tool_input の中身(`{` `}` を除いた JSON)
edit_output() {
  printf '{"session_id":"%s",%s"tool_input":{%s}}' "$1" "$2" "$3" | bash "$hook"
}

# Edit / Write の PreToolUse を 1 回流し、判定を返す。
#
# $1 セッション
# $2 session_id と tool_input の間に挟むフィールド(`edit_output` と同じ)
# $3 tool_input の中身(`edit_output` と同じ)
edit_verdict() {
  local output status
  output="$(edit_output "$@")"
  status=$?
  decide_by_permission "$output" "$status"
}

parent_edit='"hook_event_name":"PreToolUse","tool_name":"Edit",'
parent_write='"hook_event_name":"PreToolUse","tool_name":"Write",'
# サブエージェントの中の呼び出しは、入力に `agent_id` / `agent_type` が載る(並びは実物の入力に合わせた)。
subagent_edit='"agent_id":"ab90e859b438c06a1","agent_type":"implementer","hook_event_name":"PreToolUse","tool_name":"Edit",'
subagent_write='"agent_id":"ab90e859b438c06a1","agent_type":"implementer","hook_event_name":"PreToolUse","tool_name":"Write",'
agent_id_only_edit='"agent_id":"ab90e859b438c06a1","hook_event_name":"PreToolUse","tool_name":"Edit",'

in_repo="$repo_root/src/parent-session-edit-probe.ts"
edit_in_repo="\"file_path\":\"$in_repo\",\"old_string\":\"a\",\"new_string\":\"b\""
write_in_repo="\"file_path\":\"$in_repo\",\"content\":\"x\""

start_session s1 implementation-flow
report deny "$(edit_verdict s1 "$parent_edit" "$edit_in_repo")" "implementation-flow の中で、親がリポジトリの中のファイルを Edit すると拒否される"
report deny "$(edit_verdict s1 "$parent_write" "$write_in_repo")" "implementation-flow の中で、親がリポジトリの中のファイルを Write すると拒否される"
report pass "$(edit_verdict s1 "$subagent_edit" "$edit_in_repo")" "implementation-flow の中でも、サブエージェントの Edit は通る"
report pass "$(edit_verdict s1 "$subagent_write" "$write_in_repo")" "implementation-flow の中でも、サブエージェントの Write は通る"
report pass "$(edit_verdict s1 "$agent_id_only_edit" "$edit_in_repo")" "agent_type が無く agent_id だけが載った Edit も、サブエージェントの呼び出しとして通る"
report pass "$(edit_verdict s1 "$parent_write" "\"file_path\":\"$TMPDIR/outside.ts\",\"content\":\"x\"")" "implementation-flow の中でも、親がリポジトリの外のファイルへ Write するのは通る"
report pass "$(edit_verdict s1 "$parent_write" "\"file_path\":\"$repo_root-other/x.ts\",\"content\":\"x\"")" "リポジトリのルートと同じ綴りで始まる別のフォルダへの Write は、リポジトリの外として通る"
report pass "$(edit_verdict s1 "$parent_write" '"content":"x"')" "file_path の無い入力は通る"
report pass "$(edit_verdict s1 "$parent_write" '"file_path":"","content":"x"')" "file_path が空の入力は通る"
report pass "$(edit_verdict s1 "$parent_write" '"file_path":"src/a.ts","content":"x"')" "file_path が相対パスの入力は通る"

# フックは自分の置き場所からリポジトリのルートと共有部品を辿る。呼んだパスの綴りが相対でも
# 辿れることを、リポジトリルートに cd して `./` から呼んで確かめる。
relative_output="$(
  cd "$repo_root" || exit 1
  printf '{"session_id":"s1",%s"tool_input":{%s}}' "$parent_edit" "$edit_in_repo" \
    | bash ./.claude/hooks/block-parent-session-edit.sh
)"
relative_status=$?
report deny "$(decide_by_permission "$relative_output" "$relative_status")" "リポジトリルートから相対パスでフックを呼んでも、implementation-flow の中の親の Edit は拒否される"

start_session s2 implementation-flow harness-record
report pass "$(edit_verdict s2 "$parent_edit" "$edit_in_repo")" "implementation-flow の後に harness-record を起動したら、親の Edit は通る"

start_session s3 implementation-flow harness-growth
report pass "$(edit_verdict s3 "$parent_edit" "$edit_in_repo")" "implementation-flow の後に harness-growth を起動したら、親の Edit は通る"

start_session s4 harness-record implementation-flow
report deny "$(edit_verdict s4 "$parent_edit" "$edit_in_repo")" "harness-record の後に implementation-flow を起動したら、親の Edit は拒否される"

start_session s5 implementation-flow claim-verification pr-explain
report deny "$(edit_verdict s5 "$parent_edit" "$edit_in_repo")" "implementation-flow の後に区切りでないスキルを起動しても、親の Edit は拒否され続ける"

start_session s6 implementation-flow harness-record claim-verification
report pass "$(edit_verdict s6 "$parent_edit" "$edit_in_repo")" "harness-record の後に区切りでないスキルを起動しても、親の Edit は通り続ける"

report pass "$(edit_verdict s7 "$parent_edit" "$edit_in_repo")" "発火ログが無いセッションでは、親の Edit は通る"

start_session s8
report pass "$(edit_verdict s8 "$parent_edit" "$edit_in_repo")" "発火ログが見出しだけのセッションでは、親の Edit は通る"

start_session s9 implementation-flow
start_session s10
report pass "$(edit_verdict s10 "$parent_edit" "$edit_in_repo")" "別のセッションで implementation-flow を起動していても、このセッションの親の Edit は通る"

start_session s11 implementation-flow
report deny "$(edit_verdict s11 "$parent_write" "\"file_path\":\"$in_repo\",\"content\":\"{\\\"agent_id\\\":\\\"x\\\"}\"")" "Write の content に agent_id の綴りがあっても、親の Write は拒否される"
report deny "$(edit_verdict s11 "$parent_edit" "\"file_path\":\"$in_repo\",\"old_string\":\"a\",\"new_string\":\"{\\\"agent_id\\\":\\\"x\\\"}\"")" "Edit の new_string に agent_id の綴りがあっても、親の Edit は拒否される"
report deny "$(edit_verdict s11 "$parent_edit" "\"file_path\":\"$in_repo\",\"old_string\":\"{\\\"agent_id\\\":\\\"x\\\"}\",\"new_string\":\"b\"")" "Edit の old_string に agent_id の綴りがあっても、親の Edit は拒否される"

start_session s12 x-implementation-flow
report pass "$(edit_verdict s12 "$parent_edit" "$edit_in_repo")" "名前が implementation-flow で終わるだけの別のスキルは区切りにならず、親の Edit は通る"

# 拒否文は implementer へ渡すことだけを伝え、拒否を外すスキルの名前を出さない。
reason_names_escape=absent
[[ "$(edit_output s1 "$parent_edit" "$edit_in_repo")" == *harness-* ]] && reason_names_escape=present
report absent "$reason_names_escape" "拒否文に、拒否を外すスキル(harness-)の名前が出ない"

exit "$cases_failed"
