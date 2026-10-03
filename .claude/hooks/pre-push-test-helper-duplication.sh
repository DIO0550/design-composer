#!/usr/bin/env bash
#
# push 前のテストヘルパーの重複検査: git push の実行前に `src/` の `__tests__/` を横断し、
# 本体が一字一句同じヘルパーが 2 つ以上あれば push をブロックする PreToolUse フック。
#
# 対応する規約: rules/testing.md「テスト用ヘルパーの置き場所」
#   「同じヘルパーを2つ以上のテストファイルに書いたら、その時点で共通化する」
#
# 判定は lib/duplicate-test-helpers.py（編集時の check-test-helper-duplication.sh と共有）。
# deny の組み立ては lib/pre-push-detector.sh。`src/` 全体を見る理由は
# README.md「例外(エスケープハッチ)」に一本化してある。
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$hook_dir/lib/pre-push-detector.sh"

deny_on_all_src_failure \
  "$hook_dir/lib/duplicate-test-helpers.py" \
  "テストヘルパーの重複" \
  "直してから再度 push してください（rules/testing.md「テスト用ヘルパーの置き場所」）。"
