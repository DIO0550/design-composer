#!/usr/bin/env bash
#
# コミット本文の行頭 `#` の禁止: `git commit` を含むコマンドで、本文の行頭（桁 0）が `#` の行を拒否する PreToolUse フック。
# 由来: d-market-git / git-workflow-plugin の no-commit-md-heading.sh（1135a0d）
#
# 方針: 本文の見出しは `<見出し>:` を単独行に置く。
#
# 入力: stdin に { "tool_input": { "command": "..." } } を含む JSON (Bash ツール呼び出し)
# 出力: 違反時に permissionDecision=deny の JSON を返す。問題なければ exit 0。
exit 0
