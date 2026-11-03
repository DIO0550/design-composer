#!/usr/bin/env bash
#
# implementation-flow の中で、親セッションがリポジトリの中のファイルを Edit / Write するのを拒否する
# PreToolUse フック(matcher: Edit|Write)。サブエージェントの編集と、リポジトリの外のファイルと、
# implementation-flow の外(harness-record / harness-growth)での親の編集は止めない。
#
# 対応する規約: implementation-flow「役割の分担」の「親はリポジトリの中のファイルを編集しない」。
#
# 親とサブエージェントは入力の `agent_id` で見分ける。サブエージェントの中の Edit / Write の PreToolUse には
# `agent_id` / `agent_type` が載り、親の呼び出しには無く、`session_id` は共通だった(#1032 の実測。
# harness/case-law/process.md「サブエージェントの起動とフックの入力を実測した」)。PostToolUse に
# `agent_id` が載るかは測っていないので、PreToolUse に置く。
#
# implementation-flow の中かどうかは、record-firings.sh が書く発火ログの区切りで決める。中に入る区切りは
# スキル implementation-flow とエージェント planner / implementer の起動、外へ出る区切りはスキル
# harness-record / harness-growth の起動で、最後に当たった区切りが中に入る側なら拒否する。ログが無い・
# 区切りが 1 つも無い・session_id が無いなら外として通す(区切りが見えないまま止めると、フローの外の
# 編集まで止まる)。
#
# planner / implementer を呼ぶのは implementation-flow だけ(planner はフェーズ 3・4、implementer は 5〜7)なので、
# 起動されていれば flow の中と言える。Skill ツールを経ずに手順を読んで進める回は、スキルの起動がログに残らない。
# flow の始まりに Skill ツールでの起動を規約で求める案は採らない(指示頼みで、まさにそこが守られない)。
#
# リポジトリのルートは CLAUDE_PROJECT_DIR ではなく、このファイルの置き場所から辿る。セッションの中で
# 見た CLAUDE_PROJECT_DIR は空だった(フックのプロセスから見た値は測っていない)。
#
# 層 3(ここ)にしか置けない。誰が編集したかはコミットに残らないので、git hooks と CI では代替できない
# (.claude/hooks/README.md「カバー範囲と残る穴」)。
#
# 共有部品を読めなければ通す。読めないまま止める側に倒すと、サブエージェントかどうかも判定できずに
# 全員の Edit / Write を止める。
set -uo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
repo_root="$(cd "$hook_dir/../.." && pwd)" || exit 0
. "$hook_dir/lib/hook-input.sh" || exit 0
. "$hook_dir/lib/firings-log.sh" || exit 0

input="$(cat)"

# 本文(content / new_string / old_string)に同じ綴りがあっても、JSON 文字列の中では引用符が \" に
# エスケープされるのでこの形には当たらない。
in_subagent_pattern='"agent_id"[[:space:]]*:'
[[ "$input" =~ $in_subagent_pattern ]] && exit 0

# repo_root は絶対パスなので、空・相対の file_path もこの前方一致で外れる。
file_path="$(extract file_path)"
[[ "$file_path" == "$repo_root"/* ]] || exit 0

session_id="$(extract session_id)"
[ -n "$session_id" ] || exit 0
log_file="$(firings_log_path "$session_id")"
[ -f "$log_file" ] || exit 0

flow_entry_pattern=$'\t(skill\timplementation-flow|agent\t(planner|implementer))$'
flow_exit_pattern=$'\tskill\t(harness-record|harness-growth)$'
last_flow_boundary="$(grep -E -e "$flow_entry_pattern" -e "$flow_exit_pattern" "$log_file" 2>/dev/null | tail -n 1)"
[[ "$last_flow_boundary" =~ $flow_entry_pattern ]] || exit 0

cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "implementation-flow の中で、親セッションがリポジトリの中のファイルを編集しようとしています(分類: subagent-control)。implementation-flow では親は指示役で、編集は implementer が担います(implementation-flow「役割の分担」)。この Edit / Write は implementer に渡してください。"
  }
}
JSON
exit 0
