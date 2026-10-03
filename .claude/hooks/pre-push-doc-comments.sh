#!/usr/bin/env bash
#
# push 前の doc コメント検査: git push の実行前に `src/` の実装ファイルを検査し、
# doc コメントの無い宣言と、項目の欠けた doc があれば push をブロックする PreToolUse フック。
#
# 対応する規約: rules/coding.md「コメントは doc と Why / Why not に絞る」の 1 つ目
#   「doc としての説明」と、その下の「doc に書く項目」
#
# 見るのは `src/` の実装ファイルのみ（`__tests__/` / `*.stories.*` / `__stories__/` は
# 対象外）。判定は lib/missing-doc-comments.py。deny の組み立ては lib/pre-push-detector.sh。
#
# `src/` 全体を見る理由と、doc の有無と項目（`@param` / `@returns` / `@throws`）の両方を
# 見る理由は README.md「例外(エスケープハッチ)」に一本化してある。
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$hook_dir/lib/pre-push-detector.sh"

deny_on_all_src_failure \
  "$hook_dir/lib/missing-doc-comments.py" \
  "doc コメント" \
  "その関数・型・定数が何かに加え、引数は @param、戻り値は @returns、投げる例外は @throws を書いてから再度 push してください（rules/coding.md「doc に書く項目」）。"
