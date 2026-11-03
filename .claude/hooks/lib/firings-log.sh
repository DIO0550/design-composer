#!/usr/bin/env bash
#
# スキル・サブエージェントの発火ログのパス。書くのは `record-firings.sh`、読むのは
# `harness-record` スキルと `block-parent-session-edit.sh`。書く側と読む側でパスの組み立てを割らない
# ために 1 箇所に置く。

# セッションの発火ログのパスを出す。
#
# $1 session_id(空なら `unknown`)
# 出力: `${TMPDIR:-/tmp}/design-composer-firings-<session_id>.log`
firings_log_path() {
  printf '%s' "${TMPDIR:-/tmp}/design-composer-firings-${1:-unknown}.log"
}
