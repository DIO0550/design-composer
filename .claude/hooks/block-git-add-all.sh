#!/usr/bin/env bash
#
# 一括ステージングの禁止: `git add -A` / `git add --all` / `git add .` / `git add -a` を拒否する PreToolUse フック。
# 由来: d-market-git / git-workflow-plugin の no-git-add-all.sh（1135a0d）
#
# 方針: ステージするファイルはパスで指定する。
#
# 入力: stdin に { "tool_input": { "command": "..." } } を含む JSON (Bash ツール呼び出し)
# 出力: 違反時に permissionDecision=deny の JSON を返す。問題なければ exit 0。
exit 0
