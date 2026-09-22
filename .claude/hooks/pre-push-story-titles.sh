#!/usr/bin/env bash
#
# push 前の story の title 検査: git push の実行前に `src/` の story を走査し、`title` が
# フォルダ階層と食い違っていれば push をブロックする PreToolUse フック。
#
# 対応する規範は rules/ に無い。機械で判定できるのでフックだけが持つ
#   （AGENTS.md「規約の更新」の「ルールに書くくらいならフックにする」）。Storybook のツリーは
#   `title` の綴りだけで組まれるが、`title` はフォルダから導出されず手で書く文字列なので、
#   フォルダを動かしても黙って古い位置に残る。
#
# 判定は lib/story-title-violations.py。deny の組み立ては lib/pre-push-detector.sh。
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$hook_dir/lib/pre-push-detector.sh"

deny_on_violations \
  "$hook_dir/lib/story-title-violations.py" \
  "story の title" \
  "story の title は、最後のセグメント（葉に出る表示名）を除いてフォルダ階層と揃えてください（feature の連なりをそのまま書き、components/ のフォルダは落とす）。"
