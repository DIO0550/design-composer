#!/usr/bin/env bash
#
# `core.hooksPath` を harness/githooks へ向ける。
#
# package.json の `prepare` から呼ばれるので、`pnpm install` を通ったどの環境でも
# push 前検査が配線される。DevContainer の `postCreateCommand` にも同じ設定があるが、
# そちらはリモート実行環境(Claude Code on the web など)やただの `git clone` では
# 走らない。**Claude Code のフックが読まれない環境と、DevContainer が使われない環境は
# 同じ**なので、配線が片方だけ残ると「フックが不発でも git hooks が守る」という
# 序列(.claude/hooks/README.md「強制力の序列」)が両方同時に抜ける。
#
# 失敗しても `pnpm install` は止めない。依存として取り込まれた場合や git の無い環境で
# インストールごと落とすと、検査のための設定が開発そのものを妨げることになる。
set -uo pipefail

if ! command -v git >/dev/null 2>&1; then
  echo "githooks: git が無いため core.hooksPath の設定を飛ばします" >&2
  exit 0
fi

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "githooks: git リポジトリではないため core.hooksPath の設定を飛ばします" >&2
  exit 0
fi

if ! git config core.hooksPath harness/githooks; then
  echo "githooks: core.hooksPath の設定に失敗しました。手で 'git config core.hooksPath harness/githooks' を実行してください" >&2
  exit 0
fi

echo "githooks: core.hooksPath = harness/githooks"
