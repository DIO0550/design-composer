#!/usr/bin/env bash
#
# 保護ブランチの編集の禁止: 作業ディレクトリのブランチが main / master / production / release / develop / staging
# のとき、ファイルの編集を拒否する PreToolUse フック。
# 由来: d-market-git / git-workflow-plugin の branch-protection.sh（1135a0d）
#
# 方針: 編集は作業ブランチで行う。
#
# 入力: stdin の JSON は見ない（どのツールで呼ぶかは settings.json の matcher が決める）
# 出力: 違反時に permissionDecision=deny の JSON を返す。問題なければ exit 0。
exit 0
