#!/usr/bin/env bash
#
# `block-parent-session-edit.sh` の判定表。発火ログを本物の `record-firings.sh` に書かせてから
# Edit / Write の PreToolUse を流し、親の編集の拒否と素通りが期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/parent-session-edit-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# ログを手で書かずに `record-firings.sh` へ SessionStart と Skill / Agent の PostToolUse を流すのは、守りたいのが
# 「書く側の綴りを読む側が読める」という 2 本の間の約束だから。ログを書き足さないケースは同じセッションを
# 共有し、区切りを書くケースはそれぞれ新しいセッションにして、前のケースのログを持ち越さない。フックは
# 置き場所のまま走らせ、file_path は本物のリポジトリのルートの下に組む(ファイルは作らない)。判定は
# `cases-report.sh` の `hook_verdict_by_permission`。
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
. "$lib_dir/cases-report.sh"
. "$lib_dir/cases-fixtures.sh"

hook="$lib_dir/../block-parent-session-edit.sh"
record_hook="$lib_dir/../record-firings.sh"
repo_root="$(cd "$lib_dir/../../.." && pwd)"

TMPDIR="$(mktemp -d)"
export TMPDIR
trap 'rm -rf "$TMPDIR"' EXIT

# セッションの見出しを発火ログに書かせ、続けて起動したものを順に書かせる。
#
# $1 セッション
# $2 以降 起動したもの(起動した順。`agent:<subagent_type>` はサブエージェント、それ以外はスキル)
write_firings_log() {
  local session="$1" fired
  shift
  printf '{"session_id":"%s","hook_event_name":"SessionStart"}' "$session" | bash "$record_hook"
  for fired in "$@"; do
    if [[ "$fired" == agent:* ]]; then
      printf '{"session_id":"%s","hook_event_name":"PostToolUse","tool_name":"Agent","tool_input":{"subagent_type":"%s","prompt":"x"}}' \
        "$session" "${fired#agent:}" | bash "$record_hook"
      continue
    fi
    printf '{"session_id":"%s","hook_event_name":"PostToolUse","tool_name":"Skill","tool_input":{"skill":"%s"}}' \
      "$session" "$fired" | bash "$record_hook"
  done
}

# Edit / Write の PreToolUse の入力を組む。
#
# $1 セッション
# $2 session_id と tool_input の間に挟むフィールド(`tool_name` を含み、`,` で終わる JSON)
# $3 tool_input の中身(`{` `}` を除いた JSON)
edit_input() {
  printf '{"session_id":"%s",%s"tool_input":{%s}}' "$1" "$2" "$3"
}

# Edit / Write の PreToolUse を 1 回流し、判定を返す。
#
# $1 セッション
# $2 session_id と tool_input の間に挟むフィールド(`edit_input` と同じ)
# $3 tool_input の中身(`edit_input` と同じ)
edit_verdict() {
  edit_input "$@" | hook_verdict_by_permission "$hook"
}

parent_edit='"hook_event_name":"PreToolUse","tool_name":"Edit",'
parent_write='"hook_event_name":"PreToolUse","tool_name":"Write",'
subagent_edit="$(subagent_call_fields Edit)"
subagent_write="$(subagent_call_fields Write)"
agent_id_only_edit='"agent_id":"ab90e859b438c06a1","hook_event_name":"PreToolUse","tool_name":"Edit",'

in_repo="$repo_root/src/parent-session-edit-probe.ts"
edit_in_repo="\"file_path\":\"$in_repo\",\"old_string\":\"a\",\"new_string\":\"b\""
write_in_repo="\"file_path\":\"$in_repo\",\"content\":\"x\""

write_firings_log s1 implementation-flow
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
relative_verdict="$(
  cd "$repo_root" || exit 1
  edit_input s1 "$parent_edit" "$edit_in_repo" | hook_verdict_by_permission ./.claude/hooks/block-parent-session-edit.sh
)"
report deny "$relative_verdict" "リポジトリルートから相対パスでフックを呼んでも、implementation-flow の中の親の Edit は拒否される"

write_firings_log s2 implementation-flow harness-record
report pass "$(edit_verdict s2 "$parent_edit" "$edit_in_repo")" "implementation-flow の後に harness-record を起動したら、親の Edit は通る"

write_firings_log s3 implementation-flow harness-growth
report pass "$(edit_verdict s3 "$parent_edit" "$edit_in_repo")" "implementation-flow の後に harness-growth を起動したら、親の Edit は通る"

write_firings_log s4 harness-record implementation-flow
report deny "$(edit_verdict s4 "$parent_edit" "$edit_in_repo")" "harness-record の後に implementation-flow を起動したら、親の Edit は拒否される"

write_firings_log s5 implementation-flow claim-verification pr-explain
report deny "$(edit_verdict s5 "$parent_edit" "$edit_in_repo")" "implementation-flow の後に区切りでないスキルを起動しても、親の Edit は拒否され続ける"

write_firings_log s6 implementation-flow harness-record claim-verification
report pass "$(edit_verdict s6 "$parent_edit" "$edit_in_repo")" "harness-record の後に区切りでないスキルを起動しても、親の Edit は通り続ける"

report pass "$(edit_verdict s7 "$parent_edit" "$edit_in_repo")" "発火ログが無いセッションでは、親の Edit は通る"

write_firings_log s8
report pass "$(edit_verdict s8 "$parent_edit" "$edit_in_repo")" "発火ログが見出しだけのセッションでは、親の Edit は通る"

write_firings_log s9 implementation-flow
write_firings_log s10
report pass "$(edit_verdict s10 "$parent_edit" "$edit_in_repo")" "別のセッションで implementation-flow を起動していても、このセッションの親の Edit は通る"

write_firings_log s11 implementation-flow
report deny "$(edit_verdict s11 "$parent_write" "\"file_path\":\"$in_repo\",\"content\":\"{\\\"agent_id\\\":\\\"x\\\"}\"")" "Write の content に agent_id の綴りがあっても、親の Write は拒否される"
report deny "$(edit_verdict s11 "$parent_edit" "\"file_path\":\"$in_repo\",\"old_string\":\"a\",\"new_string\":\"{\\\"agent_id\\\":\\\"x\\\"}\"")" "Edit の new_string に agent_id の綴りがあっても、親の Edit は拒否される"
report deny "$(edit_verdict s11 "$parent_edit" "\"file_path\":\"$in_repo\",\"old_string\":\"{\\\"agent_id\\\":\\\"x\\\"}\",\"new_string\":\"b\"")" "Edit の old_string に agent_id の綴りがあっても、親の Edit は拒否される"

write_firings_log s12 x-implementation-flow
report pass "$(edit_verdict s12 "$parent_edit" "$edit_in_repo")" "名前が implementation-flow で終わるだけの別のスキルは区切りにならず、親の Edit は通る"

write_firings_log s13 agent:planner
report deny "$(edit_verdict s13 "$parent_edit" "$edit_in_repo")" "planner を起動した後は、implementation-flow のスキルの起動が無くても親の Edit は拒否される"

write_firings_log s14 agent:implementer
report deny "$(edit_verdict s14 "$parent_edit" "$edit_in_repo")" "implementer を起動した後は、implementation-flow のスキルの起動が無くても親の Edit は拒否される"

write_firings_log s15 agent:planner harness-record
report pass "$(edit_verdict s15 "$parent_edit" "$edit_in_repo")" "planner の後に harness-record を起動したら、親の Edit は通る"

write_firings_log s16 harness-record agent:implementer
report deny "$(edit_verdict s16 "$parent_edit" "$edit_in_repo")" "harness-record の後に implementer を起動したら、親の Edit は拒否される"

write_firings_log s17 agent:x-planner agent:x-implementer
report pass "$(edit_verdict s17 "$parent_edit" "$edit_in_repo")" "名前が planner / implementer で終わるだけの別のエージェントは区切りにならず、親の Edit は通る"

write_firings_log s18 agent:plan-reviewer agent:test-reviewer agent:Explore
report pass "$(edit_verdict s18 "$parent_edit" "$edit_in_repo")" "planner / implementer 以外のエージェントを起動しただけでは、親の Edit は通る"

# session_id の無い入力のログは、書く側では `unknown` のパスに落ちる。そこに区切りがあっても読まない。
write_firings_log unknown implementation-flow
report pass "$(printf '{%s"tool_input":{%s}}' "$parent_edit" "$edit_in_repo" | hook_verdict_by_permission "$hook")" "session_id の無い入力は通る"

# 拒否文は implementer へ渡すことだけを伝え、区切りになるスキルの名前を出さない。
reason_mentions_harness_skill=no
[[ "$(edit_input s1 "$parent_edit" "$edit_in_repo" | bash "$hook")" == *harness-* ]] && reason_mentions_harness_skill=yes
report no "$reason_mentions_harness_skill" "拒否文に、区切りになるスキル(harness-)の名前が出ない"

exit "$cases_failed"
