#!/usr/bin/env bash
#
# 作業ツリーを書き換えるサブエージェント(対象は下の case)が実行中かどうかを、セッション別の
# マーカーで記録する PreToolUse + PostToolUse フック(matcher: Task|Agent)。
# `run_in_background: true` を明示した起動は拒否する。block-git-during-verification-agent.sh が
# このマーカーを読む。
#
# 対応する規約: implementation-flow「サブエージェントの使い方」。
# test-reviewer がミューテーションを当てている最中や implementer が実装を書いている最中に
# git add が走ると、その瞬間の書き換えをコミットへ取り込んで CI が落ちる。呼び出し側が git 操作と
# Task を並列で呼ぶこと自体は通常のツール利用として推奨されているため、規約だけでは防げない。
#
# 呼び出し単位では相関を取らない。PreToolUse/PostToolUse の JSON に呼び出しを一意に
# 結び付ける ID が無い(record-firings.sh も session_id 単位でしか束ねていない)。
# 個々の呼び出しへ対応付けず、マーカーファイルの数だけで「現在何件実行中か」を見る
# (FIFO: 開始で1つ作り、終了で同じ種類の最も古い1つを消す。どれを消すかを問わなくても
# 種類ごとの総数は合う)。ファイル名に種類を入れるのは、印の有効期間を種類で変えるため
# (block-git-during-verification-agent.sh)。
#
# 「終了」は Task/Agent の PostToolUse で、エージェントの完了ではない。背景で起動すると
# PostToolUse が起動の直後に来るので、実行中でも印は残らない(実測)。そのため対象の
# エージェントは `run_in_background: true` を明示した起動を PreToolUse で拒否し、印も作らない。
# 塞いでいないのは、`false` を渡しても実行環境が背景で起動した場合(記録が複数ある)と、
# 前面で起動したあと背景へ移した場合。どちらも入力には現れず、PostToolUse がいつ来るかも
# 実測できていない(エージェントの完了で印を消す形は未着手)。
#
# planner など、道具か定義で作業ツリーを書き換えないエージェントは対象外。対象にすると背景で
# 起動できなくなり、定義に反した書き換えは返った後の `git status` で見つかる
# (implementation-flow「サブエージェントの使い方」)。
set -uo pipefail

input="$(cat)"
extract() {
  local pattern="\"$1\"[[:space:]]*:[[:space:]]*\"([^\"]*)\""
  [[ "$input" =~ $pattern ]] && printf '%s' "${BASH_REMATCH[1]}"
}

tool_name="$(extract tool_name)"
event_name="$(extract hook_event_name)"
case "$tool_name" in
  Task | Agent) ;;
  *) exit 0 ;;
esac

subagent_type="$(extract subagent_type)"
# 作業ツリーを書き換えるサブエージェント。plan-reviewer / test-reviewer は実測のために一時的に
# 書き換えうる。implementer は実装を書く。
case "$subagent_type" in
  plan-reviewer | test-reviewer | implementer) ;;
  *) exit 0 ;;
esac

# 真偽値は引用符で囲まれないので extract() では読めない。prompt 本文に同じ綴りがあっても、
# JSON 文字列の中では引用符が \" にエスケープされるのでこの形には当たらない。
# 拒否を返してよいのは PreToolUse だけ(PostToolUse の時点ではもう起動している)。
background_pattern='"run_in_background"[[:space:]]*:[[:space:]]*true'
launching_in_background=false
if [ "$event_name" = "PreToolUse" ] && [[ "$input" =~ $background_pattern ]]; then
  launching_in_background=true
fi
if [ "$launching_in_background" = true ]; then
  cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "作業ツリーを書き換えるサブエージェントは背景で起動できません(分類: subagent-control)。背景で起動すると実行中の印が起動の直後に消え、作業ツリーを書き換えている途中の git add / commit / push を止められません。run_in_background を付けずに前面で起動し直してください。"
  }
}
JSON
  exit 0
fi

session_id="$(extract session_id)"
lock_dir="${TMPDIR:-/tmp}/design-composer-verification-agents-${session_id:-unknown}"
mkdir -p "$lock_dir" 2>/dev/null || exit 0

case "$event_name" in
  PreToolUse)
    mktemp "$lock_dir/active.$subagent_type.XXXXXX" >/dev/null 2>&1 || true
    ;;
  PostToolUse)
    oldest="$(ls -1t "$lock_dir"/active."$subagent_type".* 2>/dev/null | tail -1)"
    [ -n "$oldest" ] && rm -f "$oldest" 2>/dev/null
    ;;
esac
exit 0
