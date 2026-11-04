#!/usr/bin/env bash
#
# スキル・サブエージェントの発火ログのパス。コードで組み立てるのは、書く `record-firings.sh` と読む
# `block-parent-session-edit.sh` の 2 本で、この 2 本の間で組み立てを割らないために 1 箇所に置く。
# `harness-record` の SKILL.md と `.claude/hooks/README.md` で手で打つコマンドは、パスをリテラルで書いている。

# セッションの発火ログのパスを出す。
#
# $1 session_id(空なら `unknown`)
# 出力: `${TMPDIR:-/tmp}/design-composer-firings-<session_id>.log`
firings_log_path() {
  printf '%s' "${TMPDIR:-/tmp}/design-composer-firings-${1:-unknown}.log"
}
