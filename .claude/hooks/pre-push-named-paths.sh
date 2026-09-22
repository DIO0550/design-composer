#!/usr/bin/env bash
#
# push 前の名指ししたパスの検査: git push の実行前にリポジトリの説明（コメントと Markdown）を
# 走査し、名指ししているパスに当たる実体が無ければ push をブロックする PreToolUse フック。
#
# 対応する規範は rules/ に無い。機械で判定できるのでフックだけが持つ
#   （AGENTS.md「規約の更新」の「ルールに書くくらいならフックにする」）。フォルダを動かしても
#   書き換わるのは import だけで、説明の中の綴りは黙って古い位置を指したまま残る。
#
# 判定は lib/named-path-violations.py。deny の組み立ては lib/pre-push-detector.sh。
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$hook_dir/lib/pre-push-detector.sh"

deny_on_violations \
  "$hook_dir/lib/named-path-violations.py" \
  "名指ししたパス" \
  "コメント・doc に書くパスは、リポジトリルートか src/ からの綴りで、実体のある位置を指してください（フォルダを動かした回は、その差分で説明の綴りも直す）。"
