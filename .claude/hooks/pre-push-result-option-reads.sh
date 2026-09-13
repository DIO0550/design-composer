#!/usr/bin/env bash
#
# push 前の判別子の直読み検査: git push の実行前に `src/` を走査し、`Result` / `Option`
# の判別子（`ok` / `some`）を定義元の外で直読みしている箇所があれば push をブロックする
# PreToolUse フック。
#
# 対応する規約: rules/coding.md「エラーと不在の表現」。在／不在・成否の判定は
#   `Option.isSome` / `Result.isOk` を通し、判別子を直接読んでよいのは、その判別子を
#   型宣言で定義しているファイルの中だけ。
#
# 判定は lib/result-option-read-violations.py、deny の組み立ては lib/pre-push-detector.sh。
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$hook_dir/lib/pre-push-detector.sh"

deny_on_violations \
  "$hook_dir/lib/result-option-read-violations.py" \
  "判別子の直読み" \
  "在／不在は Option.isSome、成否は Result.isOk で判定してください。判別子（ok / some）を直接読んでよいのは、その判別子を型宣言で定義しているファイルの中だけです（rules/coding.md「エラーと不在の表現」）。"
